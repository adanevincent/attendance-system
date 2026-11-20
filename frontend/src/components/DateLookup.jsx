import "./DateLookup.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const formatDay = (isoDate) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function DateLookup() {
  const navigate = useNavigate();

  const todayIso = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  const [date, setDate] = useState(todayIso);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setError("");
    setResult(null);

    if (!date) {
      setError("Please choose a date.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/attendance/by-date?date=${encodeURIComponent(date)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load attendance.");
        return;
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dl-card">
      <h2>Attendance by Date</h2>

      <div className="dl-search">
        <input
          type="date"
          value={date}
          max={todayIso}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="button" onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="dl-error">{error}</p>}

      {result && (
        <div className="dl-result">
          <p className="dl-day">{formatDay(result.date)}</p>

          {!result.wasMarked ? (
            <p className="dl-missed">
              Attendance was not marked on this day.
            </p>
          ) : (
            <p className="dl-counts">
              {result.present} present · {result.absent} absent
              {result.notMarked > 0 && ` · ${result.notMarked} not marked`}
            </p>
          )}

          {result.wasMarked && (
            <div className="dl-table-wrapper">
              <table className="dl-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.students.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="dl-empty">
                        No students have been added yet.
                      </td>
                    </tr>
                  ) : (
                    result.students.map((student, index) => (
                      <tr key={student.name}>
                        <td>{index + 1}</td>
                        <td>{student.name}</td>
                        <td>
                          <span className={`dl-badge dl-${student.status}`}>
                            {student.status === "present" && "Present"}
                            {student.status === "absent" && "Absent"}
                            {student.status === "not-marked" && "Not marked"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}