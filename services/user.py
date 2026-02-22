from models import User, db
from werkzeug.security import generate_password_hash, check_password_hash

class UserService:
    @staticmethod
    def get_all_users():
        return [{'id': u.id, 'username': u.username, 'email': u.email} for u in User.query.all()]

    @staticmethod
    def create_user(data):
        hashed_password = generate_password_hash(data['password'])
        user = User(username=data['username'], email=data['email'], password=hashed_password)
        db.session.add(user)
        db.session.commit()
        return {'id': user.id, 'username': user.username, 'email': user.email}

    @staticmethod
    def verify_password(user, password):
        return check_password_hash(user.password, password)
