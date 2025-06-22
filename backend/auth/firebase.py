import os
import json
import firebase_admin
from functools import wraps
from flask import request, jsonify
from firebase_admin import credentials, auth

# Authorization: Bearer <token>
# Authorization:: The standard HTTP header name for sending credentials.
# Bearer: The type of authentication; means "whoever has this token is allowed access."
# <token>: The actual credential, typically a JWT (e.g., from Firebase). It's a three-part coded string containing info (like user ID) and a cryptographic signature to prevent tampering, verifying its source.
# Key Use: The server (token_required) decrypts and validates this token to confirm the user's identity securely.


def init_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        firebase_creds = os.getenv('FIREBASE_CREDENTIALS')
        
        if not firebase_creds:
            raise ValueError("FIREBASE_CREDENTIALS environment variable not set")
            
        try:
            # Try to load as JSON string first
            try:
                cred_dict = json.loads(firebase_creds)
            except json.JSONDecodeError:
                # If that fails, try to load from file path
                if os.path.exists(firebase_creds):
                    with open(firebase_creds, 'r') as f:
                        cred_dict = json.load(f)
                else:
                    raise ValueError(f"FIREBASE_CREDENTIALS is not valid JSON and path does not exist: {firebase_creds}")
            
            # Initialize Firebase with the credentials
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
            
        except Exception as e:
            print(f"Error initializing Firebase: {str(e)}")
            print(f"FIREBASE_CREDENTIALS value: {firebase_creds[:100]}..." if firebase_creds else "No FIREBASE_CREDENTIALS set")
            raise

def token_required(f):
    """Decorator to verify Firebase ID token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip token verification for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
            
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
            
        token = auth_header.split(' ')[1]
        
        try:
            # Verify the ID token
            decoded_token = auth.verify_id_token(token)
            # Store the decoded token in the request object for later use
            request.decoded_token = decoded_token
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
            
    return decorated_function