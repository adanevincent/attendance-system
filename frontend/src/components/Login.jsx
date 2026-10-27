
import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
  navigate("/dashboard", {
     state: { role: data.user.role,name: data.user.name }
  });
} else {
  setMessage(data.message);
}

      setMessage(data.message);

      if (response.ok) {
        setEmail("");
        setPassword("");
      }

    } catch (err) {
      console.error(err);
      setMessage("Unable to connect to the server.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Great Faith Academy</h2>
        <h3>Login</h3>

        <form onSubmit={handleLogin}>
          <div className="email_input_group">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="password_input_group">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <p
            style={{
              fontSize: "12px",
              color: message.toLowerCase().includes("successful")
                ? "green"
                : "red",
              margin: "5px 0"
            }}
          >
            {message}
          </p>

          <button type="submit">Login</button>
        </form>

        <p>
          Don't have an account? <a href="/signup">Register</a>
        </p>
      </div>
    </div>
  );
}
