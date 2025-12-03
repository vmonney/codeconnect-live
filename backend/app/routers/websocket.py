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
    db: Session = Depends(get_db),
):
    """WebSocket endpoint for real-time interview collaboration"""

    # Authenticate user via JWT token
    email = decode_access_token(token)
    if not email:
        await websocket.close(code=4001, reason="Invalid token")
        return

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

    # Connect user
    user_data = {"name": user.name, "role": user.role.value, "avatar": user.avatar}
    await manager.connect(interview_id, user.id, user_data, websocket)

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
                # Broadcast code changes to other participants
                await manager.broadcast(
                    interview_id,
                    {
                        "type": "code_update",
                        "code": data.get("code"),
                        "user_id": user.id,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    exclude_user=user.id,
                )

                # Update interview code in database
                interview.code = data.get("code")
                interview.updated_at = datetime.utcnow()
                db.commit()

            elif event_type == "cursor_update":
                # Broadcast cursor position
                await manager.broadcast(
                    interview_id,
                    {
                        "type": "cursor_update",
                        "user_id": user.id,
                        "position": data.get("position"),  # {line, column}
                    },
                    exclude_user=user.id,
                )

            elif event_type == "chat_message":
                # Save message to database
                message = ChatMessage(
                    id=str(uuid4()),
                    interview_id=interview_id,
                    user_id=user.id,
                    user_name=user.name,
                    message=data.get("message"),
                    timestamp=datetime.utcnow(),
                )
                db.add(message)
                db.commit()

                # Broadcast to all participants
                await manager.broadcast(
                    interview_id,
                    {
                        "type": "chat_message",
                        "id": message.id,
                        "user_id": user.id,
                        "user_name": user.name,
                        "message": message.message,
                        "timestamp": message.timestamp.isoformat(),
                    },
                )

            elif event_type == "typing":
                # Broadcast typing indicator
                await manager.broadcast(
                    interview_id,
                    {
                        "type": "typing",
                        "user_id": user.id,
                        "is_typing": data.get("is_typing"),
                    },
                    exclude_user=user.id,
                )

            elif event_type == "language_change":
                # Broadcast language change
                interview.language = data.get("language")
                db.commit()

                await manager.broadcast(
                    interview_id,
                    {
                        "type": "language_change",
                        "language": data.get("language"),
                        "user_id": user.id,
                    },
                )

            elif event_type == "interview_status":
                # Update interview status
                status = data.get("status")
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

                await manager.broadcast(
                    interview_id,
                    {
                        "type": "interview_status",
                        "status": status,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                )

    except WebSocketDisconnect:
        manager.disconnect(interview_id, user.id)

        # Notify others that user left
        await manager.broadcast(
            interview_id,
            {
                "type": "participant_left",
                "user_id": user.id,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
