import { Router } from "express";
import Healthrouter from "./health.routes";
import Userrouter from "./user.routes";
import Sessionrouter from "./session.routes";
import Subjectrouter from "./subject.routes";

const router = Router();

router.use("/health", Healthrouter);
router.use("/users", Userrouter);
router.use("/registros", Sessionrouter);
router.use("/subject", Subjectrouter);

export default router;
