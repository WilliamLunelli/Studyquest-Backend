import * as z from "zod";

export const CreateSession = z.object({
  subjectId: z.string().uuid("subjectId deve ser um UUID válido"),
  studyTime: z.number().int().min(1, "studyTime deve ser ao menos 1 minuto"),
  questions: z.number().int().min(0).default(0),
  rate: z.number().min(0).max(10, "rate deve ser entre 0 e 10"),
});
