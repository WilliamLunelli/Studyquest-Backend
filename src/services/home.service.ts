import { homeRepository } from "../repositories/home.repository";
import { streakShieldRepository } from "../repositories/streak-shield.repository";
import { HomeResponse } from "../types/home.types";
import { AppError } from "../utils/app-error";
import { calcularNivel } from "../utils/level.utils";
import { checkOnboardingStatus } from "./user.service";

export async function getHome(userId: string): Promise<HomeResponse> {
  const onboardingCompleto = await checkOnboardingStatus(userId);

  if (!onboardingCompleto) {
    throw new AppError(409, "Complete o onboarding antes de acessar a home.");
  }

  const hoje = new Date();

  const inicioDoDia = new Date(hoje);
  inicioDoDia.setHours(0, 0, 0, 0);

  const fimDoDia = new Date(inicioDoDia);
  fimDoDia.setDate(fimDoDia.getDate() + 1);

  const [
    user,
    cycle,
    revisoes,
    minutosHojeResult,
    escudosDisponiveis,
    estudandoAgora,
  ] = await Promise.all([
    homeRepository.findUserHomeData(userId),
    homeRepository.findActiveCycleWithBlocks(userId),
    homeRepository.findPendingReviewsUntil(userId, fimDoDia),
    homeRepository.sumFinishedMinutesToday(userId, inicioDoDia, fimDoDia),
    streakShieldRepository.getDisponiveis(
      userId,
      hoje.getMonth() + 1,
      hoje.getFullYear(),
    ),
    homeRepository.countRunningSessions(),
  ]);

  if (!user) {
    throw new AppError(404, "Usuário não encontrado.");
  }

  if (!cycle) {
    throw new AppError(409, "Gere um ciclo antes de acessar a home.");
  }

  const blocoAtual = cycle.blocks[cycle.posicaoAtual] ?? cycle.blocks[0];

  if (!blocoAtual) {
    throw new AppError(409, "Gere um ciclo antes de acessar a home.");
  }

  const temRevisaoPrioritaria = revisoes.length > 0;

  const proximoBloco: HomeResponse["proximoBloco"] = {
    blocoId: blocoAtual.id,
    materia: blocoAtual.subject.nome,
    assunto: blocoAtual.topic?.nome ?? null,
    duracaoMin: blocoAtual.duracao,
    tipoSugerido: temRevisaoPrioritaria ? "revisao" : "teoria",
  };

  const revisoesHoje: HomeResponse["revisoesHoje"] = revisoes.map((review) => {
    const atrasada = review.agendadaPara < inicioDoDia;

    return {
      reviewId: review.id,
      materia: review.topic.subject.nome,
      assunto: review.topic.nome,
      agendadaPara: review.agendadaPara,
      multiplicadorXp: atrasada ? 1 : 2,
      atrasada,
    };
  });

  const diaSemana = hoje.getDay();

  const disponibilidadeHoje = user.availabilities.find((item) => {
    return item.diaSemana === diaSemana;
  });

  const metaDiariaMin = disponibilidadeHoje?.minutos ?? 0;

  const minutosHoje = minutosHojeResult._sum.minutosAcumulados ?? 0;

  const streak = {
    atual: user.streakAtual,
    recorde: user.streakRecorde,
    escudosDisponiveis,
    metaDiariaMin,
    minutosHoje,
    metaCumprida: minutosHoje >= metaDiariaMin,
  };

  const nivelInfo = calcularNivel(user.xpTotal);

  const xp = {
    total: user.xpTotal,
    nivel: nivelInfo.nivel,
    titulo: nivelInfo.titulo,
    xpNoNivel: nivelInfo.xpNoNivel,
    xpParaProximoNivel: nivelInfo.xpParaProximo,
  };

  return {
    proximoBloco,
    revisoesHoje,
    streak,
    xp,
    estudandoAgora,
  };
}
