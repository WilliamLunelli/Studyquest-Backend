import { Router } from "express";
import {
  createSessionController,
  listSessionsController,
} from "../controllers/session.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { CreateSession } from "../validations/session.validations";

const router = Router();

router.get("/", authMiddleware, listSessionsController);

router.post(
  "/",
  authMiddleware,
  validateBody(CreateSession),
  createSessionController,
);

export default router;
