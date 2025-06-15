// src/pages/DashboardPage.js
import React from 'react';
import { Container, Button, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      // The signOut() function is a part of the Firebase Authentication SDK.
      // The auth object is the Firebase Authentication instance, which is obtained
      // by calling the getAuth() function from the Firebase Authentication SDK.
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  return (
    <Container className="mt-5">
      <Card>
        <Card.Body className="text-center">
          <h2>Welcome to Your Dashboard</h2>
          <p className="text-muted">Email: {currentUser?.email}</p>
          <Button variant="primary" onClick={handleLogout}>
            Log Out
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}