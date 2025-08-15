"""
Authentication and authorization middleware for multi-tenant SaaS platform.
"""

import os
import jwt
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import requests
from functools import lru_cache
from app.config import settings


class UserContext(BaseModel):
    """User context extracted from JWT token."""
    user_id: str
    email: str
    roles: List[str]
    client_id: Optional[str] = None
    is_super_admin: bool = False
    is_client_admin: bool = False


class AuthConfig:
    """Auth0 configuration."""
    
    def __init__(self):
        self.domain = settings.auth0_domain
        self.api_audience = settings.auth0_api_audience 
        self.issuer = settings.auth0_issuer
        self.algorithms = ["RS256"]
        
        # In development mode, allow missing Auth0 config or force dev mode
        # In production, require all Auth0 config
        if settings.environment == "production":
            self.is_dev_mode = False
            if not all([self.domain, self.api_audience, self.issuer]):
                raise ValueError("Auth0 configuration required in production")
        else:
            self.is_dev_mode = not all([self.domain, self.api_audience, self.issuer]) or settings.environment == "development"
        
        if self.is_dev_mode:
            print("⚠️  Running in AUTH DEVELOPMENT MODE - Auth0 not configured")
        else:
            print("🔐 Auth0 configuration loaded successfully")
    
    @property
    def jwks_url(self) -> str:
        return f"https://{self.domain}/.well-known/jwks.json"


# Global auth config
try:
    auth_config = AuthConfig()
except Exception as e:
    print(f"⚠️  Auth config initialization failed: {e}")
    # Create a mock config for development
    auth_config = type('MockAuthConfig', (), {
        'is_dev_mode': True,
        'domain': None,
        'api_audience': None,
        'issuer': None
    })()

# Security scheme
security = HTTPBearer()


@lru_cache()
def get_jwks() -> Dict[str, Any]:
    """Get JSON Web Key Set from Auth0."""
    try:
        response = requests.get(auth_config.jwks_url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to fetch JWKS: {str(e)}"
        )


def get_public_key(token: str) -> str:
    """Extract public key from JWKS for token verification."""
    
    # Decode token header to get key ID
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing key ID"
            )
            
    except jwt.DecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    # Find matching key in JWKS
    jwks = get_jwks()
    
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            # Convert JWK to PEM format - handle different PyJWT versions
            try:
                # Try PyJWT 2.x approach
                from jwt.algorithms import RSAAlgorithm
                public_key = RSAAlgorithm.from_jwk(key)
            except (ImportError, AttributeError):
                try:
                    # Try PyJWT 1.x approach
                    from jwt.contrib.algorithms.rsa import RSAAlgorithm
                    public_key = RSAAlgorithm.from_jwk(key)
                except (ImportError, AttributeError):
                    # Fallback: use cryptography directly
                    from cryptography.hazmat.primitives import serialization
                    from cryptography.hazmat.primitives.asymmetric import rsa
                    import base64
                    
                    # Extract RSA components from JWK
                    n = base64.urlsafe_b64decode(key['n'] + '==')
                    e = base64.urlsafe_b64decode(key['e'] + '==')
                    
                    # Convert to integers
                    n_int = int.from_bytes(n, 'big')
                    e_int = int.from_bytes(e, 'big')
                    
                    # Create RSA public key
                    public_numbers = rsa.RSAPublicNumbers(e_int, n_int)
                    public_key = public_numbers.public_key()
            return public_key
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to find appropriate key"
    )


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode JWT token."""
    
    try:
        print(f"🔍 DEBUG: verify_token called")
        print(f"🔍 DEBUG: Expected audience: {auth_config.api_audience}")
        print(f"🔍 DEBUG: Expected issuer: {auth_config.issuer}")
        
        # Get public key for verification
        public_key = get_public_key(token)
        print(f"🔍 DEBUG: Public key retrieved successfully")
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=auth_config.algorithms,
            audience=auth_config.api_audience,
            issuer=auth_config.issuer
        )
        print(f"🔍 DEBUG: JWT decode successful")
        
        return payload
        
    except jwt.ExpiredSignatureError as e:
        print(f"🔍 DEBUG: Token has expired: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidAudienceError as e:
        print(f"🔍 DEBUG: Invalid audience error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid audience"
        )
    except jwt.InvalidIssuerError as e:
        print(f"🔍 DEBUG: Invalid issuer error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid issuer"
        )
    except jwt.InvalidTokenError as e:
        print(f"🔍 DEBUG: Invalid token error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        print(f"🔍 DEBUG: General token verification error: {str(e)}")
        print(f"🔍 DEBUG: Error type: {type(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )


def extract_user_context(payload: Dict[str, Any]) -> UserContext:
    """Extract user context from JWT payload."""
    
    # Auth0 custom claims are namespaced
    namespace = "https://rentroll-ai.com/"
    
    # DEBUG: Log the entire payload to see what's available
    print(f"🔍 DEBUG: Full JWT payload: {payload}")
    
    # Extract basic user info
    user_id = payload.get("sub", "")
    email = payload.get("email", "")
    
    # Extract custom claims
    roles = payload.get(f"{namespace}roles", [])
    client_id = payload.get(f"{namespace}client_id")
    
    # DEBUG: Log what we extracted
    print(f"🔍 DEBUG: Looking for namespace: {namespace}")
    print(f"🔍 DEBUG: Found roles: {roles}")
    print(f"🔍 DEBUG: Found client_id: {client_id}")
    print(f"🔍 DEBUG: All payload keys: {list(payload.keys())}")
    
    # Check if user is super admin
    is_super_admin = "super_admin" in roles
    is_client_admin = "client_admin" in roles or is_super_admin
    
    print(f"🔍 DEBUG: is_super_admin: {is_super_admin}")
    
    return UserContext(
        user_id=user_id,
        email=email,
        roles=roles,
        client_id=client_id,
        is_super_admin=is_super_admin,
        is_client_admin=is_client_admin
    )


# Dependency functions for FastAPI


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserContext:
    """
    FastAPI dependency to get current authenticated user.
    
    Usage:
        @app.get("/protected")
        async def protected_route(user: UserContext = Depends(get_current_user)):
            return {"user_id": user.user_id, "client_id": user.client_id}
    """
    
    try:
        print(f"🔍 DEBUG: get_current_user called")
        token = credentials.credentials
        print(f"🔍 DEBUG: Token received (first 50 chars): {token[:50]}...")
        
        payload = verify_token(token)
        print(f"🔍 DEBUG: Token verification successful")
        
        user_context = extract_user_context(payload)
        print(f"🔍 DEBUG: User context extracted successfully")
        
        return user_context
    except Exception as e:
        print(f"🔍 DEBUG: Authentication failed with error: {str(e)}")
        print(f"🔍 DEBUG: Error type: {type(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def require_client_access(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Require user to have client access (not super admin only).
    """
    
    if not user.client_id and not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be associated with a client"
        )
    
    return user


async def require_super_admin(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Require user to be super admin.
    """
    
    if not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    return user


async def require_client_admin(
    user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Require user to be client admin or super admin.
    """
    
    if not ("client_admin" in user.roles or user.is_super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client admin access required"
        )
    
    return user


def get_client_context(user: UserContext, target_client_id: Optional[str] = None) -> str:
    """
    Get the appropriate client context for data access.
    
    Args:
        user: Current user context
        target_client_id: Optional specific client ID (for super admin)
    
    Returns:
        Client ID to use for data access
    
    Raises:
        HTTPException: If user doesn't have access to requested client
    """
    
    # Super admin can access any client
    if user.is_super_admin:
        if target_client_id:
            return target_client_id
        # If no specific client requested, use user's own client or raise error
        if user.client_id:
            return user.client_id
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super admin must specify client_id for data access"
        )
    
    # Regular users can only access their own client
    if not user.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with any client"
        )
    
    # If target client specified, verify user has access
    if target_client_id and target_client_id != user.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User can only access their own client data"
        )
    
    return user.client_id


# Optional: Mock authentication for development/testing
class MockUserContext(UserContext):
    """Mock user context for development without Auth0."""
    pass


def get_mock_user() -> UserContext:
    """Return mock user for development."""
    return MockUserContext(
        user_id="dev_user_001",
        email="dev@example.com", 
        roles=["super_admin"],
        client_id="demo_client_001",
        is_super_admin=True,
        is_client_admin=True
    )


# Development dependency - use when Auth0 is not configured
async def get_current_user_dev(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> UserContext:
    """Development version that doesn't require Auth0."""
    if auth_config.is_dev_mode:
        return get_mock_user()
    else:
        # Fall back to real Auth0 if configured
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization token required"
            )
        return await get_current_user(credentials)
