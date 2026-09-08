-- AlterTable: troca o campo "usado" (Boolean, 1 escudo/mes) por um
-- contador "usados" (0-2), que agora representa quantos dos 2 escudos
-- mensais ja foram consumidos naquela linha (userId, mes, ano).
ALTER TABLE "streak_shields" ADD COLUMN "usados" INTEGER NOT NULL DEFAULT 0;

-- Preserva o estado das linhas existentes: quem tinha usado = true vira usados = 1.
UPDATE "streak_shields" SET "usados" = 1 WHERE "usado" = true;

ALTER TABLE "streak_shields" DROP COLUMN "usado";
