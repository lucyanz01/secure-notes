from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()

from src.models import User, Note

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app)

    from src.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app 