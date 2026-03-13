from flask import Blueprint, request, jsonify
from src import db
from src.models.note import Note
from src.middleware.auth_guard import token_required

notes_bp = Blueprint("notes", __name__)

@notes_bp.route("/", methods=["POST"])
@token_required
def create_note():
    data = request.get_json()
    if not data:
        return jsonify({"error": "empty request body"}), 400
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    if not title or not content:
        return jsonify({"error": "missing fields"}), 400
    
    new_note = Note(title=title, content=content, user_id=request.user_id)

    try:
        db.session.add(new_note)
        db.session.commit()
        return jsonify({"message": "note created successfully"}), 201
    except:
        db.session.rollback()
        return jsonify({"error": "internal server error"}), 500