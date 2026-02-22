from flask import request
from flask_cors import CORS

# Usage in app.py:
# CORS(app, resources={r"/api/*": {"origins": "https://yourfrontend.com"}})

# For development, use "*". For production, restrict origins.
