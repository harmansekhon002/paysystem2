import logging
import json

class StructuredLogger:
    def __init__(self, name):
        self.logger = logging.getLogger(name)
        handler = logging.FileHandler('logs/app.log')
        formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def info(self, message, **kwargs):
        self.logger.info(json.dumps({'message': message, **kwargs}))

    def error(self, message, **kwargs):
        self.logger.error(json.dumps({'message': message, **kwargs}))

# Usage: logger = StructuredLogger('myapp')
# logger.info('User created', user_id=123)
