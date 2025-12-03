from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.code_execution import CodeExecuteRequest, CodeExecuteResponse
from app.services.code_execution_service import mock_code_execution
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/code", tags=["Code Execution"])


@router.post("/execute", response_model=CodeExecuteResponse)
async def execute_code(
    request: CodeExecuteRequest, current_user: User = Depends(get_current_user)
):
    """Execute code (mock implementation)"""
    result = await mock_code_execution(request.code, request.language, request.stdin)

    return CodeExecuteResponse(**result)
