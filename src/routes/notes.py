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
    
@notes_bp.route("/", methods=["GET"])
@token_required
def get_notes():
    notes = Note.query.filter_by(user_id=request.user_id).all()
    return jsonify([{
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "created_at": note.created_at,
        "updated_at": note.updated_at
    } for note in notes]), 200

@notes_bp.route("/<int:note_id>", methods=["GET"])
@token_required
def get_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=request.user_id).first()
    if not note:
        return jsonify({"error": "note not found"}), 404
    return jsonify({
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "created_at": note.created_at,
        "updated_at": note.updated_at
    }), 200

@notes_bp.route("/<int:note_id>", methods=["PATCH"])
@token_required
def update_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=request.user_id).first()
    if not note:
        return jsonify({"error": "note not found"}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "empty request body"}), 400
    if "title" in data:
        note.title = data.get("title").strip()
    if "content" in data:
        note.content = data.get("content").strip()

    try: 
        db.session.commit()
        return jsonify({"message": "note updates succesfully"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "internal server error"}), 500
    
@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@token_required
def delete_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=request.user_id).first()
    if not note:
        return jsonify({"error": "note not found"}), 404
    
    try:
        db.session.delete(note)
        db.session.commit()
        return jsonify({"message": "note deleted succesfully"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "internal server error"}), 500