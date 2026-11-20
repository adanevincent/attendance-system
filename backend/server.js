require("dotenv").config();
const express = require("express");


const app = express();
const bcrypt = require("bcrypt");
const pool = require("./db");
const PORT = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


app.use(express.json());

function capitalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\p{L}/gu, letter => letter.toUpperCase());
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Please log in."
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token."
      });
    }

    req.userId = decoded.userId;
    next();
  });
}


const classTables = {
  "JHS 1": { students: "jss1_students", attendance: "jss1_attendance" },
  "JHS 2": { students: "jss2_students", attendance: "jss2_attendance" },
  "JHS 3": { students: "jss3_students", attendance: "jss3_attendance" }
};

async function attachClassTables(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT role FROM teachers WHERE id = $1",
      [req.userId]
    );
    const teacher = result.rows[0];

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const tables = classTables[teacher.role];

    if (!tables) {
      return res.status(400).json({ message: "Invalid teacher class." });
    }

    req.className = teacher.role;
    req.tables = tables;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong." });
  }
}

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
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
    res.status(200).json({
  message: "Login successful.",
  token,
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


app.post("/api/add-student", authenticateToken, async (req, res) => {
  try {
    
    const teacherResult = await pool.query(
      "SELECT role FROM teachers WHERE id = $1",
      [req.userId]
    );

    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found."
      });
    }

    
    const studentTables = {
  "JHS 1": "jss1_students",
  "JHS 2": "jss2_students",
  "JHS 3": "jss3_students"
};

    const tableName = studentTables[teacher.role];

    if (!tableName) {
      return res.status(400).json({
        message: "Invalid teacher class."
      });
    }

    
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Student name is required."
      });
    }
const formattedName = capitalizeName(name);
    
    const result = await pool.query(
      `INSERT INTO ${tableName} (name)
       VALUES ($1)
       RETURNING id, name`,
      [formattedName]
    );

    return res.status(201).json({
      message: "Student added successfully.",
      student: result.rows[0]
    });

  } catch (err) {
  console.error(err);

  if (err.code === "23505") {
    return res.status(409).json({ message: "Student already exists." });
  }

  return res.status(500).json({ message: "Failed to add student." });
}
});

app.get("/api/students", authenticateToken, async (req, res) => {
  try {
    // 1. Get the logged-in teacher's class
    const teacherResult = await pool.query(
      "SELECT role FROM teachers WHERE id = $1",
      [req.userId]
    );

    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found."
      });
    }

    // 2. Map the teacher's class to the correct table
    const studentTables = {
      "JHS 1": "jss1_students",
      "JHS 2": "jss2_students",
      "JHS 3": "jss3_students"
    };

    const tableName = studentTables[teacher.role];

    if (!tableName) {
      return res.status(400).json({
        message: "Invalid teacher class."
      });
    }

    // 3. Retrieve all students in that class
    const result = await pool.query(
      `SELECT id, name FROM ${tableName} ORDER BY id ASC`
    );

    // 4. Return the students to the frontend
    return res.status(200).json({
      students: result.rows
    });

  } catch (error) {
    console.error("Error fetching students:", error);

    return res.status(500).json({
      message: "Failed to retrieve students."
    });
  }
});

app.get("/api/students/search", authenticateToken, async (req, res) => {
  try {
    const searchName = req.query.name;

    if (!searchName || searchName.trim() === "") {
      return res.status(400).json({
        message: "Please enter a student name to search."
      });
    }

    // Get the logged-in teacher's class
    const teacherResult = await pool.query(
      "SELECT role FROM teachers WHERE id = $1",
      [req.userId]
    );

    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found."
      });
    }

    // Select the correct student table
    const studentTables = {
      "JHS 1": "jss1_students",
      "JHS 2": "jss2_students",
      "JHS 3": "jss3_students"
    };

    const tableName = studentTables[teacher.role];

    if (!tableName) {
      return res.status(400).json({
        message: "Invalid teacher class."
      });
    }

    // Search for matching student names
    const result = await pool.query(
      `SELECT id, name
       FROM ${tableName}
       WHERE name ILIKE $1
       ORDER BY id ASC`,
      [`%${searchName.trim()}%`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No students found with that name."
      });
    }

    return res.status(200).json({
      message: "",
      students: result.rows
    });

  } catch (error) {
    console.error("Error searching for students:", error);

    return res.status(500).json({
      message: "Failed to search for students."
    });
  }
});


app.post("/api/forgot-password", async (req, res) => {
  const genericMessage =
    "If this email is registered, a reset link has been sent.";

  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Please enter your email." });
    }

    const result = await pool.query(
      "SELECT id FROM teachers WHERE email = $1",
      [email.trim()]
    );
    const user = result.rows[0];

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await pool.query(
        `UPDATE teachers
         SET reset_token_hash = $1,
             reset_token_expires = NOW() + INTERVAL '15 minutes'
         WHERE id = $2`,
        [tokenHash, user.id]
      );

      const resetLink = `http://localhost:5173/reset-password?token=${token}`;//this link should be sent via email in production
      console.log("Password reset link (dev only):", resetLink);// in prodection so send it to terminal for texting
      
    }

    return res.status(200).json({ message: genericMessage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

//password reset route

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (typeof token !== "string" || !token) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }

   /* if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters."
      });
    }*/

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const result = await pool.query(
      `SELECT id FROM teachers
       WHERE reset_token_hash = $1
         AND reset_token_expires > NOW()`,
      [tokenHash]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE teachers
       SET password = $1,
           reset_token_hash = NULL,
           reset_token_expires = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return res.status(200).json({ message: "Password updated. You can now log in." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong." });
  }
});


app.get("/api/attendance/summary", authenticateToken, attachClassTables, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.name,
              COUNT(*) FILTER (WHERE a.status = 'present') AS days_present,
              COUNT(*) FILTER (WHERE a.status = 'absent')  AS days_absent,
              MAX(a.marked_at) AS last_marked
       FROM ${req.tables.students} s
       LEFT JOIN ${req.tables.attendance} a ON a.student_name = s.name
       GROUP BY s.name
       ORDER BY s.name ASC`
    );

    const students = result.rows.map((row) => ({
      name: row.name,
      class: req.className,
      daysPresent: Number(row.days_present),
      daysAbsent: Number(row.days_absent),
      totalDays: Number(row.days_present) + Number(row.days_absent),
      lastMarked: row.last_marked
    }));

    return res.status(200).json({ students });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load attendance summary." });
  }
});


app.get("/api/attendance/history", authenticateToken, attachClassTables, async (req, res) => {
  try {
    const result = await pool.query(
      `WITH first_day AS (
         SELECT MIN(attendance_date) AS day FROM ${req.tables.attendance}
       ),
       school_days AS (
         SELECT d::date AS day
         FROM first_day,
              generate_series(first_day.day, CURRENT_DATE, interval '1 day') AS d
         WHERE EXTRACT(ISODOW FROM d) < 6          -- Mon-Fri only
       ),
       marked AS (
         SELECT attendance_date AS day,
                COUNT(*) FILTER (WHERE status = 'present') AS present,
                COUNT(*) FILTER (WHERE status = 'absent')  AS absent
         FROM ${req.tables.attendance}
         GROUP BY attendance_date
       )
       SELECT to_char(sd.day, 'YYYY-MM-DD') AS date,
              (m.day IS NOT NULL)           AS was_marked,
              (sd.day = CURRENT_DATE)       AS is_today,
              COALESCE(m.present, 0)        AS present,
              COALESCE(m.absent, 0)         AS absent
       FROM school_days sd
       LEFT JOIN marked m ON m.day = sd.day
       ORDER BY sd.day DESC`
    );

    const days = result.rows.map((row) => ({
      date: row.date,
      wasMarked: row.was_marked,
      isToday: row.is_today,
      present: Number(row.present),
      absent: Number(row.absent)
    }));

    return res.status(200).json({ className: req.className, days });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load attendance history." });
  }
});

app.get("/api/attendance/by-date", authenticateToken, attachClassTables, async (req, res) => {
  try {
    const { date } = req.query;

    // Must look like YYYY-MM-DD and be a real calendar date
    const isValid =
      typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

    if (!isValid) {
      return res.status(400).json({ message: "A valid date (YYYY-MM-DD) is required." });
    }

    const result = await pool.query(
      `SELECT s.name, a.status
       FROM ${req.tables.students} s
       LEFT JOIN ${req.tables.attendance} a
         ON a.student_name = s.name AND a.attendance_date = $1
       ORDER BY s.name ASC`,
      [date]
    );

    const students = result.rows.map((row) => ({
      name: row.name,
      status: row.status || "not-marked"
    }));

    const present = students.filter((s) => s.status === "present").length;
    const absent = students.filter((s) => s.status === "absent").length;

    return res.status(200).json({
      date,
      className: req.className,
      wasMarked: present + absent > 0,
      present,
      absent,
      notMarked: students.length - present - absent,
      students
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load attendance for that date." });
  }
});


app.post("/api/attendance", authenticateToken, attachClassTables, async (req, res) => {
  try {
    const { date, records } = req.body;

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "A valid date (YYYY-MM-DD) is required." });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "No attendance records provided." });
    }

    for (const record of records) {
      if (!["present", "absent"].includes(record.status)) {
        return res.status(400).json({ message: "Status must be present or absent." });
      }

      const saved = await pool.query(
        `INSERT INTO ${req.tables.attendance} (student_name, attendance_date, status)
         SELECT name, $2, $3 FROM ${req.tables.students} WHERE name = $1
         ON CONFLICT (student_name, attendance_date)
         DO UPDATE SET status = EXCLUDED.status, marked_at = NOW()`,
        [record.studentName, date, record.status]
      );

      if (saved.rowCount === 0) {
        return res.status(400).json({
          message: `Student not found: ${record.studentName}`
        });
      }
    }

    return res.status(200).json({ message: "Attendance saved." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to save attendance." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port  http://localhost:${PORT}`);
});