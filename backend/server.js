const express = require("express");

const app = express();
const bcrypt = require("bcrypt");
const pool = require("./db");
const PORT = process.env.PORT || 5000;


app.use(express.json());


app.post("/api/signup",async(req,res)=>{
try{
const {email,password,role,name}=req.body;
//console.log(req.body);

const hashedPassword= await bcrypt.hash(password,10)
const results = await pool.query(`INSERT INTO teachers (email,password,role,name) VALUES($1,$2,$3,$4) RETURNING id,email`, [email,hashedPassword,role,name])
const userId=results.rows[0].id;
res.status(201).json({ message: "Account created successfully" });
}
catch (err) {
    console.error(err);

    if (err.code === "23505") {
        if (err.constraint === "teachers_email_key") {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        if (err.constraint === "teachers_role_key") {
            return res.status(409).json({
                message: "This class has already been assigned."
            });
        }
    }

    return res.status(500).json({
        message: "Something went wrong during signup."
    });
}
  


})
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const results = await pool.query("SELECT * FROM teachers WHERE email = $1", [email]);
    const user = results.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.status(200).json({
  message: "Login successful.",
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  }
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong during login." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port  http://localhost:${PORT}`);
});