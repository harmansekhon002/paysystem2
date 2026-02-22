import os
from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from api.v1.routes import api_v1_bp
from services.auth import jwt_manager
import logging

# Application factory
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db = SQLAlchemy(app)
    migrate = Migrate(app, db)
    limiter = Limiter(app, key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    jwt_manager.init_app(app)

    # Register blueprints
    app.register_blueprint(api_v1_bp, url_prefix="/api/v1")

    # Logging
    logging.basicConfig(filename='logs/app.log', level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

    @app.errorhandler(Exception)
    def handle_exception(e):
        logging.error(f"Unhandled Exception: {str(e)}")
        return {"error": "Internal server error"}, 500

    return app

# For Vercel compatibility
app = create_app()
