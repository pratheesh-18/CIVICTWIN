from typing import Optional, List, Callable
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.db.models import User


def extract_token_from_request(request: Request) -> Optional[str]:
    """Extracts session token from Authorization header or HTTP-only cookie."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return request.cookies.get(settings.SESSION_COOKIE_NAME)


def get_current_user_optional(
    request: Request, db: Session = Depends(get_db)
) -> Optional[User]:
    """Retrieves current authenticated user if token is present and valid; else None."""
    token = extract_token_from_request(request)
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user


def get_current_user(
    request: Request, db: Session = Depends(get_db)
) -> User:
    """Retrieves current authenticated user, raising 401 if missing or invalid."""
    user = get_current_user_optional(request, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(allowed_roles: List[str]) -> Callable:
    """Dependency that enforces user role RBAC permissions."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{current_user.role}'. Required: {allowed_roles}",
            )
        return current_user
    return role_checker


require_citizen = require_role(["citizen"])
require_department = require_role(["department", "commissioner"])
require_commissioner = require_role(["commissioner"])
