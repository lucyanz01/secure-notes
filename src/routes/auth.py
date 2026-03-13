from flask import Blueprint, request, jsonify
import os
import jwt
from datetime import datetime, timedelta, timezone
from src import db
from src.models.user import User
import bcrypt

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

auth_bp = Blueprint("auth", __name__)

def create_token(user_id):
    payload = {
        "sub": str(user_id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return token

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "empty request body"}), 400
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    if not email or not password:
        return jsonify({"error": "missing fields"}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "user existing"}), 409
    
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    new_user = User(email=email, password=hashed_password)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "user created successfully"}), 201
    except:
        db.session.rollback()
        return jsonify({"error": "internal server error"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "empty request body"}), 400
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    if not email or not password:
        return jsonify({"error": "missing fields"}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if not existing_user:
        return jsonify({"error": "invalid credentials"}), 401
    
    if not bcrypt.checkpw(password.encode("utf-8"), existing_user.password.encode("utf-8")):
        return jsonify({"error": "invalid credentials"}), 401
    
    token = create_token(existing_user.id)
    return jsonify({"token": token}), 200
