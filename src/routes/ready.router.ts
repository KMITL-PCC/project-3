import { Router } from "express";

const router = Router();

router.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
  });
});

export default router;
