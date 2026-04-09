from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models.user import User
from app.utils.auth import create_token, require_auth

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401
    if not user.is_active:
        return jsonify({"error": "Account disabled"}), 403

    user.last_login = datetime.utcnow()
    db.session.commit()

    token = create_token(user.id, user.role)
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()
    password = data.get("password", "")

    if not email or not name or not password:
        return jsonify({"error": "All fields required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be 8+ characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(email=email, name=name, role="operator")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_token(user.id, user.role)
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict())


@auth_bp.route("/users", methods=["GET"])
@require_auth
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])
