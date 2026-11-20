CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  reset_token_hash TEXT,
  reset_token_expires TIMESTAMPTZ
);

CREATE TABLE jss1_students (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE jss2_students (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE jss3_students (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);
/*these table beow is going to hold the attendace of each class*/

CREATE TABLE jss1_attendance (
  student_name TEXT NOT NULL REFERENCES jss1_students(name) ON UPDATE CASCADE ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_name, attendance_date)
);

CREATE TABLE jss2_attendance (
  student_name TEXT NOT NULL REFERENCES jss2_students(name) ON UPDATE CASCADE ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_name, attendance_date)
);

CREATE TABLE jss3_attendance (
  student_name TEXT NOT NULL REFERENCES jss3_students(name) ON UPDATE CASCADE ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_name, attendance_date)
);