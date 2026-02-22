from flask_migrate import Migrate

# Usage in app.py:
# migrate = Migrate(app, db)

# To run migrations:
# flask db init
# flask db migrate
# flask db upgrade

# For production, always review migration scripts before applying.
