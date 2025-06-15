
# Authorization: Bearer <token>

# Authorization:: The standard HTTP header name for sending credentials.
# Bearer: The type of authentication; means "whoever has this token is allowed access."
# <token>: The actual credential, typically a JWT (e.g., from Firebase). It's a three-part coded string containing info (like user ID) and a cryptographic signature to prevent tampering, verifying its source.
# Key Use: The server (token_required) decrypts and validates this token to confirm the user's identity securely.


def init_firebase():
    """Initialize Firebase Admin SDK"""
    # Check if the Firebase Admin SDK has not been initialized yet
    if not firebase_admin._apps:
        # Load the Firebase service account credentials from the environment variable
        cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_PATH'))
        # Initialize the Firebase Admin SDK with the credentials
        firebase_admin.initialize_app(cred)

def token_required(f):
    """Decorator to verify Firebase ID token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the Authorization header from the request
        auth_header = request.headers.get('Authorization')
        
        # Check if the Authorization header is empty or doesn't start with 'Bearer '
        if not auth_header or not auth_header.startswith('Bearer '):
            # Return a 401 Unauthorized response with an error message
            return jsonify({'error': 'No token provided'}), 401
            
        # Extract the token from the Authorization header
        token = auth_header.split(' ')[1]
        
        try:
            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(token)
            # Set the user attribute on the request object with the decoded token
            request.user = decoded_token
        except Exception as e:
            # Return a 403 Forbidden response with an error message if the token is invalid
            return jsonify({'error': 'Invalid token'}), 403
            
        # Call the decorated function with the original arguments and keyword arguments
        return f(*args, **kwargs)
    return decorated_function