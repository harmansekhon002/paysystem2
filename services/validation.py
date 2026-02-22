from flask import request
from marshmallow import Schema, fields, ValidationError

class UserSchema(Schema):
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    password = fields.Str(required=True)

# Usage:
# try:
#     data = UserSchema().load(request.get_json())
# except ValidationError as err:
#     return {'error': err.messages}, 400
