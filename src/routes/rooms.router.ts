// /app/src/routes/rooms.router.ts
import { Router } from "express"; // Removed 'type' so we can use the actual function
import roomsController from "../controllers/rooms.controller";

// 1. Create the router instance
const router = Router();

// 2. Attach routes directly to the instance
router.get("/rooms", (req, res) => {
  roomsController.handleGetAll(req, res);
});

// router.get("/rooms/:id", (req, res) => {
//   roomsController.handleGetById(req, res);
// });

// router.post("/rooms", (req, res) => {
//   roomsController.handleCreate(req, res);
// });

// router.put("/rooms/:id", (req, res) => {
//   roomsController.handleUpdate(req, res);
// });

// router.delete("/rooms/:id", (req, res) => {
//   roomsController.handleDelete(req, res);
// });

// 3. Export the instantiated router
export default router;