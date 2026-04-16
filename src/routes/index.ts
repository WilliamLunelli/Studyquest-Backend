import { Router } from "express";
import Healthrouter from "./health.routes";
import Userrouter from "./user.routes";
import Sessionrouter from "./session.routes";

const router = Router();

router.use("/health", Healthrouter);
router.use("/users", Userrouter);
router.use("/registros", Sessionrouter);

export default router;
