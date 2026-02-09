import { Router } from "express";
import {
  loginController,
  registerController,
} from "../controllers/user.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { UserLogin, UserRegister } from "../validations/user.validations";

const router = Router();

router.post("/register", validateBody(UserRegister), registerController);
router.post("/login", validateBody(UserLogin), loginController);

// TODO: implement login, profile handlers
// router.get("/profile");
// router.put("/profile");

export default router;
