# Error Handling Example

from flask import jsonify

@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify(error=str(e)), 500

# Add specific error handlers as needed
