import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { subjectController } from "../controllers/subject.controller";

const router = Router();

router.post("/:areaId", authMiddleware, subjectController.createSubject);

export default router;
