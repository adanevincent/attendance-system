
import "./Dashboard.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = location.state?.role;
  const name = location.state?.name;

  const [studentName, setStudentName] = useState("");
  const [searchName, setSearchName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [students, setStudents] = useState([]);

  // Clear success and error messages after 3 seconds
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  // Handle authentication failures
  const handleAuthFailure = (response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      return true;
    }

    return false;
  };

  // Add a student
  const handleAddStudent = async () => {
    if (studentName.trim() === "") {
      setMessage("Please enter a student name.");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch("/api/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          name: studentName.trim()
        })
      });

      if (handleAuthFailure(response)) return;

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add student.");
      }

      setMessage(result.message);
      setMessageType("success");
      setStudentName("");
    } catch (error) {
      console.error("Error adding student:", error);
      setMessage(error.message || "Unable to add student.");
      setMessageType("error");
    }
  };

  // Fetch all students in the logged-in teacher's class
  const handleSeeAllStudents = async () => {
    try {
      const response = await fetch("/api/students", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (handleAuthFailure(response)) return;

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch students.");
      }

      setStudents(result.students);
      setMessage(
        result.students.length === 0
          ? "There are no students registered in your class yet."
          : `Found ${result.students.length} student(s).`
      );
      setMessageType("success");
    } catch (error) {
      console.error("Error fetching students:", error);
      setMessage(error.message || "Unable to retrieve students.");
      setMessageType("error");
    }
  };

  // Search students by full or partial name
  const handleSearchStudents = async () => {
    if (searchName.trim() === "") {
      setMessage("Please enter a student name to search.");
      setMessageType("error");
      setStudents([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/students/search?name=${encodeURIComponent(searchName.trim())}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (handleAuthFailure(response)) return;

      const result = await response.json();

      if (!response.ok) {
        setStudents([]);
        throw new Error(result.message || "Failed to search for students.");
      }

      setStudents(result.students);
      setMessage(result.message || "Students found successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("Error searching for students:", error);
      setMessage(error.message || "Unable to search for students.");
      setMessageType("error");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <h2>Great Faith Academy</h2>

        <h1>Hi , {name || ""} 👋</h1>
        <p>{role || ""}</p>

        <div className="dashboard-actions">
          <Link to="/attendance" className="attendance-button">
            Mark Attendance
          </Link>
        </div>

        {/* Add student */}
        <div className="student-actions">
          <div className="add-student-group">
            <input
              type="text"
              placeholder="Enter student name to add new student"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />

            <button type="button" onClick={handleAddStudent}>
              Add Student
            </button>
          </div>
        </div>

        {/* Search students */}
        <div className="student-actions">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search student by name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchStudents();
                }
              }}
            />

            <button type="button" onClick={handleSearchStudents}>
              Search
            </button>
          </div>
        </div>

        {/* Feedback messages */}
        {message && (
          <p
            className={
              messageType === "success"
                ? "success-message"
                : "error-message"
            }
          >
            {message}
          </p>
        )}

        {/* All students and search results */}
        <div className="all-students">
          <h2>Students</h2>

          <button
            type="button"
            className="view-students-button"
            onClick={handleSeeAllStudents}
          >
            See All Students
          </button>

          {students.length > 0 ? (
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>
          
              
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
