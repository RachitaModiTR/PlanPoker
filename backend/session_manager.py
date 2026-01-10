from typing import Dict, List, Optional
from fastapi import WebSocket
import json
from datetime import datetime
from pydantic import BaseModel

# Domain Models (matching frontend types)
class Vote(BaseModel):
    userId: str
    value: Optional[float | str] = None
    timestamp: str

class Participant(BaseModel):
    id: str
    name: str
    avatarUrl: str = ""
    role: str = "voter"
    status: str = "connected"
    hasVoted: bool = False

class WorkItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    agreedEstimate: Optional[float | str] = None
    linkUrl: Optional[str] = None

class SessionSettings(BaseModel):
    cardDeck: List[str] = ['0', '1', '2', '3', '5', '8', '13', '21', '?', 'coffee']
    autoReveal: bool = False

class Session(BaseModel):
    id: str
    name: str
    moderatorId: str
    participants: List[Participant] = []
    workItems: List[WorkItem] = []
    activeWorkItemId: Optional[str] = None
    phase: str = "voting"  # 'lobby', 'voting', 'revealing', 'results'
    votes: Dict[str, Vote] = {}
    settings: SessionSettings = SessionSettings()

class SessionManager:
    def __init__(self):
        # In-memory storage: session_id -> Session
        self.sessions: Dict[str, Session] = {}
        # Active connections: session_id -> {user_id -> WebSocket}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    def create_session(self, session_id: str, moderator_id: str, work_items: List[Dict]):
        if session_id in self.sessions:
            return self.sessions[session_id]
            
        new_session = Session(
            id=session_id,
            name="New Session",
            moderatorId=moderator_id,
            participants=[],
            workItems=[WorkItem(**wi) for wi in work_items],
            activeWorkItemId=work_items[0]['id'] if work_items else None
        )
        self.sessions[session_id] = new_session
        self.active_connections[session_id] = {}
        return new_session

    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        await websocket.accept()
        
        if session_id not in self.sessions:
            # For simplicity, auto-create session or reject
            # Here we reject if not exists (except demo session created on startup)
            await websocket.close(code=4004, reason="Session not found")
            return

        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        
        self.active_connections[session_id][user_id] = websocket
        
        # Add or update participant
        session = self.sessions[session_id]
        
        # Check if user exists
        existing_participant = next((p for p in session.participants if p.id == user_id), None)
        
        if not existing_participant:
            # In a real app, we'd get name/avatar from auth token or handshake
            # For now, we assume frontend sends it or we use placeholder
            # We'll wait for a 'join_session' message to set the name
            pass 
        else:
            existing_participant.status = "connected"

        # Note: We don't broadcast immediately here, we wait for 'join_session' event 
        # from client which contains user details
        print(f"User {user_id} connected to session {session_id}")

    def disconnect(self, session_id: str, user_id: str):
        if session_id in self.active_connections:
            if user_id in self.active_connections[session_id]:
                del self.active_connections[session_id][user_id]
        
        if session_id in self.sessions:
            session = self.sessions[session_id]
            participant = next((p for p in session.participants if p.id == user_id), None)
            if participant:
                participant.status = "disconnected"
                asyncio.create_task(self.broadcast_snapshot(session_id))
        
        print(f"User {user_id} disconnected from session {session_id}")

    async def handle_message(self, session_id: str, user_id: str, message: Dict):
        if session_id not in self.sessions:
            return

        event = message.get("event")
        payload = message.get("payload", {})
        session = self.sessions[session_id]

        if event == "join_session":
            # Payload expects: { id, name, avatarUrl }
            user_data = payload.get("user", {})
            existing = next((p for p in session.participants if p.id == user_id), None)
            
            if not existing:
                new_participant = Participant(
                    id=user_id,
                    name=user_data.get("name", "Anonymous"),
                    avatarUrl=user_data.get("avatarUrl", ""),
                    role="moderator" if len(session.participants) == 0 else "voter",
                    status="connected"
                )
                session.participants.append(new_participant)
            else:
                existing.name = user_data.get("name", existing.name)
                existing.status = "connected"
            
            await self.broadcast_snapshot(session_id)

        elif event == "cast_vote":
            value = payload.get("value")
            
            # Record vote
            session.votes[user_id] = Vote(
                userId=user_id,
                value=value,
                timestamp=datetime.utcnow().isoformat()
            )
            
            # Update participant status
            participant = next((p for p in session.participants if p.id == user_id), None)
            if participant:
                participant.hasVoted = True
            
            await self.broadcast_snapshot(session_id)

        elif event == "reveal_votes":
            # Should check moderator permissions here
            session.phase = "revealing"
            await self.broadcast_snapshot(session_id)

        elif event == "clear_votes":
            # Should check moderator permissions here
            session.votes = {}
            session.phase = "voting"
            for p in session.participants:
                p.hasVoted = False
            await self.broadcast_snapshot(session_id)

    async def broadcast_snapshot(self, session_id: str):
        if session_id not in self.active_connections or session_id not in self.sessions:
            return

        session = self.sessions[session_id]
        
        # Prepare snapshot
        # Note: During 'voting' phase, we might want to mask votes if we were being strict security-wise
        # But for now we send full state and frontend hides it (trusting the client)
        # OR we can mask it here:
        
        session_dict = session.model_dump()
        
        # Mask votes if in voting phase
        if session.phase == "voting":
             # We still need to know WHO voted, but not WHAT
             # But our Vote model has 'value'. We can set value to null or some indicator
             masked_votes = {}
             for uid, vote in session.votes.items():
                 # Create a masked copy
                 masked_votes[uid] = {
                     "userId": uid,
                     "value": None, # Hide value
                     "timestamp": vote.timestamp
                 }
             session_dict['votes'] = masked_votes
        
        snapshot = {
            "session": session_dict,
            "timestamp": datetime.utcnow().isoformat(),
            "sequenceId": int(datetime.utcnow().timestamp() * 1000)
        }

        # Broadcast
        active_sockets = self.active_connections[session_id]
        disconnected_users = []

        message = json.dumps({"type": "snapshot", "data": snapshot})

        for uid, ws in active_sockets.items():
            try:
                await ws.send_text(message)
            except Exception:
                disconnected_users.append(uid)
        
        # Cleanup broken connections
        for uid in disconnected_users:
            self.disconnect(session_id, uid)

