import { Router } from "express";
import {
  loginController,
  registerController,
} from "../controllers/user.controller";

const router = Router();

router.post("/register", registerController);

// TODO: implement login, profile handlers

router.post("/login", loginController);
// router.get("/profile");
// router.put("/profile");

export default router;
