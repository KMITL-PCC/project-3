import express from "express";
import redisClient from "../lib/redis";

const router = express.Router();

router.get("/", async (req, res) => {

  let redisStatus = "disconnected";

  try {
    if (redisClient.isOpen) {
      redisStatus = "connected";
    }
  } catch {
    redisStatus = "error";
  }

  const redisColor = redisStatus === "connected" ? "green" : "red";
  const memory = process.memoryUsage().rss / 1024 / 1024;

  res.send(`
  <html>

  <head>
    <title>API System Status</title>
    <meta http-equiv="refresh" content="5">

    <style>
      body{
        font-family:Arial;
        background:#f4f6f8;
        padding:40px;
      }

      .card{
        background:white;
        padding:30px;
        border-radius:10px;
        box-shadow:0 4px 10px rgba(0,0,0,0.1);
        max-width:600px;
        margin:auto;
      }

      h1{
        color:#2c3e50;
      }

      .status{
        margin:10px 0;
        font-size:18px;
      }

      .endpoint{
        background:#f1f1f1;
        padding:6px 10px;
        margin:5px;
        border-radius:5px;
        display:inline-block;
      }
    </style>

  </head>

  <body>

    <div class="card">

      <h1>🚀 API Server Running</h1>

      <div class="status">
        Server Status : <span style="color:green">running</span>
      </div>

      <div class="status">
        Redis Status : <span style="color:${redisColor}">${redisStatus}</span>
      </div>

      <div class="status">
        Node Version : ${process.version}
      </div>

      <div class="status">
        Uptime : ${Math.floor(process.uptime())} seconds
      </div>

      <div class="status">
        Memory : ${memory.toFixed(2)} MB
      </div>

      <div class="status">
        Time : ${new Date().toLocaleString()}
      </div>

      <h2>Available APIs</h2>

      <div class="endpoint">/health</div>
      <div class="endpoint">/ready</div>
      <div class="endpoint">/test</div>
      <div class="endpoint">/testsystem</div>
      <div class="endpoint">/users</div>
      <div class="endpoint">/rooms</div>
      <div class="endpoint">/auth</div>
      <div class="endpoint">/dashboard</div>

    </div>

  </body>

  </html>
  `);

});

export default router;