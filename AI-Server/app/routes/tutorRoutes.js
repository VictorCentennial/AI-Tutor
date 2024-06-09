import express from "express";
import {
  handleInitialQuery,
  handleFollowUpQuery,
  getCourses,
} from "../controllers/tutorController.js";

const router = express.Router();

router.post("/initial-query", handleInitialQuery);
router.post("/follow-up-query", handleFollowUpQuery);

router.get("/courses", getCourses);

export default router;
