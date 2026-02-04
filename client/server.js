const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the client directory
const clientDir = path.join(__dirname);
app.use(express.static(clientDir));

// Route to serve the index.html file for any route that doesn't match static files
app.get(/^(?!\/api\/?.*)\/.*$/, (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Client server running at http://localhost:${PORT}/`);
    console.log(`Access the frontend at http://localhost:${PORT}/`);
});