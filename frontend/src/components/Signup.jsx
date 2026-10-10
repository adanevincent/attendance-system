import "./Signup.css";
import { useState } from "react";
export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");


    
const handleSignup = async (event) => {
  event.preventDefault();

  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, role,name })
    });

    const data = await response.json();
    setMessage(data.message);

    if (response.ok) {

      
      setEmail("");
      setPassword("");
      setRole("");
      setName("");
    }

    setTimeout(() => {
      setMessage("");
    }, 3000);

  } catch (err) {
    console.error(err);
    setMessage("Unable to connect to the server.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }
};


   

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2>Great Faith Academy</h2>
        <h3>Sign Up</h3>
        <form onSubmit={handleSignup}>
         <div className="name_input_group">
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" required />
          </div>
          <div className="email_input_group">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="password_input_group">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
          </div>
          <div className="role_input_group">
            <select name="role" id="" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="">Select class</option>
              <option value="JHS 1">JHS 1</option>
              <option value="JHS 2">JHS 2</option>
              <option value="JHS 3">JHS 3</option>
            </select>
          </div>
         <p style={{
            fontSize: "12px",
             color: message.includes("successfully") ? "green" : "red",
              margin: "5px 0"
             }}>
            {message}
          </p>
          <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
}