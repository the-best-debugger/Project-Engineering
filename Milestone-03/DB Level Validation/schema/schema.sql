-- FocusForge: schema with database-level integrity constraints (PostgreSQL)
-- Run after connecting to an empty database (or drop tables first).

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE projects (
    id INT PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL
);

CREATE TABLE tasks (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    priority INT NOT NULL CHECK (priority >= 1 AND priority <= 5),
    project_id INT NOT NULL REFERENCES projects (id)
);
