# Production Configuration Example

- Use config.py for all settings
- Set DEBUG=False
- Use environment variables for secrets
- Use gunicorn for production server

# Example gunicorn command
# gunicorn app:app --bind 0.0.0.0:8000
