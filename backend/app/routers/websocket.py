from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.interview import Interview
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.services.websocket_manager import manager
from app.utils.security import decode_access_token
from uuid import uuid4
from datetime import datetime

router = APIRouter(tags=["WebSocket"])


@router.websocket("/api/interviews/{interview_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    interview_id: str,
    token: str = Query(...),
):
    """WebSocket endpoint for real-time interview collaboration"""
    print(f"🔌 WebSocket connection attempt for interview: {interview_id}")

    # Authenticate user via JWT token
    email = decode_access_token(token)
    if not email:
        print(f"❌ WebSocket auth failed: Invalid token")
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Use short-lived DB session for authentication
    db = next(get_db())
    try:
        # Get user from database
        user = db.query(User).filter(User.email == email).first()
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return

        # Verify interview exists
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            await websocket.close(code=4004, reason="Interview not found")
            return

        # Store user info for later use (avoid keeping DB session open)
        user_id = user.id
        user_name = user.name
        user_role = user.role.value
        user_avatar = user.avatar
    finally:
        db.close()

    # Connect user
    user_data = {"name": user_name, "role": user_role, "avatar": user_avatar}
    print(f"✅ WebSocket authenticated: {user_name} ({user_role}) joining interview {interview_id}")
    await manager.connect(interview_id, user_id, user_data, websocket)
    print(f"🎉 WebSocket connected successfully for {user_name}")

    try:
        # Send current participants list to new user
        participants = manager.get_participants(interview_id)
        await manager.send_personal_message(
            {"type": "participants_list", "participants": participants}, websocket
        )

        # Main message loop
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")

            if event_type == "code_update":
                # Get code from message
                code = data.get("code")

                # Broadcast code changes to other participants FIRST (instant sync)
                await manager.broadcast(
                    interview_id,
                    {
                        "type": "code_update",
                        "code": code,
                        "user_id": user_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    exclude_user=user_id,
                )

                # Then update database (async, doesn't block real-time sync)
                db = next(get_db())
                try:
                    interview = db.query(Interview).filter(Interview.id == interview_id).first()
                    if interview:
                        interview.code = code
                        interview.updated_at = datetime.utcnow()
                        db.commit()
                finally:
                    db.close()

            elif event_type == "cursor_update":
                # Broadcast cursor position
                await manager.broadcast(
                    interview_id,
                    {
                        "type": "cursor_update",
                        "user_id": user_id,
                        "position": data.get("position"),  # {line, column}
                    },
                    exclude_user=user_id,
                )

            elif event_type == "chat_message":
                # Generate message metadata
                message_id = str(uuid4())
                timestamp = datetime.utcnow()
                message_text = data.get("message")

                # Broadcast to all participants FIRST for instant delivery
                await manager.broadcast(
                    interview_id,
                    {
                        "type": "chat_message",
                        "id": message_id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "message": message_text,
                        "timestamp": timestamp.isoformat(),
                    },
                )

                # Then save to database (async, doesn't block the UI)
                db = next(get_db())
                try:
                    message = ChatMessage(
                        id=message_id,
                        interview_id=interview_id,
                        user_id=user_id,
                        user_name=user_name,
                        message=message_text,
                        timestamp=timestamp,
                    )
                    db.add(message)
                    db.commit()
                finally:
                    db.close()

            elif event_type == "typing":
                # Broadcast typing indicator
                await manager.broadcast(
                    interview_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "is_typing": data.get("is_typing"),
                    },
                    exclude_user=user_id,
                )

            elif event_type == "language_change":
                # Update language in database with short-lived session
                db = next(get_db())
                try:
                    interview = db.query(Interview).filter(Interview.id == interview_id).first()
                    if interview:
                        interview.language = data.get("language")
                        db.commit()
                finally:
                    db.close()

                await manager.broadcast(
                    interview_id,
                    {
                        "type": "language_change",
                        "language": data.get("language"),
                        "user_id": user_id,
                    },
                )

            elif event_type == "interview_status":
                # Update interview status with short-lived session
                status = data.get("status")

                db = next(get_db())
                try:
                    interview = db.query(Interview).filter(Interview.id == interview_id).first()
                    if interview:
                        interview.status = status

                        if status == "in-progress" and not interview.started_at:
                            interview.started_at = datetime.utcnow()
                        elif status == "completed" and not interview.ended_at:
                            interview.ended_at = datetime.utcnow()
                            if interview.started_at:
                                duration = (
                                    interview.ended_at - interview.started_at
                                ).total_seconds() / 60
                                interview.duration = int(duration)

                        db.commit()
                finally:
                    db.close()

                await manager.broadcast(
                    interview_id,
                    {
                        "type": "interview_status",
                        "status": status,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                )

    except WebSocketDisconnect:
        manager.disconnect(interview_id, user_id)

        # Notify others that user left
        await manager.broadcast(
            interview_id,
            {
                "type": "participant_left",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
