import { questionLogRepository } from "../repositories/question-log.repository";
import {
  CreateQuestionLogInput,
  CreateQuestionLogResponse,
  QuestionLogListFilters,
  QuestionLogListQueryInput,
  QuestionLogListResponse,
} from "../types/question-log.type";
import { AppError } from "../utils/app-error";

const QUESTION_LOG_XP = 15;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function createQuestionLog(
  userId: string,
  input: CreateQuestionLogInput,
): Promise<CreateQuestionLogResponse> {
  validateCreateQuestionLogInput(input);

  const topic = await questionLogRepository.findTopicInSubject(
    input.subjectId,
    input.topicId,
  );

  if (!topic) {
    throw new AppError(422, "O assunto informado nao pertence a materia.");
  }

  if (input.sessionId) {
    const session = await questionLogRepository.findSessionById(
      userId,
      input.sessionId,
    );

    if (!session) {
      throw new AppError(404, "Sessao de estudo nao encontrada.");
    }

    if (
      session.subjectId !== input.subjectId ||
      (session.topicId !== null && session.topicId !== input.topicId)
    ) {
      throw new AppError(
        422,
        "A sessao informada nao corresponde a materia e assunto enviados.",
      );
    }
  }

  const data = input.data ? new Date(input.data) : new Date();
  const percentualAcerto = calculatePercentage(input.acertadas, input.feitas);
  const { startOfDay, endOfDay } = getDayRange(data);
  const reviewDate = getNextDay(data);

  const result = await questionLogRepository.createWithEffects({
    userId,
    data: {
      topicId: input.topicId,
      feitas: input.feitas,
      acertadas: input.acertadas,
      data,
    },
    startOfDay,
    endOfDay,
    grantXp: QUESTION_LOG_XP,
    shouldAnticipateReview: percentualAcerto < 50,
    reviewDate,
  });

  return {
    id: result.log.id,
    percentualAcerto,
    xpGanho: result.xpGanho,
  };
}

export async function listQuestionLogs(
  userId: string,
  query: QuestionLogListQueryInput,
): Promise<QuestionLogListResponse> {
  const filters = parseQuestionLogFilters(query);

  const [logs, total, aggregate] = await Promise.all([
    questionLogRepository.findMany(userId, filters),
    questionLogRepository.count(userId, filters),
    questionLogRepository.aggregate(userId, filters),
  ]);

  const feitas = aggregate._sum.feitas ?? 0;
  const acertadas = aggregate._sum.acertadas ?? 0;

  return {
    items: logs.map((log) => {
      return {
        id: log.id,
        subjectId: log.topic.subject.id,
        materia: log.topic.subject.nome,
        topicId: log.topic.id,
        assunto: log.topic.nome,
        feitas: log.feitas,
        acertadas: log.acertadas,
        percentualAcerto: calculatePercentage(log.acertadas, log.feitas),
        data: log.data,
      };
    }),
    aggregate: {
      feitas,
      acertadas,
      percentualAcerto: calculatePercentage(acertadas, feitas),
    },
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

function validateCreateQuestionLogInput(input: CreateQuestionLogInput) {
  if (input.feitas < 1 || input.feitas > 500) {
    throw new AppError(422, "A quantidade de questoes deve estar entre 1 e 500.");
  }

  if (input.acertadas > input.feitas) {
    throw new AppError(
      422,
      "A quantidade de questoes acertadas nao pode ser maior que as feitas.",
    );
  }

  if (input.acertadas < 0) {
    throw new AppError(422, "A quantidade de questoes acertadas nao pode ser negativa.");
  }
}

function parseQuestionLogFilters(
  query: QuestionLogListQueryInput,
): QuestionLogListFilters {
  const page = parsePositiveInteger(query.page, DEFAULT_PAGE, "page");
  const limit = Math.min(
    parsePositiveInteger(query.limit, DEFAULT_LIMIT, "limit"),
    MAX_LIMIT,
  );
  const de = parseDateFilter(query.de, "de", "start");
  const ate = parseDateFilter(query.ate, "ate", "end");

  if (de && ate && de >= ate) {
    throw new AppError(422, "A data inicial deve ser anterior a data final.");
  }

  return {
    subjectId: parseOptionalString(query.subjectId, "subjectId"),
    topicId: parseOptionalString(query.topicId, "topicId"),
    de,
    ate,
    page,
    limit,
  };
}

function parsePositiveInteger(value: unknown, fallback: number, field: string) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError(422, `Parametro '${field}' invalido.`);
  }

  return parsed;
}

function parseOptionalString(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(422, `Parametro '${field}' invalido.`);
  }

  return value;
}

function parseDateFilter(
  value: unknown,
  field: string,
  range: "start" | "end",
) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(422, `Parametro '${field}' invalido.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(422, `Parametro '${field}' invalido.`);
  }

  if (range === "start") {
    date.setHours(0, 0, 0, 0);
    return date;
  }

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date;
}

function calculatePercentage(acertadas: number, feitas: number) {
  if (feitas === 0) {
    return 0;
  }

  return Math.round((acertadas / feitas) * 100);
}

function getDayRange(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return {
    startOfDay,
    endOfDay,
  };
}

function getNextDay(date: Date) {
  const nextDay = new Date(date);
  nextDay.setHours(0, 0, 0, 0);
  nextDay.setDate(nextDay.getDate() + 1);

  return nextDay;
}
