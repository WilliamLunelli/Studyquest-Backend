import { Router } from "express";
import { createSessionController } from "../controllers/session.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { CreateSession } from "../validations/session.validations";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateBody(CreateSession),
  createSessionController,
);

export default router;
