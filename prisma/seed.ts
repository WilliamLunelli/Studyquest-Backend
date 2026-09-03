/**
 * Seed do catálogo — Goal, GoalWeight, Area, Subject, Topic.
 *
 * Este script existe porque, no modelo novo, Area/Subject/Topic não são
 * mais criados pelo usuário — vêm de um catálogo global semeado aqui.
 * Sem rodar isso, GET /api/goals volta vazio e o onboarding trava
 * (ver CLAUDE.md e contexto-desenvolvimento.txt).
 *
 * HIERARQUIA (ver CLAUDE.md, seção "Hierarquia do catálogo"):
 *   Goal → GoalWeight → Area (peso) → Subject (dificuldade) → Topic
 *
 * COMO ADICIONAR UM OBJETIVO NOVO
 * --------------------------------
 * 1. Adicione uma entrada no array `catalog.goals` lá embaixo.
 * 2. Em `weights`, referencie áreas pelo `nome` — se a área já existe
 *    (ex.: "Ciências da Natureza" de outro ENEM), ela é reaproveitada;
 *    se não existe, é criada.
 * 3. Se o objetivo precisar de matérias/assuntos que ainda não existem,
 *    adicione entradas em `catalog.subjectsByArea`.
 * 4. Rode `npm run seed`. É idempotente: pode rodar quantas vezes quiser.
 *
 * POR QUE "PORTUGUÊS" APARECE DUAS VEZES
 * ---------------------------------------
 * Subject.areaId é uma FK obrigatória única (uma matéria pertence a
 * UMA área só — não existe relação N:N entre Subject e Area no schema
 * atual). Por isso "Português" em Linguagens (ENEM) e "Português" em
 * Conhecimentos Básicos (concurso) são duas linhas de Subject
 * diferentes, cada uma com seus próprios Topics — o conteúdo cobrado
 * é diferente na prática (ENEM pesa mais interpretação/literatura,
 * concurso pesa mais gramática normativa). Se um dia isso incomodar,
 * a solução correta é uma migration tornando Subject↔Area N:N — não
 * fizemos isso aqui de propósito, é uma decisão de schema maior.
 *
 * IDEMPOTÊNCIA
 * ------------
 * Area, Subject, Topic e Goal ainda não têm constraint @@unique em
 * `nome` (não adicionamos isso pra não mexer no schema fora do que
 * foi pedido), então não dá pra usar prisma.<model>.upsert() de
 * verdade neles. Em vez disso, usamos "find or create" manual
 * (findFirst por nome + pai, senão create). GoalWeight já tem
 * @@unique([goalId, areaId]) no schema, então esse usa upsert de
 * verdade.
 */

import "dotenv/config";
import prisma from "../src/config/database";
import { GoalType } from "../src/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Catálogo — dados
// ---------------------------------------------------------------------------

const catalog = {
  areas: [
    { nome: "Ciências da Natureza" },
    { nome: "Matemática" },
    { nome: "Linguagens" },
    { nome: "Ciências Humanas" },
    { nome: "Redação" },
    { nome: "Conhecimentos Básicos" },
    { nome: "Conhecimentos Específicos" },
  ],

  subjectsByArea: {
    "Ciências da Natureza": [
      {
        nome: "Biologia",
        topics: ["Citologia", "Genética", "Ecologia", "Evolução", "Fisiologia Humana"],
      },
      {
        nome: "Química",
        topics: ["Estequiometria", "Química Orgânica", "Ligações Químicas", "Termoquímica", "Eletroquímica"],
      },
      {
        nome: "Física",
        topics: ["Mecânica", "Termologia", "Eletromagnetismo", "Óptica", "Ondulatória"],
      },
    ],
    "Matemática": [
      {
        nome: "Matemática",
        topics: ["Funções", "Geometria Plana", "Geometria Espacial", "Estatística e Probabilidade", "Trigonometria"],
      },
    ],
    "Linguagens": [
      {
        nome: "Português",
        topics: ["Interpretação de Texto", "Gramática Normativa", "Literatura Brasileira", "Funções da Linguagem", "Coesão e Coerência"],
      },
      {
        nome: "Literatura",
        topics: ["Modernismo", "Romantismo", "Realismo", "Barroco", "Literatura Contemporânea"],
      },
      {
        nome: "Inglês",
        topics: ["Reading Comprehension", "Grammar", "Vocabulary", "False Cognates", "Text Interpretation"],
      },
    ],
    "Ciências Humanas": [
      {
        nome: "História",
        topics: ["História do Brasil Colônia", "Era Vargas", "Guerra Fria", "Revolução Industrial", "Brasil República"],
      },
      {
        nome: "Geografia",
        topics: ["Geopolítica", "Climatologia", "Urbanização", "Geografia Agrária", "Meio Ambiente"],
      },
      {
        nome: "Filosofia",
        topics: ["Filosofia Antiga", "Ética", "Filosofia Política", "Epistemologia", "Filosofia Contemporânea"],
      },
      {
        nome: "Sociologia",
        topics: ["Teorias Sociológicas Clássicas", "Cidadania e Direitos", "Movimentos Sociais", "Cultura e Identidade", "Desigualdade Social"],
      },
    ],
    "Redação": [
      {
        nome: "Redação",
        topics: ["Dissertação Argumentativa", "Proposta de Intervenção", "Coesão Textual", "Repertório Sociocultural", "Estrutura do Texto"],
      },
    ],
    "Conhecimentos Básicos": [
      {
        nome: "Português",
        topics: ["Ortografia e Acentuação", "Concordância Verbal e Nominal", "Crase", "Regência", "Interpretação de Texto"],
      },
      {
        nome: "Raciocínio Lógico",
        topics: ["Lógica Proposicional", "Conjuntos", "Sequências e Padrões", "Probabilidade", "Análise Combinatória"],
      },
      {
        nome: "Informática",
        topics: ["Sistemas Operacionais", "Pacote Office", "Redes de Computadores", "Segurança da Informação", "Internet e E-mail"],
      },
    ],
    "Conhecimentos Específicos": [
      {
        nome: "Direito Constitucional",
        topics: ["Controle de Constitucionalidade", "Direitos Fundamentais", "Organização do Estado", "Poder Judiciário", "Processo Legislativo"],
      },
      {
        nome: "Direito Administrativo",
        topics: ["Atos Administrativos", "Licitações e Contratos", "Poderes Administrativos", "Improbidade Administrativa", "Servidores Públicos"],
      },
      {
        nome: "Direito Processual Civil",
        topics: ["Petição Inicial", "Recursos", "Tutela Provisória", "Competência", "Execução"],
      },
    ],
  } as Record<string, { nome: string; topics: string[] }[]>,

  goals: [
    {
      type: GoalType.ENEM,
      nome: "Medicina · UFG",
      curso: "Medicina",
      universidade: "UFG",
      weights: {
        "Ciências da Natureza": 3,
        "Matemática": 2,
        "Linguagens": 2,
        "Ciências Humanas": 1,
        "Redação": 3,
      },
    },
    {
      type: GoalType.ENEM,
      nome: "Medicina · UFU",
      curso: "Medicina",
      universidade: "UFU",
      weights: {
        "Ciências da Natureza": 3,
        "Matemática": 2,
        "Linguagens": 2,
        "Ciências Humanas": 1,
        "Redação": 3,
      },
    },
    {
      // banca é placeholder — ajuste quando o edital real for definido
      type: GoalType.CONCURSO,
      nome: "Analista Judiciário · TRT",
      cargo: "Analista Judiciário",
      banca: "TRT",
      weights: {
        "Conhecimentos Básicos": 1,
        "Conhecimentos Específicos": 2,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers de "find or create" (idempotência sem @@unique em `nome`)
// ---------------------------------------------------------------------------

async function findOrCreateArea(nome: string) {
  const existing = await prisma.area.findFirst({ where: { nome } });
  if (existing) return existing;
  return prisma.area.create({ data: { nome } });
}

async function findOrCreateSubject(areaId: string, nome: string) {
  const existing = await prisma.subject.findFirst({ where: { areaId, nome } });
  if (existing) return existing;
  return prisma.subject.create({ data: { areaId, nome } });
}

async function findOrCreateTopic(subjectId: string, nome: string) {
  const existing = await prisma.topic.findFirst({ where: { subjectId, nome } });
  if (existing) return existing;
  return prisma.topic.create({ data: { subjectId, nome } });
}

async function findOrCreateGoal(data: {
  type: GoalType;
  nome: string;
  curso?: string;
  universidade?: string;
  cargo?: string;
  banca?: string;
}) {
  const existing = await prisma.goal.findFirst({ where: { nome: data.nome } });
  if (existing) {
    return prisma.goal.update({ where: { id: existing.id }, data });
  }
  return prisma.goal.create({ data });
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("Semeando catálogo...");

  // 1. Áreas (catálogo global, sem dono)
  const areaByName = new Map<string, { id: string }>();
  for (const area of catalog.areas) {
    const created = await findOrCreateArea(area.nome);
    areaByName.set(area.nome, created);
  }
  console.log(`  Áreas: ${areaByName.size}`);

  // 2. Matérias + Assuntos, por área
  let subjectCount = 0;
  let topicCount = 0;
  for (const [areaName, subjects] of Object.entries(catalog.subjectsByArea)) {
    const area = areaByName.get(areaName);
    if (!area) {
      throw new Error(
        `Area "${areaName}" referenciada em subjectsByArea mas não existe em catalog.areas`,
      );
    }

    for (const subject of subjects) {
      const createdSubject = await findOrCreateSubject(area.id, subject.nome);
      subjectCount++;

      for (const topicName of subject.topics) {
        await findOrCreateTopic(createdSubject.id, topicName);
        topicCount++;
      }
    }
  }
  console.log(`  Matérias: ${subjectCount}`);
  console.log(`  Assuntos: ${topicCount}`);

  // 3. Objetivos + pesos
  let goalCount = 0;
  let weightCount = 0;
  for (const goalData of catalog.goals) {
    const { weights, ...goalFields } = goalData;
    const goal = await findOrCreateGoal(goalFields);
    goalCount++;

    for (const [areaName, peso] of Object.entries(weights)) {
      const area = areaByName.get(areaName);
      if (!area) {
        throw new Error(
          `Area "${areaName}" referenciada nos pesos de "${goalData.nome}" mas não existe em catalog.areas`,
        );
      }

      await prisma.goalWeight.upsert({
        where: { goalId_areaId: { goalId: goal.id, areaId: area.id } },
        update: { peso },
        create: { goalId: goal.id, areaId: area.id, peso },
      });
      weightCount++;
    }
  }
  console.log(`  Objetivos: ${goalCount}`);
  console.log(`  Pesos (GoalWeight): ${weightCount}`);

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error("Erro ao rodar o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
