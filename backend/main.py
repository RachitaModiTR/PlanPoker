from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from .connection_manager import manager
from .models import User, ClientEvent, Vote, SessionPhase, JobRole
from datetime import datetime
import json

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    session_id: str,
    userId: str = Query(...),
    name: str = Query(...),
    avatarUrl: str = Query(None),
    jobRole: str = Query("Developer") # Default if missing
):
    # Normalize job role string to Enum
    try:
        role_enum = JobRole(jobRole)
    except ValueError:
        role_enum = JobRole.DEVELOPER

    user = User(id=userId, name=name, avatarUrl=avatarUrl, jobRole=role_enum)
    
    await manager.connect(websocket, session_id, user)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                event = message.get("event")
                payload = message.get("payload")
                
                await handle_event(session_id, user.id, event, payload)
                
            except json.JSONDecodeError:
                print("Failed to decode JSON")
            except Exception as e:
                print(f"Error handling event: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id, user.id)
        await manager.broadcast_snapshot(session_id)

async def handle_event(session_id: str, user_id: str, event: str, payload: dict):
    session = manager.get_session(session_id)
    if not session:
        return

    # Check moderator permission helper
    is_moderator = False
    requester = next((p for p in session.participants if p.id == user_id), None)
    if requester and requester.role == "moderator":
        is_moderator = True

    # --- Event Handlers ---

    if event == "cast_vote":
        value = payload.get("value")
        
        # Update vote
        session.votes[user_id] = Vote(
            userId=user_id,
            value=value,
            timestamp=datetime.now()
        )
        
        # Update hasVoted status
        participant = next((p for p in session.participants if p.id == user_id), None)
        if participant:
            participant.hasVoted = True 
            
        await manager.broadcast_snapshot(session_id)

    elif event == "reveal_votes":
        if is_moderator:
            session.phase = SessionPhase.REVEALING
            await manager.broadcast_snapshot(session_id)

    elif event == "clear_votes":
        if is_moderator:
            session.votes = {}
            session.phase = SessionPhase.VOTING
            for p in session.participants:
                p.hasVoted = False
            await manager.broadcast_snapshot(session_id)
    
    elif event == "kick_participant":
        if is_moderator:
            target_id = payload.get("userId")
            if target_id:
                await manager.kick_participant(session_id, target_id)
                
    elif event == "add_work_item":
        if is_moderator:
            title = payload.get("title")
            description = payload.get("description")
            if title:
                await manager.add_work_item(session_id, title, description)
                
    elif event == "set_active_work_item":
        if is_moderator:
            work_item_id = payload.get("workItemId")
            if work_item_id:
                await manager.set_active_work_item(session_id, work_item_id)
        
    elif event == "join_session":
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
