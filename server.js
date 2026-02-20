const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static('pkg'));
app.use(express.static('public'));
app.use(express.static('.')); // Serve files from root directory

// Serve HTML files
app.get('/embed-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'embed-test.html'));
});

app.get('/test-embed', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-embed.html'));
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve WASM files with correct MIME types
app.get('/pkg/:file', (req, res) => {
    const filePath = path.join(__dirname, 'pkg', req.params.file);
    if (fs.existsSync(filePath)) {
        // Set appropriate MIME type based on file extension
        const ext = path.extname(filePath);
        if (ext === '.wasm') {
            res.set('Content-Type', 'application/wasm');
        } else if (ext === '.js') {
            res.set('Content-Type', 'application/javascript');
        } else if (ext === '.json') {
            res.set('Content-Type', 'application/json');
        }
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Serve embed JavaScript files with correct MIME type
app.get('/vector-support-embed.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'vector-support-embed.js'));
});

app.get('/vector-support-embed.min.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'vector-support-embed.min.js'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});