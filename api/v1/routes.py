from flask import Blueprint, request, jsonify
from services.user import UserService
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

api_v1_bp = Blueprint('api_v1', __name__)

@api_v1_bp.route('/users', methods=['GET'])
def get_users():
    users = UserService.get_all_users()
    return jsonify(users), 200

@api_v1_bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user = UserService.create_user(data)
    return jsonify(user), 201

# Add more CRUD endpoints as needed
