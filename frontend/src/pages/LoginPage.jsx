// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the URL that the user was trying to access before they were sent to this login page
  // If the user was not trying to access a specific page, default to the dashboard page
  const from = location.state?.from?.pathname // If the user was trying to access a specific page, get its URL
    || '/dashboard'; // Otherwise, default to the dashboard page
  // This function is called when the user submits the login form
  // It prevents the default behaviour of the form (which is to send a request to the server)
  // and instead logs the user in using Firebase
  async function handleSubmit(e) {
    // Prevent the default form submission behaviour
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // The { replace: true } option means that the login page will be replaced in the browser's history
      // by the page we're redirecting to, so if the user clicks the back button, they won't see the login page again
      navigate(from, { replace: true });
    } catch (err) {
      setError('Failed to sign in: ' + err.message);
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      // The { replace: true } option means that the login page will be replaced in the browser's history
      // by the page we're redirecting to, so if the user clicks the back button, they won't see the login page again
      navigate(from, { replace: true });
    } catch (err) {
      setError('Failed to sign in with Google: ' + err.message);
    }
    setLoading(false);
  }



  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };
  
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Log In</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
              <Form.Group id="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>
              <Button disabled={loading} className="w-100 mb-3" type="submit">
                Log In
              </Button>
              <Button 
                variant="outline-primary" 
                className="w-100 mb-3" 
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Sign in with Google
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Need an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </Container>
  );
}