import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth"; // Correct imports
import { auth, provider } from "../firebase"; // Import auth and provider directly from your firebase file

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((result) => {
        console.log("User logged in:", result.user);
        // You can redirect or store the user in state/context
      })
      .catch((error) => {
        console.error("Login error:", error.message);
      });
  };

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((result) => {
        console.log("User signed up:", result.user);
        // You can redirect or store the user in state/context
      })
      .catch((error) => {
        console.error("Sign-up error:", error.message);
      });
  };

  const handleGoogleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("User logged in with Google:", result.user);
        // You can redirect or store the user in state/context
      })
      .catch((error) => {
        console.error("Google login error:", error.message);
      });
  };

  return (
    <div className="container mt-5 text-center">
      <h2>{isLogin ? "Login" : "Sign Up"} to Google Drive Clone</h2>

      <Form className="mt-3">
        <Form.Group controlId="email">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="password" className="mt-2">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <Button
          variant="primary"
          onClick={isLogin ? handleLogin : handleSignUp}
          className="mt-3"
        >
          {isLogin ? "Login" : "Sign Up"}
        </Button>
      </Form>

      <div className="mt-3">
        <Button variant="secondary" onClick={handleGoogleLogin}>
          Login with Google
        </Button>
      </div>

      <div className="mt-3">
        <span>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <a href="#" onClick={() => setIsLogin((prev) => !prev)}>
            {isLogin ? "Sign up" : "Login"}
          </a>
        </span>
      </div>
    </div>
  );
};

export default LoginPage;
