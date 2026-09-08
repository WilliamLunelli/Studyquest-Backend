import * as z from "zod";
import { SessionPreset, SessionType } from "../generated/prisma/enums";

export const CreateSession = z
  .object({
    blocoId: z.uuid().optional(),
    subjectId: z.uuid(),
    topicId: z.uuid(),
    tipo: z.enum(SessionType),
    preset: z.enum(SessionPreset),
    duracaoAlvoMin: z.number().int().positive().optional(),
    reviewId: z.uuid().optional(),
  })
  .refine(
    (body) => {
      if (body.preset === SessionPreset.P25_5) {
        return body.duracaoAlvoMin === 25;
      }

      if (body.preset === SessionPreset.P50_10) {
        return body.duracaoAlvoMin === 50;
      }

      return true;
    },
    {
      error:
        "duracaoAlvoMin deve ser 25 para o preset P25_5 e 50 para o preset P50_10.",
      path: ["duracaoAlvoMin"],
    },
  );

export const FinishSession = z.object({
  autoavaliacao: z.enum(["travei", "ok", "tranquilo"]),
  nota: z.string().max(1000).optional(),
});
