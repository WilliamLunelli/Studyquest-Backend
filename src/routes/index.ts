import { Router } from "express";
import Healthrouter from "./health.routes";
import Userrouter from "./user.routes";
import Goalrouter from "./goal.routes";
import Onboardingrouter from "./onboarding.routes";

const router = Router();

router.use("/health", Healthrouter);
router.use("/auth", Userrouter);
router.use("/goals", Goalrouter);
router.use("/me", Onboardingrouter);

export default router;
