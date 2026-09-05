import { SelfRating } from "../generated/prisma/enums";

const REVIEW_INTERVAL_BY_RATING: Record<SelfRating, number> = {
  TRAVEI: 1,
  OK: 3,
  TRANQUILO: 7,
};

const REVIEW_INTERVAL_BY_REPETITION: Record<number, number> = {
  2: 7,
  3: 15,
  4: 30,
  5: 60,
};

type ReviewPlanInput = {
  selfRating: SelfRating;
  originReview?: {
    agendadaPara: Date;
    repeticao: number;
  } | null;
  referenceDate: Date;
};

export function calculateNextReviewPlan(input: ReviewPlanInput) {
  if (!input.originReview) {
    return {
      intervaloDias: REVIEW_INTERVAL_BY_RATING[input.selfRating],
      repeticao: 1,
    };
  }

  const wasLate = isBeforeDay(input.originReview.agendadaPara, input.referenceDate);
  const currentRepetition = Math.max(1, input.originReview.repeticao);

  let nextRepetition: number;

  if (wasLate) {
    nextRepetition = currentRepetition;
  } else if (input.selfRating === SelfRating.TRAVEI) {
    nextRepetition = Math.max(1, currentRepetition - 1);
  } else {
    nextRepetition = Math.min(currentRepetition + 1, 5);
  }

  return {
    intervaloDias: getIntervalByRepetition(nextRepetition, input.selfRating),
    repeticao: nextRepetition,
  };
}

export function calculateDaysLate(agendadaPara: Date, referenceDate: Date) {
  const scheduledDay = startOfDay(agendadaPara);
  const referenceDay = startOfDay(referenceDate);

  if (scheduledDay >= referenceDay) {
    return 0;
  }

  return Math.floor(
    (referenceDay.getTime() - scheduledDay.getTime()) / 86400000,
  );
}

export function getReviewMultiplier(agendadaPara: Date, referenceDate: Date) {
  return isSameDay(agendadaPara, referenceDate) ? 2 : 1;
}

export function getActiveRecallScript(subjectName: string) {
  const normalized = subjectName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (isExactSubject(normalized)) {
    return {
      aviso: "Não abra o material ainda",
      prompts: [
        "Resolva um exemplo simples do assunto sem consultar o material.",
        "Explique quais formulas, propriedades ou passos voce precisou lembrar.",
        "Confira o material e marque exatamente onde travou ou errou.",
      ],
    };
  }

  if (isLawSubject(normalized)) {
    return {
      aviso: "Não abra o material ainda",
      prompts: [
        "Escreva a regra principal do assunto com suas palavras.",
        "Liste excecoes, prazos ou conceitos que costumam confundir.",
        "Abra a lei seca depois e compare ponto a ponto o que ficou faltando.",
      ],
    };
  }

  return {
    aviso: "Não abra o material ainda",
    prompts: [
      "Explique o assunto como se estivesse ensinando para outra pessoa.",
      "Liste os pontos que voce lembrou com seguranca e os que ficaram vagos.",
      "Consulte o material no final e transforme as falhas em perguntas curtas.",
    ],
  };
}

export function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getIntervalByRepetition(repetition: number, selfRating: SelfRating) {
  if (repetition === 1) {
    return REVIEW_INTERVAL_BY_RATING[selfRating];
  }

  return REVIEW_INTERVAL_BY_REPETITION[repetition] ?? 60;
}

function isSameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function isBeforeDay(left: Date, right: Date) {
  return startOfDay(left).getTime() < startOfDay(right).getTime();
}

function isExactSubject(subjectName: string) {
  return [
    "matematica",
    "fisica",
    "quimica",
    "raciocinio logico",
    "estatistica",
  ].some((item) => subjectName.includes(item));
}

function isLawSubject(subjectName: string) {
  return [
    "direito",
    "legislacao",
    "constitucional",
    "administrativo",
    "penal",
    "civil",
    "tributario",
  ].some((item) => subjectName.includes(item));
}
