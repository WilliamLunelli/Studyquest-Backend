import { reviewRepository } from "../repositories/review.repository";
import {
  ReviewDetailResponse,
  ReviewTodayItem,
  ReviewUpcomingItem,
  ReviewUpcomingQueryInput,
} from "../types/review.types";
import { AppError } from "../utils/app-error";
import {
  addDays,
  calculateDaysLate,
  getActiveRecallScript,
  getReviewMultiplier,
  startOfDay,
} from "../utils/review.utils";

const DEFAULT_UPCOMING_DAYS = 7;
const MAX_UPCOMING_DAYS = 60;

export async function getTodayReviews(
  userId: string,
): Promise<ReviewTodayItem[]> {
  const today = startOfDay(new Date());
  const endOfDay = addDays(today, 1);

  await archiveExpiredReviews(userId, today);

  const reviews = await reviewRepository.findTodayAndOverdue(userId, endOfDay);

  return reviews.map((review) => toReviewListItem(review, today));
}

export async function getReviewDetail(
  userId: string,
  reviewId: string,
): Promise<ReviewDetailResponse> {
  await archiveExpiredReviews(userId, startOfDay(new Date()));

  const review = await reviewRepository.findById(userId, reviewId);

  if (!review) {
    throw new AppError(404, "Revisao nao encontrada.");
  }

  const ultimaSessao = await reviewRepository.findLastFinishedSessionByTopic(
    userId,
    review.topic.id,
  );

  return {
    reviewId: review.id,
    materia: review.topic.subject.nome,
    assunto: review.topic.nome,
    repeticao: review.repeticao,
    roteiro: getActiveRecallScript(review.topic.subject.nome),
    ultimaSessao: ultimaSessao?.finishedAt
      ? {
          data: ultimaSessao.finishedAt,
          autoavaliacao: ultimaSessao.selfRating,
          minutos: ultimaSessao.minutosAcumulados,
        }
      : null,
  };
}

export async function getUpcomingReviews(
  userId: string,
  query: ReviewUpcomingQueryInput,
): Promise<ReviewUpcomingItem[]> {
  const days = parseUpcomingDays(query.dias);
  const today = startOfDay(new Date());
  const endDate = addDays(today, days + 1);

  await archiveExpiredReviews(userId, today);

  const reviews = await reviewRepository.findUpcoming(userId, today, endDate);

  return reviews.map((review) => toReviewListItem(review, today));
}

function toReviewListItem(
  review: Awaited<ReturnType<typeof reviewRepository.findTodayAndOverdue>>[number],
  today: Date,
): ReviewTodayItem {
  const atrasadaEmDias = calculateDaysLate(review.agendadaPara, today);

  return {
    reviewId: review.id,
    subjectId: review.topic.subject.id,
    materia: review.topic.subject.nome,
    topicId: review.topic.id,
    assunto: review.topic.nome,
    agendadaPara: review.agendadaPara,
    atrasadaEmDias,
    repeticao: review.repeticao,
    multiplicadorXp: getReviewMultiplier(review.agendadaPara, today),
  };
}

function parseUpcomingDays(value: unknown) {
  if (value === undefined) {
    return DEFAULT_UPCOMING_DAYS;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_UPCOMING_DAYS) {
    throw new AppError(422, "Parametro 'dias' invalido.");
  }

  return parsed;
}

async function archiveExpiredReviews(userId: string, today: Date) {
  await reviewRepository.archiveVeryLateReviews(userId, addDays(today, -30));
}
