import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json({
      totalTasks: 0,
      completed: 0,
      pending: 0,
      streak: 0,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

export default router;