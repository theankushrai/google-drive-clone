from flask import Blueprint, jsonify, request
from firebase_admin import auth
from auth.firebase import token_required

# Create a Blueprint, which is a way to group related views and other code
# together to make it easy to register them with an application.
auth_bp = Blueprint('auth', __name__)

# Define a route for logging in. This route accepts POST requests and
# expects a JSON payload with a single key, 'token', which is the Firebase
# ID token to verify.
@auth_bp.route('/login', methods=['POST'])
def login():
    """Verify Firebase ID token and return user info"""
    
    # Get the JSON payload from the request.
    id_token = request.json.get('token')
    
    # If the token is missing, return an error response.
    if not id_token:
        return jsonify({'error': 'No token provided'}), 400
    
    # Try to verify the ID token. If it's invalid, return an error response.
    try:
        decoded_token = auth.verify_id_token(id_token)
        
        # If the token is valid, return the user info.
        return jsonify({
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name', ''),
            'picture': decoded_token.get('picture', '')
        })
    except Exception as e:
        # If there's an error, return an error response with the error message.
        return jsonify({'error': str(e)}), 401

# This is an example on how to create Routes
# Define a route for an example protected route. This route is decorated with
# the @token_required decorator, which checks for a valid Firebase ID token
# in the Authorization header. If the token is invalid, it returns an error
# response.
@auth_bp.route('/protected')
@token_required
def protected_route():
    """Example protected route"""
    
    # If the token is valid, return a JSON response with a message.
    return jsonify({'message': 'This is a protected route'})