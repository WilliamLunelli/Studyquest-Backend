import { Router } from "express";

// TESTE
import Arearouter from "./area.routes";

const router = Router();

// TESTE
router.use("/area", Arearouter);

export default router;
