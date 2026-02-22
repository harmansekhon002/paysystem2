# Example Auth Route

from flask import Blueprint, request, jsonify
from models import User, db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and data['password'] == 'your_password_check':
        return jsonify({'message': 'Login successful'})
    return jsonify({'error': 'Invalid credentials'}), 401
