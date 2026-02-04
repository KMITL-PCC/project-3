import "dotenv/config";
// Import the express in typescript file
import express from "express";
import router from "./routes/router";

// Initialize the express engine
const app = express();

// Take a port 3000 for running server.
const port = process.env.PORT || 3000;

// Handling '/' Request

app.use(router);

// Server setup
app.listen(port, () => {
	console.log(`TypeScript with Express 
         http://localhost:${port}/`);
});
