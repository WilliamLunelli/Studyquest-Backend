import { SessionStatus } from "../generated/prisma/enums";

type SessionTimeFields = {
  status: SessionStatus;
  minutosAcumulados: number;
  resumedAt: Date | null;
};

/**
 * Rule 1 from CLAUDE.md: the client never sends duration, the server
 * calculates it from the timestamp difference. RUNNING adds the
 * in-progress chunk (now - resumedAt) to whatever was already closed
 * before the current pause; PAUSED/other statuses only have what is
 * already closed.
 */
export function calculateAccumulatedMinutes(session: SessionTimeFields): number {
  if (session.status !== "RUNNING" || !session.resumedAt) {
    return session.minutosAcumulados;
  }

  const elapsedMs = Date.now() - session.resumedAt.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  return session.minutosAcumulados + elapsedMinutes;
}
