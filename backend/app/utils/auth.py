"""Simple JWT implementation using only stdlib — no extra packages."""
import hmac
import hashlib
import json
import base64
import os
import time


SECRET = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))


def create_token(user_id: str, role: str, expires_in: int = 86400) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url_encode(json.dumps({
        "sub": user_id, "role": role,
        "iat": int(time.time()), "exp": int(time.time()) + expires_in
    }).encode())
    sig = _b64url_encode(hmac.new(
        SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256
    ).digest())
    return f"{header}.{payload}.{sig}"


def verify_token(token: str) -> dict | None:
    try:
        header, payload, sig = token.split(".")
        expected = _b64url_encode(hmac.new(
            SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256
        ).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(_b64url_decode(payload))
        if data["exp"] < time.time():
            return None
        return data
    except Exception:
        return None


def require_auth(f):
    """Decorator to protect routes."""
    from functools import wraps
    from flask import request, jsonify

    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        if not token:
            return jsonify({"error": "Missing token"}), 401
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        request.user_id = payload["sub"]
        request.user_role = payload["role"]
        return f(*args, **kwargs)

    return decorated


def require_admin(f):
    from functools import wraps
    from flask import request, jsonify

    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        payload = verify_token(token) if token else None
        if not payload or payload.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        request.user_id = payload["sub"]
        request.user_role = payload["role"]
        return f(*args, **kwargs)

    return decorated
