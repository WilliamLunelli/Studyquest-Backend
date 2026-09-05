import * as z from "zod";

export const CreateQuestionLog = z
  .object({
    subjectId: z.uuid(),
    topicId: z.uuid(),
    feitas: z.number().int().min(1).max(500),
    acertadas: z.number().int().min(0),
    sessionId: z.uuid().optional(),
    data: z.coerce.date().optional(),
  })
  .refine((body) => body.acertadas <= body.feitas, {
    message: "acertadas não pode ser maior que feitas.",
    path: ["acertadas"],
  });
