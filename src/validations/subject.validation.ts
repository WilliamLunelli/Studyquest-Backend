import { z } from "zod";

export const createSubjectValidation = z.object({
  areaId: z.uuid("areaId deve ser um UUID válido"),
  subjectName: z
    .string()
    .trim()
    .min(2, "subjectName deve ter no mínimo 2 caracteres.")
    .max(100, "subjectName deve ter no máximo 100 caracteres."),
  subjectDescription: z
    .string()
    .trim()
    .max(500, "subjectDescription deve ter no máximo 500 caracteres.")
    .optional(),
});

export const updateSubjectValidation = z.object({
  subjectName: z
    .string()
    .trim()
    .min(2, "subjectName deve ter no mínimo 2 caracteres.")
    .max(100, "subjectName deve ter no máximo 100 caracteres.")
    .optional(),
  subjectDescription: z
    .string()
    .max(500, "subjectDescription deve ter no máximo 500 caracteres.")
    .trim()
    .optional(),
  areaId: z.string().trim().uuid("areaId deve ser um UUID válido").optional(),
});
