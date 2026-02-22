# Session Handling in Serverless

- Use JWT tokens for authentication (stateless)
- Avoid server-side sessions unless using a distributed store (e.g., Redis)
- Store session data client-side or in a cloud database
- Example: Flask-JWT-Extended for JWT

# Example JWT usage
from flask_jwt_extended import JWTManager

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)
