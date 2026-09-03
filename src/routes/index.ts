import { Router } from "express";
import Healthrouter from "./health.routes";
import Userrouter from "./user.routes";

const router = Router();

router.use("/health", Healthrouter);
router.use("/users", Userrouter);

export default router;
