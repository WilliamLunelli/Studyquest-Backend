import { Router } from "express";
import Healthrouter from "./health.routes";
import Userrouter from "./user.routes";
import Goalrouter from "./goal.routes";
import Onboardingrouter from "./onboarding.routes";
import StudyCyclerouter from "./cycle.routes";
import SessionRouter from "./session.routes";
import Homerouter from "./home.routes";
import QuestionLogrouter from "./question-log.routes";
import Reviewrouter from "./review.routes";
import Dashboardrouter from "./dashboard.routes";

const router = Router();

router.use("/health", Healthrouter);
router.use("/auth", Userrouter);
router.use("/goals", Goalrouter);
router.use("/me", Onboardingrouter);
router.use("/cycles", StudyCyclerouter);
router.use("/sessions", SessionRouter);
router.use("/home", Homerouter);
router.use("/question-logs", QuestionLogrouter);
router.use("/reviews", Reviewrouter);
router.use("/dashboard", Dashboardrouter);

export default router;
