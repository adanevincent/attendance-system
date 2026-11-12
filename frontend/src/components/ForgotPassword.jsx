import "./ForgotPassword.css";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Unable to connect to the server.");
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <h2>Forgot Password</h2>
        <p className="forgot-hint">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <form className="forgot-form" onSubmit={handleForgotPassword}>
          <div className="forgot-input-group">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit">Send reset link</button>
        </form>

        {message && <p className="forgot-message">{message}</p>}

        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}