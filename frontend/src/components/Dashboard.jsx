import "./Dashboard.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
const role = location.state?.role;
 const name = location.state?.name;
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <h2>Great Faith Academy</h2>

        <h1>Hi, {name || "User"} 👋</h1>
        <p>{role || "Class not available"}</p>

      

        <div className="dashboard-actions">
          <Link to="/attendance" className="attendance-button">
            Mark Attendance
          </Link>
        </div>

        

        <div className="student-actions">

          <div className="add-student-group">
            <input
              type="text"
              placeholder="Enter student name to add new student"
            />

            <button type="button">
              Add Student
            </button>
          </div>

        </div>

        {/* Search student */}

        <div className="student-actions">

          <div className="search-group">
            <input
              type="text"
              placeholder="Search student"
            />

            <button type="button">
              Search
            </button>
          </div>

        </div>

        {/* All students */}

        <div className="all-students">
          <h2>All Students</h2>

          <button
            type="button"
            className="view-students-button"
          >
            See All Students
          </button>
        </div>

      </div>
    </div>
  );
}