import * as z from "zod";

export const SetGoal = z.object({
  goalId: z.string().uuid(),
});

const DIAS_DA_SEMANA = [0, 1, 2, 3, 4, 5, 6];

export const SetAvailability = z.object({
  disponibilidade: z
    .array(
      z.object({
        diaSemana: z.number().int().min(0).max(6),
        minutos: z.number().int().min(0).max(960),
      }),
    )
    .length(7, "Os 7 dias da semana são obrigatórios.")
    .refine(
      (dias) => {
        const informados = new Set(dias.map((dia) => dia.diaSemana));
        return DIAS_DA_SEMANA.every((dia) => informados.has(dia));
      },
      { message: "Os 7 dias da semana (0 a 6) são obrigatórios, sem repetição." },
    ),
});

export const SetDifficulties = z.object({
  dificuldades: z
    .array(
      z.object({
        subjectId: z.string().uuid(),
        nivel: z.number().int().min(1).max(5),
      }),
    )
    .min(1, "Informe ao menos uma matéria."),
});
