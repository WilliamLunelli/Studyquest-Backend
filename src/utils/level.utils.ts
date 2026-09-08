/**
 * Progressão de nível: XP para subir do nível n para n+1 = 100 + 50n.
 * xpAcumuladoParaNivel(n) é a soma fechada dessa PA de n=1 até nivel-1:
 *   T(m) = soma_{k=1..m} (100 + 50k) = 25*m^2 + 125*m,  onde m = nivel - 1
 * Isso evita o loop nivel-a-nivel: dado um total de XP, dá pra resolver
 * a equação quadrática (25m^2 + 125m <= xp) direto por Bhaskara.
 */

// Faixas não são uniformes de propósito: a primeira vai só até o nível 9
// (1-9), as demais cobrem 10 níveis cada. "ate: undefined" na última
// significa "sem teto" — nível 60 pra cima nunca fica sem título.
const FAIXAS_TITULO: { ate?: number; titulo: string }[] = [
  { ate: 9, titulo: "Iniciante" },
  { ate: 19, titulo: "Estudante" },
  { ate: 29, titulo: "Dedicado" },
  { ate: 39, titulo: "Veterano" },
  { ate: 49, titulo: "Persistente" },
  { ate: 59, titulo: "Mestre" },
  { titulo: "Lenda" },
];

export function xpAcumuladoParaNivel(nivel: number): number {
  const m = Math.max(0, nivel - 1);
  return 25 * m * m + 125 * m;
}

export function calcularNivel(xpTotal: number): {
  nivel: number;
  titulo: string;
  xpNoNivel: number;
  xpParaProximo: number;
} {
  const xp = Math.max(0, xpTotal);
  const m = maiorMComXpSuficiente(xp);
  const nivel = m + 1;

  const xpAcumuladoNivelAtual = xpAcumuladoParaNivel(nivel);
  const xpAcumuladoProximoNivel = xpAcumuladoParaNivel(nivel + 1);

  return {
    nivel,
    titulo: tituloPorNivel(nivel),
    xpNoNivel: xp - xpAcumuladoNivelAtual,
    xpParaProximo: xpAcumuladoProximoNivel - xp,
  };
}

function tituloPorNivel(nivel: number): string {
  const faixa = FAIXAS_TITULO.find((f) => f.ate === undefined || nivel <= f.ate);
  return faixa?.titulo ?? FAIXAS_TITULO[FAIXAS_TITULO.length - 1]!.titulo;
}

/**
 * Maior m (m = nivel - 1) tal que 25m^2 + 125m <= xp, resolvido via
 * Bhaskara e não por iteração. O floor() do resultado real pode errar
 * por 1 em bordas de ponto flutuante (xp exatamente igual a um limiar,
 * como 3150), então o resultado é corrigido com uma checagem direta
 * de no máximo 2 comparações — não é um loop sobre os níveis.
 */
function maiorMComXpSuficiente(xp: number): number {
  const mReal = (-125 + Math.sqrt(125 * 125 + 100 * xp)) / 50;
  let m = Math.max(0, Math.floor(mReal));

  while (xpAcumuladoParaNivel(m + 2) <= xp) {
    m += 1;
  }

  while (m > 0 && xpAcumuladoParaNivel(m + 1) > xp) {
    m -= 1;
  }

  return m;
}
