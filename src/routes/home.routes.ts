import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { homeController } from "../controllers/home.controller";

const router = Router();

router.get("", authMiddleware, homeController.get);

export default router;
