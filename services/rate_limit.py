from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Usage in app.py:
# limiter = Limiter(app, key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

# For SaaS, use user ID or API key for rate limiting:
# limiter = Limiter(app, key_func=lambda: current_user.id if current_user else get_remote_address())
