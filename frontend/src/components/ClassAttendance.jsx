import "./ClassAttendance.css";
import { useState, useEffect } from "react";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const formatStamp = (date) =>
  date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Formats a "YYYY-MM-DD" string without the timezone shifting the day
const formatDay = (isoDate) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function ClassAttendance() {
  const [showMark, setShowMark] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [summary, setSummary] = useState([]);
  const [missedDays, setMissedDays] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Ask the server which school days had no attendance marked
  const loadMissedDays = async () => {
    try {
      const response = await fetch("/api/attendance/history", {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) return; // not critical, so no error banner

      // Keep only days that were not marked, and skip today
      setMissedDays(data.days.filter((day) => !day.wasMarked && !day.isToday));
    } catch (err) {
      console.error(err);
    }
  };

  // Load missed days once when the card first appears
  useEffect(() => {
    loadMissedDays();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await fetch("/api/attendance/summary", {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load students.");
        return;
      }
      setSummary(data.students);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    }
  };

  const handleMarkAttendance = async () => {
    setMessage("");
    setError("");

    if (showMark) {
      setShowMark(false);
      return;
    }

    try {
      const response = await fetch("/api/students", { headers: authHeaders() });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load students.");
        return;
      }

      setStudents(data.students);
      setMarks({});
      setShowMark(true);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    }
  };

  const handleSeeAll = async () => {
    setMessage("");
    setError("");

    if (showAll) {
      setShowAll(false);
      return;
    }

    await loadSummary();
    setShowAll(true);
  };

  const handleMark = (studentName, status) => {
    setMarks((previous) => {
      if (previous[studentName]?.status === status) {
        const { [studentName]: removed, ...rest } = previous;
        return rest;
      }
      return { ...previous, [studentName]: { status, time: new Date() } };
    });
  };

  const handleSave = async () => {
    setMessage("");
    setError("");

    if (students.some((student) => !marks[student.name])) {
      setError("Please mark every student before saving.");
      return;
    }

    const records = students.map((student) => ({
      studentName: student.name,
      status: marks[student.name].status,
    }));

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          date: new Date().toLocaleDateString("en-CA"),
          records,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save attendance.");
        return;
      }

      setMessage("Attendance saved.");
      setShowMark(false);
      setMarks({});

      if (showAll) {
        await loadSummary();
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    }
  };

  return (
    <div className="ca-card">
      <div className="ca-header">
        <h2>Class Attendance</h2>
        <p className="ca-date">{today}</p>

        {/* Show the 5 most recent days the teacher forgot to mark */}
        {missedDays.slice(0, 5).map((day) => (
          <p key={day.date} className="ca-missed">
            {formatDay(day.date)}: attendance was not marked
          </p>
        ))}

        {missedDays.length > 5 && (
          <p className="ca-missed-more">
            + {missedDays.length - 5} earlier days not marked
          </p>
        )}
      </div>

      <div className="ca-actions">
        <button onClick={handleMarkAttendance}>
          {showMark ? "Close Attendance" : "Mark Attendance"}
        </button>
        <button className="ca-secondary" onClick={handleSeeAll}>
          {showAll ? "Hide All Students" : "See All Students"}
        </button>
      </div>

      {error && <p className="ca-error">{error}</p>}
      {message && <p className="ca-success">{message}</p>}

      {showMark && (
        <section className="ca-section">
          <h3>Mark Attendance</h3>
          <div className="ca-table-wrapper">
            <table className="ca-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Date &amp; Time</th>
                  <th>Present</th>
                  <th>Absent</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="ca-empty">
                      No students have been added yet.
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => {
                    const mark = marks[student.name];
                    return (
                      <tr key={student.name}>
                        <td>{index + 1}</td>
                        <td className="ca-name">{student.name}</td>
                        <td>{mark ? formatStamp(mark.time) : "—"}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={mark?.status === "present"}
                            onChange={() => handleMark(student.name, "present")}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={mark?.status === "absent"}
                            onChange={() => handleMark(student.name, "absent")}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {students.length > 0 && (
            <button className="ca-save" onClick={handleSave}>
              Save Attendance
            </button>
          )}
        </section>
      )}

      {showAll && (
        <section className="ca-section">
          <h3>All Students</h3>
          <div className="ca-table-wrapper">
            <table className="ca-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Days Present</th>
                  <th>Days Absent</th>
                  <th>Total Days</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="ca-empty">
                      No students have been added yet.
                    </td>
                  </tr>
                ) : (
                  summary.map((student, index) => (
                    <tr key={student.name}>
                      <td>{index + 1}</td>
                      <td className="ca-name">{student.name}</td>
                      <td>{student.class}</td>
                      <td className="ca-present">{student.daysPresent}</td>
                      <td className="ca-absent">{student.daysAbsent}</td>
                      <td>{student.totalDays}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}