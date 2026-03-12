from flask import Blueprint, request, jsonify
from src import db
from src.models.user import User
import bcrypt

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "empty request body"}), 400
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "missing fields"}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "user existing"}), 409
    
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

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
    pass