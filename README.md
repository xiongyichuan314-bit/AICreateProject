# Dynamic Data Management System

A full-stack web application for entering and managing data with CRUD operations and a SQLite database backend.

## Features

- Create, Read, Update, and Delete (CRUD) operations
- Modern responsive web interface
- Search and filtering capabilities
- Pagination for large datasets
- SQLite database for persistent storage
- RESTful API architecture

## Tech Stack

- Backend: Node.js, Express.js
- Frontend: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- Database: SQLite3
- API: RESTful endpoints

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the servers:
   - Backend API: `npm start` or `node api/server.js` (runs on port 8081)
   - Frontend: `node client/server.js` (runs on port 3000)
4. Visit `http://localhost:3000` in your browser to access the frontend
5. API endpoints available at `http://localhost:8081/api`

## API Endpoints

- GET /api/data - Get all data with pagination
- POST /api/data - Create new data entry
- GET /api/data/:id - Get specific data entry
- PUT /api/data/:id - Update specific data entry
- DELETE /api/data/:id - Delete specific data entry
- GET /api/search?q=:query - Search data

## Data Storage

Data is stored in `data.db` SQLite database file in the root directory.