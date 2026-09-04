import * as z from "zod";

export const UpdateCycleBlock = z
  .object({
    duracaoMin: z.number().int().min(25).max(60).optional(),
    subjectId: z.uuid().optional(),
    topicId: z.uuid().optional(),
    ordem: z.number().int().min(1).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    error: "Informe ao menos um campo para atualizar.",
  });
