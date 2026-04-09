import hashlib
import os
import uuid
from datetime import datetime
from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default="operator")  # admin, operator, customer
    password_hash = db.Column(db.String(128), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password: str):
        salt = os.urandom(16).hex()
        h = hashlib.sha256((salt + password).encode()).hexdigest()
        self.password_hash = f"{salt}:{h}"

    def check_password(self, password: str) -> bool:
        try:
            salt, h = self.password_hash.split(":", 1)
            return hashlib.sha256((salt + password).encode()).hexdigest() == h
        except Exception:
            return False

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
