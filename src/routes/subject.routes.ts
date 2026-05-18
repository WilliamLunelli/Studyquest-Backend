import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { subjectController } from "../controllers/subject.controller";

const router = Router();

router.post("/:areaId", authMiddleware, subjectController.createSubject);

router.get(
  "/list-subjects/:userId",
  authMiddleware,
  subjectController.listSubjects,
);

router.get(
  "/get-subject/:subjectId",
  authMiddleware,
  subjectController.getSubject,
);

router.put(
  "/update-subject/:subjectId",
  authMiddleware,
  subjectController.updateSubject,
);

router.delete(
  "/delete-subject/:subjectId",
  authMiddleware,
  subjectController.deleteSubject,
);
export default router;
