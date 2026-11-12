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