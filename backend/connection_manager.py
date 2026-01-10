from typing import Dict, List, Optional
from fastapi import WebSocket
from .models import Session, SessionSnapshot, User, Participant, ParticipantRole, ParticipantStatus, SessionPhase, SessionSettings, Vote, JobRole
from datetime import datetime
import asyncio
import random

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
            role = ParticipantRole.MODERATOR if len(session.participants) == 0 else ParticipantRole.VOTER
            
            new_participant = Participant(
                **user.model_dump(),
                role=role,
                status=ParticipantStatus.CONNECTED,
                hasVoted=False
            )
            session.participants.append(new_participant)

manager = ConnectionManager()
