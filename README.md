# Dynamic Data Entry Website

A simple web application for entering and managing data with a SQLite database backend.

## Features

- Simple form to enter data
- View all saved data
- Search functionality
- SQLite database for persistent storage
- Responsive web interface

## Tech Stack

- Node.js
- Express.js
- SQLite3
- HTML/CSS/JavaScript (frontend)

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start` or `node app.js`
4. Visit `http://localhost:8081` in your browser

## Configuration

The application runs on port 8081 by default. You can modify the PORT variable in app.js to change this.

## Data Storage

Data is stored in `data.db` SQLite database file in the root directory.