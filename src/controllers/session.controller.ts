import { Request, Response } from "express";
import * as sessionService from "../services/session.service";

export const listSessionsController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const sessions = await sessionService.listStudySessions(userId);

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro interno do servidor." });
  }
};

export const createSessionController = async (req: Request, res: Response) => {
  try {
    const {
      subjectId,
      studyTime,
      questions,
      rate,
      studiedAt,
      correctAnswers,
      sessionType,
      pomodoroCount,
      notes,
    } = req.body;

    const userId = req.userId!;

    const session = await sessionService.createStudySession({
      userId,
      subjectId,
      studyTime,
      questions,
      rate,
      studiedAt: new Date(studiedAt),
      correctAnswers,
      sessionType,
      pomodoroCount,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Sessão de estudo criada com sucesso.",
      session,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Erro interno do servidor." });
  }
};
