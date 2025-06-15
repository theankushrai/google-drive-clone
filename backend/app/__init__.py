def create_app():
    load_dotenv()
    
    # Create a new Flask application
    app = Flask(__name__)
    
    CORS(app, 
         resources={r"/*": {"origins": "http://localhost:5173"}}, 
         # allow wildcard rule to all paths
         supports_credentials=True)
    
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
    from .auth.middleware import init_firebase
    init_firebase()
    
    # Register our routes
    # We have two blueprints: one for authentication
    # and one for file management
    from .routes.auth_routes import auth_bp
    from .routes.file_routes import file_bp
    
    # Register the blueprints with the app
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(file_bp, url_prefix='/api/files')
    
    # Return the app
    return app