from typing import List, Optional, Dict, Union, Any
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime

# --- Enums ---

class ParticipantRole(str, Enum):
    MODERATOR = "moderator"
    VOTER = "voter"
    OBSERVER = "observer"

class JobRole(str, Enum):
    ADMIN = "Admin"
    PRODUCT = "Product"
    DEVELOPER = "Developer"
    QA = "QA"

class ParticipantStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    IDLE = "idle"

class SessionPhase(str, Enum):
    LOBBY = "lobby"
    VOTING = "voting"
    REVEALING = "revealing"
    RESULTS = "results"

# VoteValue can be a number (points) or special strings ("?", "coffee")
VoteValue = Union[float, int, str, None]

# --- Entities ---

class User(BaseModel):
    id: str
    name: str
    avatarUrl: Optional[str] = None
    jobRole: Optional[JobRole] = JobRole.DEVELOPER # Default to Dev

class Participant(User):
    role: ParticipantRole
    status: ParticipantStatus
    hasVoted: bool
    jobRole: JobRole # Explicitly required for participant context

class Vote(BaseModel):
    userId: str
    value: VoteValue
    timestamp: datetime

class WorkItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    agreedEstimate: VoteValue = None
    linkUrl: Optional[str] = None

class SessionSettings(BaseModel):
    cardDeck: List[str]
    autoReveal: bool

class Session(BaseModel):
    id: str
    name: str
    moderatorId: str
    participants: List[Participant] = []
    workItems: List[WorkItem] = []
    activeWorkItemId: Optional[str] = None
    phase: SessionPhase = SessionPhase.LOBBY
    votes: Dict[str, Vote] = {}
    settings: SessionSettings

class SessionSnapshot(BaseModel):
    session: Session
    timestamp: datetime
    sequenceId: int

# --- WebSocket Events ---

class ClientEvent(BaseModel):
    event: str
    payload: Dict[str, Any]
