import { Router } from "express";
import Healthrouter from "./health.routes";
import Userrouter from "./user.routes";
import Goalrouter from "./goal.routes";
import Onboardingrouter from "./onboarding.routes";
import StudyCyclerouter from "./cycle.routes";

const router = Router();

router.use("/health", Healthrouter);
router.use("/auth", Userrouter);
router.use("/goals", Goalrouter);
router.use("/me", Onboardingrouter);
router.use("/cycles", StudyCyclerouter);

export default router;
