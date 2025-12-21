import 'dotenv/config'
// Import the express in typescript file
import express from 'express';

// Initialize the express engine
const app = express();

// Take a port 3000 for running server.
const port = process.env.PORT || 3000;

// Handling '/' Request
app.get('/', (req, res) => {
    res.json({
        message: "Hi"
    })
});

// Server setup
app.listen(port, () => {
    console.log(`TypeScript with Express 
         http://localhost:${port}/`);
});