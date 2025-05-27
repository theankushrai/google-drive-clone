import { useState, useEffect } from "react";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  UserCredential,
  AuthError,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "../firebase";
import { useLocation } from "react-router-dom";

type AuthFunction = () => Promise<UserCredential>;

const googleProvider = new GoogleAuthProvider();
// Add additional scopes if needed
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/upload";
  
  // Clear any previous auth state
  useEffect(() => {
    console.log('LoginPage mounted, from:', from);
    return () => {
      console.log('LoginPage unmounting');
    };
  }, [from]);

  const handleAuthAction = async (authFunction: AuthFunction) => {
    try {
      console.log('Starting auth action...');
      setError(null);
      setLoading(true);
      
      // Clear any existing auth state
      await auth.signOut();
      
      // Execute the auth function (email/password or Google)
      await authFunction();
      
      console.log('Auth successful, should redirect to:', from);
      // The AuthProvider will handle the redirect via the PublicRoute component
    } catch (error) {
      const authError = error as AuthError;
      console.error('Authentication error:', authError);
      
      // Don't show error if user closed the popup
      if (authError.code === 'auth/popup-closed-by-user') {
        console.log('User closed the auth popup');
        return;
      }
      
      // Provide user-friendly error messages
      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already in use. Please use a different email or log in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/user-not-found': 'No account found with this email. Please sign up first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
        'auth/network-request-failed': 'Network error. Please check your connection and try again.'
      };
      
      setError(errorMessages[authError.code] || authError.message || 'An error occurred during authentication');
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  const handleEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const authAction = isLogin 
      ? () => signInWithEmailAndPassword(auth, email, password)
      : () => createUserWithEmailAndPassword(auth, email, password);

    handleAuthAction(authAction);
  };

  const handleGoogleLogin = () => {
    handleAuthAction(() => signInWithPopup(auth, googleProvider));
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm mt-5">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2 className="mb-2">{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
                <p className="text-muted">
                  {isLogin 
                    ? 'Sign in to access your files' 
                    : 'Create an account to get started'}
                </p>
              </div>
              
              {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleEmailPasswordSubmit} className="mb-4">
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : isLogin ? (
                    'Sign In'
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </Form>

              <div className="position-relative mb-4">
                <div className="border-bottom"></div>
                <div className="position-absolute top-50 start-50 translate-middle bg-white px-3">
                  <span className="text-muted">OR</span>
                </div>
              </div>

              <Button 
                variant="outline-primary" 
                className="w-100 mb-3 d-flex align-items-center justify-content-center"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg
                  className="me-2"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="text-center mt-4">
                <p className="mb-0">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <Button 
                    variant="link" 
                    className="p-0"
                    onClick={() => {
                      setError(null);
                      setIsLogin(!isLogin);
                    }}
                    disabled={loading}
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
