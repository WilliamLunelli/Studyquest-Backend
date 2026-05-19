import { calcularXP } from "../utils/xp.utils";
import { sessionRepository } from "../repositories/session.repository";
import { userRepository } from "../repositories/user.repository";

export async function createStudySession(data: {
  userId: string;
  subjectId: string;
  studyTime: number;
  questions: number;
  rate: number;
  studiedAt: Date;
  correctAnswers?: number;
  sessionType?: string;
  pomodoroCount?: number;
  notes?: string;
}) {
  const xpEarned = calcularXP(data.studyTime);

  const result = await sessionRepository.createStudySession({
    ...data,
    xpEarned,
  });

  await userRepository.incrementXP(data.userId, xpEarned);

  return result;
}

export async function listStudySessions(userId: string) {
  return sessionRepository.listStudySessions(userId);
}
