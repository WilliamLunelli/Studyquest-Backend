import { SessionStatus } from "../generated/prisma/enums";

type SessionTimeFields = {
  status: SessionStatus;
  minutosAcumulados: number;
  resumedAt: Date | null;
};

/**
 * The client never sends session duration — XP would become
 * self-reported and meaningless. The server always derives it from
 * timestamps: RUNNING adds the in-progress chunk (now - resumedAt) to
 * whatever was already closed before the current pause; PAUSED/other
 * statuses only have what is already closed.
 */
export function calculateAccumulatedMinutes(session: SessionTimeFields): number {
  if (session.status !== "RUNNING" || !session.resumedAt) {
    return session.minutosAcumulados;
  }

  const elapsedMs = Date.now() - session.resumedAt.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  return session.minutosAcumulados + elapsedMinutes;
}

export function calculateAccumulatedMinutesAt(
  session: SessionTimeFields,
  now: Date,
): number {
  if (session.status !== "RUNNING" || !session.resumedAt) {
    return session.minutosAcumulados;
  }

  const elapsedMs = now.getTime() - session.resumedAt.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  return session.minutosAcumulados + elapsedMinutes;
}
