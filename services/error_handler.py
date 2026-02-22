from flask import jsonify

class ErrorHandler:
    @staticmethod
    def handle_error(e):
        return jsonify({'error': 'Internal server error'}), 500

# Usage in app.py:
# @app.errorhandler(Exception)
# def handle_exception(e):
#     return ErrorHandler.handle_error(e)
