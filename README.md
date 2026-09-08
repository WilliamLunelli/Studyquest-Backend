# 📚 StudyQuest — Backend

> Planejador de rotina de estudos para estudantes brasileiros.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

> Este repositório contém a **API do StudyQuest**. O frontend fica em repositório separado.

## 📖 Sobre o Projeto

O StudyQuest é um planejador de rotina de estudos para quem se prepara para o ENEM, vestibulares e concursos públicos.

Diferente de um diário de estudos, o sistema **decide o que o estudante deve estudar**: ele monta um ciclo com base no peso das áreas de conhecimento no objetivo escolhido, cronometra a sessão no servidor e agenda automaticamente a revisão do assunto antes que ele seja esquecido.

O produto não fornece conteúdo — não há aulas nem banco de questões próprio. Ele organiza a rotina, e o estudante usa o material que já tem.

**O problema que resolve:** quem estuda por conta própria não sabe o que priorizar (os pesos do edital estão enterrados em PDFs de dezenas de páginas), não consegue gerenciar revisão espaçada manualmente, e abandona cronogramas rígidos no primeiro dia perdido.

### 🎯 Principais Funcionalidades

- **🎯 Objetivo com pesos reais**: o estudante escolhe curso e instituição, e o sistema carrega os pesos de cada área de conhecimento
- **🔄 Ciclo de estudos ponderado**: geração automática a partir do peso da área, da dificuldade autoavaliada e do tempo disponível
- **♻️ Ciclo rotativo**: sem datas fixas — atrasar um dia não gera pendência nem quebra o planejamento
- **⏱️ Sessão cronometrada no servidor**: o tempo é apurado por timestamps, nunca informado pelo cliente
- **🧠 Revisão espaçada automática**: intervalos de 1, 3, 7, 15, 30 e 60 dias, ajustados pela autoavaliação e antecipados quando o desempenho real contradiz a percepção
- **📝 Roteiro de recuperação ativa**: orienta a puxar da memória antes de reabrir o material
- **⚡ Gamificação com decaimento**: XP por minuto que decresce ao longo do dia, com teto diário, desestimulando maratonas improdutivas
- **🛡️ Streak com escudos**: dois escudos mensais que preservam a sequência, porque o dia seguinte à quebra é o momento de maior abandono
- **📊 Painel de desalinhamento**: mostra onde o tempo dedicado destoa do peso da matéria no objetivo
- **🔍 Detecção de excesso de confiança**: cruza autoavaliação com acerto real por assunto

## 👥 Equipe

| Nome                                | Matrícula | Função                            |
| ----------------------------------- | --------- | --------------------------------- |
| William Pereira Lunelli             | 2410735   | Tech Lead / Desenvolvedor Backend |
| Ana Gabrielle de Albuquerque Santos | 2410613   | Desenvolvedora Frontend           |
| Guilherme Sousa Barbosa             | 2410167   | Desenvolvedor Full Stack          |
| André Mendes Carvalho               | 2411585   | Desenvolvedor Backend             |

## 🚀 Tecnologias

- **Node.js** — runtime JavaScript
- **Express** — framework web minimalista
- **TypeScript** — superset tipado do JavaScript
- **PostgreSQL** — banco de dados relacional
- **Prisma** — ORM com tipagem gerada a partir do schema
- **JWT** — autenticação stateless
- **Bcrypt** — hash de senhas
- **Zod** — validação de schemas
- **Swagger / OpenAPI 3.0** — documentação interativa da API

### Ferramentas

- **Insomnia** — coleções versionadas para teste dos endpoints
- **StarUML** — diagramas técnicos
- **Figma** — prototipação de telas
- **GitHub** — versionamento e revisão por pull request

## 🏗️ Arquitetura

O fluxo de execução é único e obrigatório:

```
Requisição → Rota → Middleware → Controller → Service → Repository → Prisma → Banco
```

| Camada         | Responsabilidade                                         |
| -------------- | -------------------------------------------------------- |
| **Rota**       | Caminho HTTP, middlewares e anotações OpenAPI            |
| **Middleware** | Autenticação JWT e validação de entrada com Zod          |
| **Controller** | Recebe requisição, delega ao service, formata a resposta |
| **Service**    | Lógica de negócio, cálculos e orquestração               |
| **Repository** | Único ponto de acesso ao Prisma                          |

**O Prisma nunca é acessado fora do repository.** Essa é a principal decisão estrutural do projeto: mantém a lógica de negócio independente da persistência e permite testar as regras sem banco.

## 📁 Estrutura do Projeto

```bash
studyquest-backend/
├── src/
│   ├── config/               # Conexão com banco e configuração do Swagger
│   ├── controllers/          # Recebem requisição e delegam ao service
│   ├── middlewares/          # Autenticação e validação
│   ├── repositories/         # Único ponto de acesso ao Prisma
│   ├── routes/               # Rotas Express e anotações OpenAPI
│   ├── services/             # Regras de negócio
│   ├── types/                # Tipagens compartilhadas
│   ├── utils/                # Funções puras de cálculo
│   ├── validations/          # Schemas Zod
│   └── index.ts              # Ponto de entrada
├── prisma/
│   ├── schema.prisma         # Modelo de dados
│   ├── migrations/           # Histórico de migrações
│   └── seed.ts               # Catálogo de objetivos, áreas, matérias e assuntos
├── scripts/                  # Testes automatizados
├── insomnia/                 # Coleções de requisições
└── README.md
```

## 📊 Modelo de Dados

17 entidades, organizadas em quatro grupos.

**Catálogo** — dados de referência comuns a todos os usuários, populados pelo seed:

- **Goal** — objetivo de estudo (curso e instituição, ou cargo e banca)
- **Area** — área de conhecimento, onde ficam os pesos
- **GoalWeight** — peso de cada área dentro de um objetivo
- **Subject** — matéria pertencente a uma área
- **Topic** — assunto pertencente a uma matéria

**Usuário e configuração:**

- **User** — conta, objetivo ativo, XP, nível e sequência
- **UserAvailability** — minutos disponíveis por dia da semana
- **UserDifficulty** — autoavaliação de dificuldade por matéria

**Execução do estudo:**

- **StudyCycle** — ciclo ativo, com ponteiro de posição e contagem de voltas
- **CycleBlock** — bloco do ciclo: matéria, assunto, duração e ordem
- **StudySession** — sessão cronometrada, com timestamps e autoavaliação
- **ReviewSchedule** — revisão agendada
- **QuestionLog** — questões resolvidas e acertadas por assunto

**Progresso e gamificação:**

- **CompletedTopic** — assunto dominado, permanente
- **ImprovedTopic** — controle de concessão única do bônus de melhoria
- **XpEvent** — histórico auditável de cada concessão de XP
- **StreakShield** — escudos mensais disponíveis e consumidos
- **Badge / UserBadge** — conquistas (planejado)

> **Bloco ≠ assunto.** `CycleBlock` é fatia de tempo e reinicia a cada volta do ciclo. `CompletedTopic` é domínio de conteúdo e é permanente.

## 🔌 Endpoints

24 endpoints em nove módulos. Documentação completa em `/api/docs`.

**Autenticação** — `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`

**Onboarding** — `GET /api/goals` · `GET /api/goals/:id/weights` · `PUT /api/me/goal` · `PUT /api/me/availability` · `PUT /api/me/difficulties`

**Ciclo** — `POST /api/cycles/generate` · `GET /api/cycles/current` · `PATCH /api/cycles/blocks/:id` · `POST /api/cycles/blocks/:id/complete` · `GET /api/cycles/alignment`

**Sessões** — `POST /api/sessions` · `GET /api/sessions/active` · `PATCH /api/sessions/:id/pause` · `PATCH /api/sessions/:id/resume` · `POST /api/sessions/:id/finish`

**Questões** — `POST /api/question-logs` · `GET /api/question-logs`

**Revisão** — `GET /api/reviews/today` · `GET /api/reviews/:id` · `GET /api/reviews/upcoming`

**Agregadores** — `GET /api/home` · `GET /api/dashboard`

## 🚦 Como Rodar

### Pré-requisitos

- **Node.js** `>= 22.0.0` (declarado em `engines` no `package.json`)
- **PostgreSQL** — a versão não está fixada em lugar nenhum do repositório (sem `docker-compose.yml`, sem workflow de CI).
- **npm** — o projeto usa `package-lock.json`

### Instalação

```bash
git clone https://github.com/WilliamLunelli/Studyquest-Backend.git
cd Studyquest-Backend
npm install

cp .env.example .env
# edite o .env com os valores reais, principalmente DATABASE_URL

npx prisma migrate dev   # aplica as migrations existentes e gera o Prisma Client
npm run seed             # popula o catálogo — sem isso GET /api/goals volta vazio e o onboarding trava

npm run dev
```

> O Prisma Client é gerado em `src/generated/prisma`, caminho customizado no `schema.prisma` e listado no `.gitignore`. Por isso `npx prisma migrate dev` (que gera o client como parte do próprio comando) é obrigatório logo após o clone — sem ele o projeto não compila.

### Variáveis de Ambiente

| Variável         | Obrigatória                            | Lida em                  | Descrição                                                                       |
| ---------------- | --------------------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Sim                                     | `prisma/schema.prisma`   | String de conexão do PostgreSQL                                                |
| `PORT`           | Sim                                     | `src/index.ts`           | Porta do servidor — sem valor, `Number(PORT)` vira `NaN` e o servidor não sobe |
| `JWT_SECRET`     | Sim                                     | `src/utils/jwt.ts`       | Chave de assinatura do token                                                    |
| `JWT_EXPIRES_IN` | Não (default `7d`)                     | `src/utils/jwt.ts`       | Validade do token                                                               |
| `CORS_ORIGIN`    | Não (default `http://localhost:3000`) | `src/index.ts`           | Origem liberada no CORS, com `credentials: true`                               |
| `NODE_ENV`       | Não                                     | `src/config/database.ts` | Quando diferente de `production`, ativa log de query do Prisma                 |

### Scripts Disponíveis

Do `package.json`:

| Comando         | O que faz                                                    |
| --------------- | -------------------------------------------------------------- |
| `npm run dev`   | `tsx watch src/index.ts` — sobe o servidor com hot reload      |
| `npm run build` | `tsc` — compila para `dist/`                                   |
| `npm run start` | `node dist/index.js` — roda o build de produção                |
| `npm run seed`  | `prisma db seed` — popula o catálogo (Goal/Area/Subject/Topic) |

Os testes automatizados (ver seção Testes) não têm script no `package.json` — cada arquivo em `scripts/` roda direto via `tsx`:

```bash
# Gamificação
npx tsx scripts/gamification/test-pure.ts
npx tsx scripts/gamification/test-integration.ts

# Ciclo de estudos
npx tsx scripts/cycle/test-pure.ts
npx tsx scripts/cycle/test-integration.ts

# Dashboard
npx tsx scripts/dashboard/test-pure.ts
npx tsx scripts/dashboard/test-integration.ts
```

Os `test-pure.ts` não tocam banco. Os `test-integration.ts` precisam de `DATABASE_URL` configurado e do PostgreSQL rodando.

### Testando com o Insomnia

As coleções ficam em `insomnia/`, uma por módulo:

- `studyquest-modulo1.json` — Conta e Onboarding: register → login → me → goals → goals/:id/weights → me/goal → me/availability → me/difficulties
- `studyquest-modulo4.json` — Timer / Pomodoro: criar sessão → active → pause → resume, incluindo casos de conflito entre usuários (403)
- `studyquest-dashboard.json` — Dashboard: onboarding completo → geração do ciclo → sessão → question-logs → dashboard nos três períodos

Para importar: no Insomnia, **Application → Import/Export → Import Data → From File**, e selecione o `.json` desejado. Cada arquivo cria seu próprio workspace com um "Base Environment" (`base_url`, `token` e outras variáveis) e uma sequência de requisições — rode-as na ordem em que aparecem na coleção, porque cada requisição alimenta variáveis usadas pelas seguintes (token, IDs de goal/subject etc.).

## ⚙️ Regras de Negócio

**XP com decaimento diário**

| Tempo acumulado no dia | XP por minuto |
| ---------------------- | ------------- |
| 0 a 120 min            | 1,0           |
| 121 a 240 min          | 0,7           |
| 241 a 360 min          | 0,4           |
| Acima de 360 min       | 0             |

Teto de 252 XP/dia. Revisão concluída na data agendada recebe multiplicador 2×.

**Bônus:** registro de questões +15 (uma vez por assunto por dia) · assunto dominado +200 · melhoria de <50% para >70% de acerto +300.

**Níveis:** `XP(n → n+1) = 100 + 50n`. Progressão contínua, sem teto. O nível nunca regride.

**Geração do ciclo:** `score(matéria) = peso(área) × (1 + (dificuldade − 3) × 0,15)`. A dificuldade ajusta em até ±30%, mas nunca inverte a ordem dos pesos.

**Revisão espaçada:** primeira revisão em 1, 3 ou 7 dias conforme autoavaliação. Seguintes em 7 → 15 → 30 → 60 dias. Revisão atrasada não avança o intervalo. Acerto abaixo de 50% no assunto antecipa a revisão para o dia seguinte.

**Streak:** meta diária derivada da disponibilidade, com 2 escudos por mês. Avaliação retroativa, sem cron job.

## ✅ Testes

154 testes automatizados, separados por natureza:

| Suíte            | Testes | Banco |
| ---------------- | ------ | ----- |
| Gamificação      | 64     | Ambos |
| Ciclo de estudos | 31     | Ambos |
| Dashboard        | 59     | Ambos |

Os testes puros verificam as regras de cálculo sem tocar o banco. Os de integração operam sobre PostgreSQL real, com criação e limpeza de dados isolados a cada execução.

## 🛣️ Roadmap

### ✅ Concluído

- [x] Autenticação com JWT e configuração inicial do usuário
- [x] Catálogo de objetivos, áreas, matérias e assuntos
- [x] Geração e manutenção do ciclo de estudos ponderado
- [x] Sessões cronometradas com pausa, retomada e recuperação
- [x] Revisão espaçada com roteiro de recuperação ativa
- [x] Registro de questões resolvidas
- [x] XP com decaimento, níveis e streak com escudos
- [x] Painel de estatísticas e insights
- [x] Documentação OpenAPI e cobertura de testes

### 🔄 Em andamento

- [ ] Integração entre frontend e backend
- [ ] Telas de onboarding, sessão e revisão

### 📅 Planejado

- [ ] Sistema de conquistas
- [ ] Histórico completo de sessões
- [ ] Edição de perfil
- [ ] Integração com banco de questões externo
- [ ] Grupos privados com ranking semanal
- [ ] Geração de flashcards a partir do material do estudante

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feat/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feat/minha-feature`)
5. Abra um Pull Request

### Padrão de Commits

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige um bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

## 📝 Licença

Projeto acadêmico desenvolvido como parte do Projeto Integrador do curso de Engenharia de Software da UniEVANGÉLICA.

## 📞 Contato

- **William Lunelli** — [LinkedIn](https://linkedin.com/in/william-lunelli-6b1448300) · [Instagram](https://www.instagram.com/william_lunelli/) · williamlunelli07@gmail.com

---

**StudyQuest** — o app que decide o que você estuda hoje 📚
