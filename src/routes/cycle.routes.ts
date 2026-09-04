import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { cycleController } from "../controllers/cycle.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { UpdateCycleBlock } from "../validations/cycle.validation";

const router = Router();

router.post("/generate", authMiddleware, cycleController.generate);

router.get("/current", authMiddleware, cycleController.getCycles);

router.patch(
  "/blocks/:id",
  authMiddleware,
  validateBody(UpdateCycleBlock),
  cycleController.updateCycle,
);

router.post(
  "/blocks/:id/complete",
  authMiddleware,
  cycleController.completeBlock,
);

router.get("/alignment", authMiddleware, cycleController.alignment);

export default router;
