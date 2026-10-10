import "./Attendance.css";

export default function Attendance() {
  return (
    <div className="attendance-page">
      <div className="attendance-container">

        <h2>Great Faith Academy</h2>

        <h1>Mark Attendance</h1>

        <p>JHS 2</p>

        <div className="attendance-date">
          <p>Date: <span>08/10/2026</span></p>
        </div>

        <div className="student-list">
          {/* Students will appear here from the database */}
        </div>

      </div>
    </div>
  );
}