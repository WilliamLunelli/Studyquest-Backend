# Instruções Persistentes para Claude Code

## Perfil do Desenvolvedor

- Sou um desenvolvedor **iniciante** ou em aprendizado
- Preciso de explicações claras, simples e didáticas
- Prefiro aprender fazendo, não apenas receber respostas prontas

---

## Regras de Comportamento

### Ao identificar bugs ou erros

- Explique o erro como se eu nunca tivesse visto aquele tipo de problema antes
- Descreva **o que causou** o erro em linguagem simples, sem jargões técnicos
- Se usar um termo técnico, explique o que ele significa logo em seguida
- Mostre onde está o problema no código antes de sugerir qualquer solução

### Ao responder perguntas do tipo "Como faço X?"

- **NÃO me dê a resposta direta** — me dê um exemplo equivalente para eu estudar
- O exemplo deve ser simples, pequeno e focado apenas no conceito perguntado
- Após o exemplo, me pergunte se consegui entender e aplicar por conta própria
- Só forneça a solução completa se eu pedir explicitamente

### Ao explicar conceitos

- Use analogias do dia a dia sempre que possível
- Prefira exemplos concretos a explicações abstratas
- Divida explicações longas em passos numerados

---

## Tom e Comunicação

- Seja paciente e encorajador
- Nunca assuma que eu já sei algo — sempre explique o contexto
- Se eu errar, corrija com gentileza e explique o porquê

---

## Exceções

- Se eu disser **"me dá a resposta"** ou **"pode resolver"**, pode fornecer a solução completa
- Se o erro for crítico e bloquear tudo, avise antes de explicar

---

## Git

- Nunca adicione atribuição, assinatura ou co-autoria do Claude nas mensagens de commit
- Não inclua rodapé "Generated with", "Co-Authored-By: Claude", emoji de robô ou similar
- Mensagens de commit contêm apenas a descrição técnica da mudança

---

# StudyQuest — Documentação Técnica

## O que é o produto

Planejador de rotina de estudos para quem se prepara para **ENEM/vestibular** e **concurso público**.

O sistema monta um **ciclo de estudos** com base no peso das áreas no objetivo do usuário, **cronometra** as sessões e **agenda revisões espaçadas** automaticamente.

O produto **não fornece conteúdo** (aulas, questões próprias). Ele organiza a rotina.

## Stack

- **Runtime**: Node.js + Express + TypeScript
- **Banco**: PostgreSQL via Prisma ORM
- **Auth**: JWT (Bearer Token) — middleware `authMiddleware`
- **Validação**: Zod
- **Documentação API**: Swagger (OpenAPI 3.0) em `/api/docs`
- **Repositório**: backend separado do frontend

## Estrutura de Pastas

```text
src/
├── config/         # database.ts, swagger.ts
├── controllers/    # Recebe req/res, delega ao service
├── middlewares/    # authMiddleware, validateBody
├── repositories/   # Acesso ao Prisma (único ponto de contato com o banco)
├── routes/         # Rotas Express + anotações OpenAPI
├── services/       # Lógica de negócio
├── types/          # express.d.ts (req.userId), *.types.ts
├── utils/          # Funções auxiliares (xp.utils.ts, cycle.utils.ts, review.utils.ts)
├── validations/    # Schemas Zod
├── prisma/
│   ├── schema.prisma
│   └── seed.ts     # Catálogo: objetivos, matérias, assuntos, pesos
└── index.ts        # Entry point do servidor
```

## Fluxo Obrigatório de Arquitetura

```text
Request → Route → Middleware → Controller → Service → Repository → Prisma
```

- **Controller**: Recebe req/res, valida entrada com Zod, chama service, retorna JSON
- **Service**: Lógica de negócio (validações de domínio, cálculos, orquestração)
- **Repository**: Único ponto de acesso ao Prisma. **Nunca** usar Prisma diretamente em controller ou service.

## Convenções de Nomenclatura

- Arquivos: `nome.tipo.ts` — ex: `cycle.repository.ts`, `cycle.service.ts`
- Repositórios: `export const xyzRepository = { ... }` (objeto com métodos)
- Services: `export async function xyzAction(...)` (funções nomeadas)
- Controllers: `export const xyzController = { ... }` (objeto com métodos)
- **Idioma**: código, tabelas, colunas e rotas em **inglês**. Mensagens ao usuário em **português**.

## Tratamento de Erros HTTP

| Código | Uso                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------- |
| 400    | Input malformado (JSON inválido, tipo errado, campo ausente)                                    |
| 401    | Token não fornecido ou inválido                                                                 |
| 403    | Usuário autenticado, mas sem permissão                                                          |
| 404    | Recurso não encontrado                                                                          |
| 409    | Conflito de estado (sessão já ativa, onboarding incompleto, ciclo inexistente)                  |
| 422    | Input bem formado mas semanticamente inválido (`acertadas > feitas`, minutos fora do intervalo) |
| 500    | Erro interno — nunca expor detalhes ao cliente                                                  |

---

# Regras de Domínio Invioláveis

Estas regras são a razão de existir do produto. Qualquer código que as viole está errado, mesmo que funcione.

### 1. O tempo é do servidor, nunca do cliente

O frontend **nunca** envia duração de sessão. O servidor calcula por diferença de timestamps (`startedAt`, `resumedAt`, `minutosAcumulados`).

Se o cliente pudesse informar o tempo, o XP viraria autodeclarado e perderia todo o sentido.

### 2. XP só vem de sessão cronometrada

Tempo digitado manualmente **não** gera XP. Nunca criar endpoint que conceda XP a partir de duração informada pelo usuário.

### 3. O ciclo é rotativo, não datado

O próximo bloco vem do ponteiro `posicaoAtual`, que avança a cada sessão concluída e volta a zero ao fim do ciclo.

Nunca associar bloco a uma data fixa. Atrasar um dia não pode gerar pendência nem "quebrar" o ciclo — é justamente isso que faz o usuário abandonar cronogramas tradicionais.

### 4. `finish` é uma transação única

`POST /api/sessions/:id/finish` executa em uma só transação Prisma:

1. Fecha a sessão e calcula os minutos totais
2. Calcula XP (com decaimento e multiplicador)
3. Atualiza `xpTotal` e recalcula o nível
4. Atualiza streak e meta diária
5. Agenda a próxima revisão
6. Marca a revisão de origem como concluída, se houver
7. Avança o ponteiro do ciclo

Falha em qualquer etapa faz **rollback completo**. Nunca gravar pela metade.

### 5. Dado objetivo vence autoavaliação

Se o usuário marcou "tranquilo" mas o `QuestionLog` do assunto mostra acerto abaixo de 50%, a revisão é antecipada. Percepção não sobrepõe resultado.

### 6. Registrar questões dá XP independente do acerto

O bônus de +15 XP é pelo ato de registrar. Premiar acerto faria o usuário evitar matéria difícil ou inflar o número.

### 7. Nunca premiar a ausência de um dado

Regra geral de gamificação: se a única forma de o usuário "ganhar" é deixar de informar algo, a regra está errada.

---

# Modelos do Banco (Prisma)

## Hierarquia do catálogo

```text
Goal → GoalWeight → Area (peso) → Subject (dificuldade) → Topic
```

O peso do objetivo fica na **Area** (ENEM: Ciências da Natureza, Linguagens, Humanas, Matemática, Redação; concurso: blocos do edital — Conhecimentos Básicos, Conhecimentos Específicos). A dificuldade autoavaliada fica na **Subject**.

| Modelo             | Tabela                | Descrição                                                                        |
| ------------------ | --------------------- | --------------------------------------------------------------------------------- |
| `User`             | `users`               | Conta, XP, nível, streak, recorde                                                |
| `Goal`             | `goals`               | Objetivo: ENEM (curso + universidade) ou concurso (cargo + banca)                |
| `GoalWeight`       | `goal_weights`        | Peso de cada área dentro de um objetivo                                          |
| `Area`             | `areas`               | Área do catálogo (Ciências da Natureza, Conhecimentos Básicos…), carrega o peso via `GoalWeight` |
| `Subject`          | `subjects`            | Matéria do catálogo, pertence a uma `Area` (Biologia, Direito Constitucional…)   |
| `Topic`            | `topics`              | Assunto dentro da matéria (Citologia, Controle de Constitucionalidade…)          |
| `UserDifficulty`   | `user_difficulties`   | Autoavaliação 1–5 do usuário por matéria                                |
| `UserAvailability` | `user_availabilities` | Minutos disponíveis por dia da semana                                   |
| `StudyCycle`       | `study_cycles`        | Ciclo ativo do usuário, com `posicaoAtual`                              |
| `CycleBlock`       | `cycle_blocks`        | Bloco do ciclo: matéria, assunto, duração, ordem, status                |
| `StudySession`     | `study_sessions`      | Sessão cronometrada: tipo, preset, timestamps, autoavaliação            |
| `ReviewSchedule`   | `review_schedules`    | Revisão agendada: assunto, data, repetição, status                      |
| `QuestionLog`      | `question_logs`       | Registro manual de questões feitas/acertadas por assunto                |
| `XpEvent`          | `xp_events`           | Histórico auditável de cada concessão de XP                             |
| `StreakShield`     | `streak_shields`      | Escudos mensais (2 por mês) que absorvem falha no streak                |

### Enums

```prisma
enum SessionType   { TEORIA, QUESTOES, REVISAO }
enum SessionStatus { RUNNING, PAUSED, FINISHED, ABANDONED }
enum SessionPreset { P25_5, P50_10, LIVRE }
enum SelfRating    { TRAVEI, OK, TRANQUILO }
enum GoalType      { ENEM, CONCURSO }
enum BlockStatus   { PENDENTE, CONCLUIDO }
enum ReviewStatus  { PENDENTE, CONCLUIDA, ARQUIVADA }
```

### Índices necessários

- `StudySession(userId, status)` — usado pelo contador "estudando agora"
- `StudySession(userId, startedAt)` — agregações do dashboard
- `ReviewSchedule(userId, agendadaPara, status)` — revisões do dia
- `QuestionLog(userId, topicId, data)` — acerto por assunto
- `CycleBlock(cycleId, ordem)` — ponteiro do ciclo

## Dívida conhecida — Subject duplicado entre áreas

Subject.areaId é FK obrigatória e não há relação N:N, então matérias
que aparecem em mais de uma área (ex: Português em "Linguagens" do
ENEM e em "Conhecimentos Básicos" de concurso) existem como linhas
distintas, com Topics próprios.

Consequência: o histórico do usuário (sessões, revisões, acerto por
assunto) não é compartilhado entre os dois. Trocar de objetivo perde
o progresso naquela matéria.

Aceito para o MVP: trocar de objetivo já invalida o ciclo, e o caso
de uso é raro. Se virar problema, a correção é uma tabela
intermediária AreaSubject (N:N), com migração dos dados existentes.

---

# Endpoints

Todas as rotas exigem `Authorization: Bearer <token>`, exceto `register` e `login`.

### Autenticação e conta

| Método | Rota                 | Descrição           |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Cadastro            |
| POST   | `/api/auth/login`    | Login, emite JWT    |
| GET    | `/api/auth/me`       | Usuário autenticado |

### Onboarding

| Método | Rota                     | Descrição                                             |
| ------ | ------------------------ | ----------------------------------------------------- |
| GET    | `/api/goals`             | Catálogo de objetivos (filtro `?tipo=enem\|concurso`) |
| GET    | `/api/goals/:id/weights` | Pesos das áreas do objetivo                            |
| PUT    | `/api/me/goal`           | Define objetivo do usuário                            |
| PUT    | `/api/me/availability`   | Horas disponíveis por dia da semana                   |
| PUT    | `/api/me/difficulties`   | Autoavaliação 1–5 por matéria                         |

### Ciclo de estudos

| Método | Rota                              | Descrição                                |
| ------ | --------------------------------- | ---------------------------------------- |
| POST   | `/api/cycles/generate`            | Gera ou regenera o ciclo                 |
| GET    | `/api/cycles/current`             | Ciclo ativo com blocos                   |
| PATCH  | `/api/cycles/blocks/:id`          | Edita duração, matéria, assunto ou ordem |
| POST   | `/api/cycles/blocks/:id/complete` | Marca assunto como concluído             |
| GET    | `/api/cycles/alignment`           | Peso ideal vs. horas reais               |

### Sessão

| Método | Rota                       | Descrição                                        |
| ------ | -------------------------- | ------------------------------------------------ |
| POST   | `/api/sessions`            | Inicia sessão                                    |
| GET    | `/api/sessions/active`     | Sessão em andamento (permite retomar após queda) |
| PATCH  | `/api/sessions/:id/pause`  | Pausa                                            |
| PATCH  | `/api/sessions/:id/resume` | Retoma                                           |
| POST   | `/api/sessions/:id/finish` | Encerra — transação da regra 4                   |

### Questões

| Método | Rota                 | Descrição                          |
| ------ | -------------------- | ---------------------------------- |
| POST   | `/api/question-logs` | Registra questões feitas/acertadas |
| GET    | `/api/question-logs` | Histórico com filtros e paginação  |

### Revisão

| Método | Rota                    | Descrição                                |
| ------ | ----------------------- | ---------------------------------------- |
| GET    | `/api/reviews/today`    | Pendentes de hoje + atrasadas            |
| GET    | `/api/reviews/:id`      | Detalhe com roteiro de recuperação ativa |
| GET    | `/api/reviews/upcoming` | Próximas agendadas (`?dias=7`)           |

O agendamento não tem endpoint próprio — acontece dentro do `finish`.

### Agregadores

| Método | Rota             | Descrição                                         |
| ------ | ---------------- | ------------------------------------------------- |
| GET    | `/api/home`      | Payload completo da tela inicial                  |
| GET    | `/api/dashboard` | Estatísticas e insights (`?periodo=7d\|30d\|90d`) |

---

# Fórmulas

### XP por minuto (decaimento sobre o acumulado do dia)

| Faixa acumulada no dia | XP/min |
| ---------------------- | ------ |
| 0–120 min              | 1,0    |
| 121–240 min            | 0,7    |
| 241–360 min            | 0,4    |
| acima de 360 min       | 0      |

Teto de ~230 XP/dia. Sessão que atravessa faixas é fatiada proporcionalmente.
Revisão concluída no dia agendado: **multiplicador 2×**.

### Bônus fixos

| Evento                                      | XP                           |
| ------------------------------------------- | ---------------------------- |
| Registro de questões                        | +15 (1× por assunto por dia) |
| Assunto do ciclo concluído                  | +200                         |
| Assunto que sai de <50% para >70% de acerto | +300                         |

### Nível

```
XP para subir do nível n para n+1 = 100 + 50n
```

Progressão contínua, sem teto. Nível nunca regride. Título muda a cada 10 níveis.

### Geração do ciclo

```text
score(subject) = peso(area) × (1 + (dificuldade(subject) - 3) × 0,15)
```

`peso(area)` vem do `GoalWeight` da `Area` à qual a `Subject` pertence. `dificuldade(subject)` vem do `UserDifficulty` do usuário para aquela `Subject`.

Normalizar os scores para somar 1, distribuir os minutos semanais disponíveis proporcionalmente, fatiar em blocos de 25 a 60 minutos e intercalar para não repetir matéria em sequência.

A dificuldade ajusta em até ±30%, mas **nunca inverte** a ordem definida pelo peso do objetivo.

### Revisão espaçada

Primeira revisão, pela autoavaliação: `TRAVEI` → 1d · `OK` → 3d · `TRANQUILO` → 7d

Seguintes, quando concluídas no prazo: `7 → 15 → 30 → 60` dias

- Concluída atrasada: intervalo **não avança**
- Autoavaliação `TRAVEI` na revisão: intervalo **regride um passo**
- `QuestionLog` com acerto <50%: antecipa para o dia seguinte
- Atraso superior a 30 dias: revisão arquivada, assunto volta ao ciclo como conteúdo novo

### Streak

- Incrementa ao cumprir a meta diária de minutos (derivada da disponibilidade)
- 2 escudos por mês, renovados no dia 1
- Falha com escudo disponível: consome automaticamente, streak preservado
- Falha sem escudo: streak zera, recorde é preservado

---

# Migração da estrutura anterior

O backend anterior tinha `Area`, `Badge`, `UserBadge` e `/api/registros`. Situação atual:

| Item antigo                      | Destino                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Area`                           | **Mantida**, mas deixa de ser criada pelo usuário. Vira **catálogo global** e passa a carregar o peso do objetivo via `GoalWeight` (entre `Goal` e `Subject`) |
| `Subject` (por usuário)          | Vira **catálogo global**, filho de `Area`; ligado ao `Goal` indiretamente através dela                             |
| `StudySession` (registro manual) | Vira **sessão cronometrada** com timestamps de servidor                                     |
| `Badge` / `UserBadge`            | **Fase 2.** Manter as tabelas, não desenvolver endpoints agora                              |
| `POST /api/registros`            | Substituído por `POST /api/sessions` + `POST /api/sessions/:id/finish`                      |
| `GET /api/registros`             | Substituído por `GET /api/sessions`                                                         |

**Rotas antigas de subject** (`/api/subject/list-subjects`, `/get-subject/:id`, `/update-subject/:id`) usam verbo no caminho **e** no método HTTP, o que é redundante. Nas rotas novas, seguir REST: o método já diz a ação.

---

# Fora do escopo desta fase

Não implementar, mesmo que pareça natural:

- Consumo de API externa de questões (só o registro manual entra)
- Badges e conquistas
- Grupos privados, ranking, mural
- Flashcards e qualquer uso de IA
- Simulados
- Notificações push
- Pagamento e planos

Se eu pedir algo desta lista, me lembre de que está fora do escopo antes de implementar.

---

# Ordem de implementação

| Bloco | Módulos                                        | Observação                                      |
| ----- | ---------------------------------------------- | ----------------------------------------------- |
| A     | Auth + onboarding + **seed**                   | Destrava tudo. Sem seed, nada roda              |
| B     | Ciclo                                          | Depende de A                                    |
| C     | Sessão + fim de sessão + revisão + gamificação | Trabalhar juntos — o `finish` conecta os quatro |
| D     | Registro de questões                           | Paralelizável com C                             |
| E     | Home + dashboard                               | Por último: só leem o que já existe             |

O bloco C é o mais caro e o mais arriscado. Se algo atrasar, cortar do bloco E — nunca do C.
