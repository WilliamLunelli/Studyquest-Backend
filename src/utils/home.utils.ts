export function getXpProgress(totalXp: number, nivel: number) {
  let xpConsumido = 0;

  for (let level = 1; level < nivel; level++) {
    xpConsumido += 100 + 50 * level;
  }

  return {
    xpNoNivel: totalXp - xpConsumido,
    xpParaProximoNivel: 100 + 50 * nivel,
  };
}

export function getLevelTitle(nivel: number) {
  if (nivel >= 30) return "Mestre";
  if (nivel >= 20) return "Estrategista";
  if (nivel >= 10) return "Veterano";

  return "Aprendiz";
}
