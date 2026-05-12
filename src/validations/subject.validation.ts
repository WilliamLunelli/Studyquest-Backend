import { z } from "zod";

export const createSubjectValidation = z.object({
  areaId: z.uuid("areaId deve ser um UUID válido"),
  subjectName: z
    .string()
    .min(2, "subjectName deve ter no mínimo 2 caracteres.")
    .max(100, "subjectName deve ter no máximo 100 caracteres."),
  subjectDescription: z
    .string()
    .max(500, "subjectDescription deve ter no máximo 500 caracteres.")
    .optional(),
});
