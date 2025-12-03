from fastapi import WebSocket
from typing import Dict, List
from datetime import datetime


class ConnectionManager:
    """Manages WebSocket connections for interview rooms"""

    def __init__(self):
        # Structure: {interview_id: {user_id: WebSocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # Track participant info: {interview_id: {user_id: participant_data}}
        self.participants: Dict[str, Dict[str, dict]] = {}

    async def connect(
        self, interview_id: str, user_id: str, user_data: dict, websocket: WebSocket
    ):
        """Accept new WebSocket connection"""
        await websocket.accept()

        # Initialize room if doesn't exist
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = {}
            self.participants[interview_id] = {}

        # Store connection and participant data
        self.active_connections[interview_id][user_id] = websocket
        self.participants[interview_id][user_id] = {
            "id": user_id,
            "name": user_data["name"],
            "role": user_data["role"],
            "avatar": user_data.get("avatar"),
            "isOnline": True,
            "cursorColor": self._assign_cursor_color(interview_id),
        }

        # Notify others that user joined
        await self.broadcast(
            interview_id,
            {
                "type": "participant_joined",
                "participant": self.participants[interview_id][user_id],
                "timestamp": datetime.utcnow().isoformat(),
            },
            exclude_user=user_id,
        )

    def disconnect(self, interview_id: str, user_id: str):
        """Remove WebSocket connection"""
        if interview_id in self.active_connections:
            self.active_connections[interview_id].pop(user_id, None)

            if interview_id in self.participants:
                self.participants[interview_id].pop(user_id, None)

            # Clean up empty rooms
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]
                if interview_id in self.participants:
                    del self.participants[interview_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific connection"""
        await websocket.send_json(message)

    async def broadcast(
        self, interview_id: str, message: dict, exclude_user: str = None
    ):
        """Broadcast message to all connections in interview room"""
        if interview_id not in self.active_connections:
            return

        for user_id, connection in self.active_connections[interview_id].items():
            if user_id != exclude_user:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Handle disconnected clients
                    pass

    def get_participants(self, interview_id: str) -> List[dict]:
        """Get list of active participants in interview"""
        if interview_id not in self.participants:
            return []
        return list(self.participants[interview_id].values())

    def _assign_cursor_color(self, interview_id: str) -> str:
        """Assign unique cursor color to participant"""
        colors = [
            "#00d9ff",
            "#a855f7",
            "#22c55e",
            "#f59e0b",
            "#ef4444",
            "#ec4899",
        ]
        used_colors = set()

        if interview_id in self.participants:
            used_colors = {
                p.get("cursorColor") for p in self.participants[interview_id].values()
            }

        # Find first unused color
        for color in colors:
            if color not in used_colors:
                return color

        # If all colors used, return based on participant count
        return colors[len(self.participants.get(interview_id, {})) % len(colors)]


# Global instance
manager = ConnectionManager()
