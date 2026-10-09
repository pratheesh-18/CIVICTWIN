from typing import Optional, List, Callable
from fastapi import Request, Response, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.db.models import User


def extract_token_from_request(request: Request) -> Optional[str]:
    """Extracts session token from Authorization header or HTTP-only cookie."""
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header:
        parts = auth_header.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        elif len(parts) == 1:
            return parts[0]
    return request.cookies.get(settings.SESSION_COOKIE_NAME)


def set_auth_cookie(
    response: Response,
    token: str,
    request: Optional[Request] = None,
) -> None:
    """Sets session cookie with cross-site SameSite=None and Secure=True in production/HTTPS."""
    is_https = False
    if request:
        proto = request.headers.get("x-forwarded-proto", "").lower()
        is_https = request.url.scheme == "https" or proto == "https"

    samesite = "none" if is_https else "lax"
    secure = is_https

    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite=samesite,
        secure=secure,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def clear_auth_cookie(
    response: Response,
    request: Optional[Request] = None,
) -> None:
    """Clears the session cookie matching SameSite/Secure flags."""
    is_https = False
    if request:
        proto = request.headers.get("x-forwarded-proto", "").lower()
        is_https = request.url.scheme == "https" or proto == "https"

    samesite = "none" if is_https else "lax"
    secure = is_https

    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        samesite=samesite,
        secure=secure,
    )


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
