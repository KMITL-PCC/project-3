import express from "express";
import redisClient from "../lib/redis";

const router = express.Router();

router.get("/testsystem", async (req, res) => {
  let redisStatus = "disconnected";
  let redisPing = "fail";

  try {
    if (redisClient.isOpen) {
      redisStatus = "connected";

      // ตรวจว่า Redis ตอบสนองหรือไม่
      const ping = await redisClient.ping();
      if (ping === "PONG") {
        redisPing = "ok";
      }
    }
  } catch (error) {
    redisStatus = "error";
  }

  // ตรวจ Memory ของ server
  const memory = process.memoryUsage();

  // uptime อ่านง่าย
  const uptimeSeconds = Math.floor(process.uptime());
  const uptimeReadable = `${Math.floor(uptimeSeconds / 60)} minutes`;

  res.json({
    status: "ok",
    server: "running",

    redis: {
      connection: redisStatus,
      ping: redisPing
    },

    system: {
      node_version: process.version,
      environment: process.env.NODE_ENV || "development",
      uptime_seconds: uptimeSeconds,
      uptime_readable: uptimeReadable
    },

    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal
    },

    timestamp: new Date().toISOString()
  });
});

export default router;