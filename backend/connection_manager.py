from typing import Dict, List, Optional
from fastapi import WebSocket
from .models import Session, SessionSnapshot, User, Participant, ParticipantRole, ParticipantStatus, SessionPhase, SessionSettings, Vote, JobRole, WorkItem, VoteValue
from datetime import datetime
import asyncio
import random
import uuid

class ConnectionManager:
    def __init__(self):
        # Map sessionId -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # In-memory session store: sessionId -> Session
        self.sessions: Dict[str, Session] = {}

    async def connect(self, websocket: WebSocket, session_id: str, user: User):
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

        # Initialize session if not exists
        if session_id not in self.sessions:
            self._create_session(session_id, user)
        
        # Add or update participant
        self._add_participant(session_id, user)
        
        await self.broadcast_snapshot(session_id)

    def disconnect(self, websocket: WebSocket, session_id: str, user_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
                
            session = self.sessions.get(session_id)
            if session:
                for p in session.participants:
                    if p.id == user_id:
                        p.status = ParticipantStatus.DISCONNECTED
                        break

    async def kick_participant(self, session_id: str, user_id: str):
        session = self.sessions.get(session_id)
        if not session:
            return

        # Remove from participants list
        session.participants = [p for p in session.participants if p.id != user_id]
        
        # Remove any votes
        if user_id in session.votes:
            del session.votes[user_id]
        
        await self.broadcast_snapshot(session_id)

    async def add_work_item(self, session_id: str, title: str, description: Optional[str] = None):
        session = self.sessions.get(session_id)
        if not session:
            return

        new_item = WorkItem(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            agreedEstimate=None
        )
        session.workItems.append(new_item)
        
        # If no active item, make this one active
        if not session.activeWorkItemId:
            session.activeWorkItemId = new_item.id

        await self.broadcast_snapshot(session_id)

    async def set_active_work_item(self, session_id: str, work_item_id: str):
        session = self.sessions.get(session_id)
        if not session:
            return

        # Verify item exists
        item = next((i for i in session.workItems if i.id == work_item_id), None)
        if not item:
            return

        session.activeWorkItemId = work_item_id
        
        # Reset votes for the new round
        session.votes = {}
        session.phase = SessionPhase.VOTING
        for p in session.participants:
            p.hasVoted = False
            
        await self.broadcast_snapshot(session_id)

    async def set_agreed_estimate(self, session_id: str, work_item_id: str, estimate: VoteValue):
        session = self.sessions.get(session_id)
        if not session:
            return
            
        item = next((i for i in session.workItems if i.id == work_item_id), None)
        if item:
            item.agreedEstimate = estimate
            await self.broadcast_snapshot(session_id)

    async def reset_session(self, session_id: str):
        # Notify all clients to kill their local session
        message = '{"event": "session_reset"}'
        
        connections = self.active_connections.get(session_id, [])
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass
                
        # Wait for messages to be sent before closing
        await asyncio.sleep(0.1)

        # Close all connections
        for connection in list(connections):
             try:
                 await connection.close()
             except Exception:
                 pass
        
        # Clear data
        if session_id in self.sessions:
            del self.sessions[session_id]
            
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def broadcast_snapshot(self, session_id: str):
        session = self.sessions.get(session_id)
        if not session:
            return

        connections = self.active_connections.get(session_id, [])
        
        snapshot = SessionSnapshot(
            session=session,
            timestamp=datetime.now(),
            sequenceId=int(datetime.now().timestamp() * 1000)
        )
        
        data = snapshot.model_dump_json()
        
        to_remove = []
        for connection in connections:
            try:
                await connection.send_text(data)
            except Exception:
                to_remove.append(connection)
        
        for conn in to_remove:
            if conn in connections:
                connections.remove(conn)

    def get_session(self, session_id: str) -> Optional[Session]:
        return self.sessions.get(session_id)

    def _create_session(self, session_id: str, creator: User):
        settings = SessionSettings(
            cardDeck=['0', '1', '2', '3', '5', '8', '13', '21', '?', 'coffee'],
            autoReveal=False
        )
        
        self.sessions[session_id] = Session(
            id=session_id,
            name=f"Session {session_id}",
            moderatorId=creator.id,
            participants=[],
            workItems=[],
            activeWorkItemId=None,
            phase=SessionPhase.VOTING,
            votes={},
            settings=settings
        )

    def _add_participant(self, session_id: str, user: User):
        session = self.sessions.get(session_id)
        if not session:
            return

        existing = next((p for p in session.participants if p.id == user.id), None)
        
        if existing:
            existing.status = ParticipantStatus.CONNECTED
            existing.name = user.name
            existing.avatarUrl = user.avatarUrl
            existing.jobRole = user.jobRole or JobRole.DEVELOPER # Update role if changed
        else:
            # First participant becomes Moderator
            if len(session.participants) == 0:
                role = ParticipantRole.MODERATOR
            else:
                # Admins are observers, others are voters
                if user.jobRole == JobRole.ADMIN:
                    role = ParticipantRole.OBSERVER
                else:
                    role = ParticipantRole.VOTER
            
            new_participant = Participant(
                **user.model_dump(),
                role=role,
                status=ParticipantStatus.CONNECTED,
                hasVoted=False
            )
            session.participants.append(new_participant)

manager = ConnectionManager()
