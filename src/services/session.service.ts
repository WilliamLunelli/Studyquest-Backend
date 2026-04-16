import prisma from "../config/database";

export async function createStudySession(
  userId: string,
  subjectId: string,
  studyTime: number,
  questions: number,
  rate: number,
) {
  const result = await prisma.studySession.create({
    data: {
      userId: userId,
      subjectId: subjectId,
      studyTime: studyTime,
      questions: questions,
      rate: rate,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: calcularXP(studyTime) },
    },
  });

  return result;
}

function calcularXP(studyTime: number) {
  if (studyTime <= 10) {
    return studyTime * 1.1;
  } else if (studyTime > 10 && studyTime <= 30) {
    return studyTime * 1.3;
  } else {
    return studyTime * 1.5;
  }
}
