import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

def create_app():
    load_dotenv()
    
    # Create a new Flask application
    app = Flask(__name__)
    
    # Enable CORS with more permissive settings for development
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                 "allow_headers": ["Content-Type", "Authorization"],
                 "expose_headers": ["Content-Disposition"],
                 "supports_credentials": True,
                 "max_age": 600  # Cache preflight response for 10 minutes
             }
         })
    
    # Set some configuration values
    # The SECRET_KEY is used to sign the session cookie
    # MAX_CONTENT_LENGTH sets the maximum file size
    # that can be uploaded to the server
    app.config.update(
        SECRET_KEY=os.getenv('FLASK_SECRET_KEY', 'dev-key-123'),
        MAX_CONTENT_LENGTH=100 * 1024 * 1024  # 100MB max file size
    )
    
    # Initialize the Firebase Admin SDK
    # This is used for authentication and authorization
    from auth.firebase import init_firebase
    init_firebase()
    
    # Register our routes
    # We have two blueprints: one for authentication
    # and one for file management
    from routes.auth_routes import auth_bp
    from routes.file_routes import file_bp
    
    # Register the blueprints with the app
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(file_bp, url_prefix='/api/files')
    
    # Return the app
    return app