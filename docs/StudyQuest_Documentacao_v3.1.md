# STUDYQUEST

## Plataforma de Rotinas Gamificadas com IA para Estudantes

| Versão | Data |
|--------|------|
| **3.1** | **Março 2026** |

*Documentação Técnica — TCC Engenharia de Software*

---

# 1. Visão Geral do Projeto

## 1.1 O Problema Real

Estudantes brasileiros (concursos, ENEM, faculdade) enfrentam três problemas que plataformas existentes resolvem de forma parcial ou genérica:

- **Falta de consistência:** começam bem, abandonam em 2-3 semanas por falta de feedback motivacional contextualizado.
- **Cegueira sobre performance:** estudam muito, mas não sabem QUAIS matérias precisam de mais atenção.
- **Ausência de contexto BR:** apps genéricos ignoram estrutura de concursos, bancas, ENEM e lógica de matérias brasileiras.

> **Análise Competitiva**
>
> → Habitica: gamificação genérica, sem contexto de estudo real, sem analytics de performance
>
> → Notion templates: sem gamificação, sem IA, depende de setup manual extenso
>
> → Forest/Focusmate: apenas controle de tempo, sem tracking de conteúdo ou performance
>
> → Anki: focado em revisão espaçada, sem visão de rotina ou gamificação de progresso
>
> **GAP REAL:** nenhuma dessas ferramentas combina (1) tracking de sessão com dados de performance, (2) gamificação baseada nesses dados e (3) IA que usa o histórico para personalizar.

✅ **[RESOLVIDO]** Survey de validação com 20+ estudantes — template completo na seção 15.

## 1.2 A Solução: StudyQuest

StudyQuest é uma plataforma web que combina journaling de estudos, gamificação baseada em dados reais e inteligência artificial para criar um sistema de acompanhamento personalizado para estudantes brasileiros.

> **Diferencial Principal**
>
> → Analytics de performance por matéria com cálculo de eficiência real (tempo vs acerto)
>
> → IA que usa o histórico individual para sugerir horário e prever risco de abandono
>
> → Gamificação alimentada por dados — XP calculado sobre performance, não apenas presença
>
> → Contexto 100% brasileiro: matérias, áreas, lógica de concursos e ENEM
>
> → Bônus de XP para uso do timer Pomodoro próprio — incentivo de retenção na plataforma
>
> **NOTA:** 'perfil público' mostra conquistas baseadas em dados auto-reportados. Não é verificação externa — é um portfólio de consistência pessoal.

## 1.3 Funcionalidades Core (MVP)

| Funcionalidade | Descrição | Prioridade |
|---|---|---|
| Registro diário de estudos | Matéria, tempo, questões, acertos, produtividade | P0 — Essencial |
| Sistema de XP e níveis | Calculado sobre dados reais de performance | P0 — Essencial |
| Streak inteligente | Detecta padrões e alerta antes do abandono | P0 — Essencial |
| Timer Pomodoro próprio | Timer integrado com bônus de XP — retenção na plataforma | P0 — Diferencial |
| Badges desbloqueáveis | Conquistas baseadas em comportamento real | P1 — Importante |
| Dashboard com gráficos | Visualização de progresso, eficiência por matéria e tendências | P1 — Importante |
| Motor de IA (analytics + ML) | Insights de performance, horário ideal, risco de abandono | P1 — Diferencial |
| Perfil público | Portfólio de consistência com histórico de conquistas | P1 — Importante |

## 1.4 Métricas de Sucesso do MVP

✅ **[RESOLVIDO]** Métricas de sucesso definidas com metas numéricas para contexto de TCC.

O sucesso do MVP é medido por indicadores de engajamento e retenção. As metas abaixo são calibradas para um contexto acadêmico (TCC) com base pequena de beta-testers (10-50 usuários), referenciadas em benchmarks de apps de hábitos e produtividade:

| Métrica | Definição | Meta MVP (TCC) | Benchmark de Mercado |
|---|---|---|---|
| Retenção D7 | % de usuários que registram ao menos 1 sessão 7 dias após o cadastro | ≥ 40% | Apps de hábito: 25-35% |
| Retenção D30 | % de usuários ativos 30 dias após o cadastro | ≥ 20% | Apps de hábito: 10-15% |
| Sessões por semana | Média de sessões registradas por usuário ativo por semana | ≥ 3,5 sessões/semana | Habitica: ~2-3 sessões/semana |
| Streak média | Média de dias consecutivos de estudo entre usuários ativos | ≥ 5 dias | Duolingo (referência): 4-7 dias |
| Taxa de conclusão onboarding | % de novos usuários que completam 3+ sessões na primeira semana | ≥ 50% | SaaS B2C: 40-60% |
| NPS (Net Promoter Score) | Pesquisa ao final do beta — escala 0-10 | ≥ 30 | Bom para produto novo: 20-40 |
| Tempo médio por sessão | Duração média do estudo reportado | ≥ 25 minutos | Baseline razoável para estudo focado |
| Adoção de IA insights | % de usuários com 14+ sessões que visualizam seus insights | ≥ 60% | Feature engagement médio: 30-50% |

> **Como medir no contexto de TCC**
>
> → Retenção D7 e D30: query SQL sobre tabela User (createdAt) cruzada com StudySession (studiedAt)
>
> → Sessões/semana: `COUNT(sessions) / COUNT(DISTINCT week)` por usuário ativo
>
> → Streak média: `AVG(streak)` em snapshot semanal dos usuários com ≥ 3 sessões
>
> → NPS: pergunta final no survey de feedback pós-beta (Google Forms)
>
> **NOTA:** com N < 50, reportar métricas com intervalo de confiança ou range, não como absoluto.

---

# 2. Arquitetura do Sistema

## 2.1 Decisão Arquitetural

A arquitetura foi projetada para equilibrar velocidade de desenvolvimento (time pequeno, prazo de TCC) com qualidade técnica demonstrável em entrevistas internacionais.

> **Por que frontend Next.js + backend Express separados?**
>
> → Frontend Next.js (Vercel) e backend Express (Railway) em repositórios separados
>
> → Separação clara de responsabilidades: Next.js cuida de SSR/UI, Express cuida da API REST
>
> → Serviço de IA isolado (Python/FastAPI) demonstra arquitetura distribuída real
>
> → Cada serviço deployado e escalado de forma independente
>
> → Redis como camada intermediária: cache, sessões JWT e comunicação assíncrona com IA
>
> **NOTA:** O cronograma usa o termo 'mono-repo' para indicar um único repositório Git com workspaces separados (frontend/ + backend/ + ai-service/). Não é monolito. Cada pasta é deployada de forma independente — repositório unificado, serviços separados.

## 2.2 Redis — Casos de Uso

| Caso de Uso | Como funciona | TTL / Estratégia |
|---|---|---|
| Blacklist de JWT (logout) | Token invalidado armazenado no Redis. Middleware Passport checa antes de autenticar. | TTL = tempo restante de expiração do token |
| Rate limiting | Contador por IP/userId no Redis. Middleware rejeita com 429 se limite excedido. | Janela deslizante de 15min, max 100 req |
| XP e streak em tempo real | XP calculado e armazenado no Redis imediatamente. Postgres atualizado em seguida (write-through). | Sem TTL — sincronizado com Postgres |
| Cache de analytics/dashboard | Queries pesadas (top matérias, gráficos de evolução) cacheadas no Redis. | TTL = 5 minutos — invalida no novo registro |

## 2.3 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| UI/Estilo | TailwindCSS + Shadcn/ui | Design system consistente, rápido |
| Backend (API) | Node.js + Express + TypeScript + Prisma ORM | Arquitetura separada, robusta e demonstrável |
| Banco Principal | PostgreSQL via Supabase | Relacional, gratuito, escalável |
| Cache / Sessões | Redis (Upstash — gratuito) | Cache de analytics, blacklist JWT, rate limiting, XP real-time |
| Autenticação | Passport.js + JWT | Padrão de mercado, stateless, flexível |
| Validação | Zod | Schema-first, integra com Prisma e Express middlewares |
| Serviço de IA | Python + FastAPI | Ecossistema ML nativo, rápido, REST |
| IA / LLM | OpenAI API ou Claude API | Geração de texto para insights personalizados |
| Gráficos | Recharts | Biblioteca React nativa, customizável |
| Deploy Frontend | Vercel | CI/CD automático, gratuito |
| Deploy Backend + Redis | Railway | Container Node.js + Redis no mesmo projeto |
| Deploy Serviço IA | Railway (serviço separado) | Container Python independente do backend principal |
| Testes | Jest + Supertest + React Testing Library | Unit + integration HTTP + component tests |
| Documentação API | Swagger / OpenAPI | Padrão de mercado, gerado automaticamente |

## 2.4 Fluxo de Dados Principal

| Etapa | Descrição |
|---|---|
| 1. Input do usuário | Registro de estudo via formulário no frontend Next.js |
| 2. Autenticação | Passport.js valida JWT no header — middleware Express verifica token na blacklist Redis |
| 3. Rate limiting | Middleware Redis verifica limite de requests por IP/usuário antes de processar |
| 4. Validação | Zod valida e sanitiza todos os campos no middleware Express |
| 5. Cálculo de XP | Função pura e testável: studyTime (escalonado) + bônus questões + bônus Pomodoro + bônus streak |
| 6. XP em tempo real | XP e streak atualizados no Redis imediatamente (resposta rápida ao usuário) |
| 7. Persistência | Prisma persiste no PostgreSQL — Redis é invalidado/atualizado em seguida |
| 8. Engine de gamificação | Verifica level up, atualiza streak, checa condições de badges |
| 9. Fila de IA (async) | Job publicado para processamento de IA sem bloquear a resposta principal |
| 10. Cache de analytics | Dashboard busca primeiro no Redis — se expirado, recalcula no Postgres e armazena |
| 11. Resposta ao frontend | Dados atualizados + notificações (level up, badge novo, insight novo) |

---

# 3. Modelos de Dados

## 3.1 Esquema Prisma — Visão Geral

| Model | Responsabilidade | Relações |
|---|---|---|
| User | Perfil, gamificação, preferências | StudySessions, Badges via UserBadge, AIInsights |
| StudySession | Sessão de estudo (entry diária) | Pertence a User e Subject |
| Subject | Matéria de estudo | Pertence a Area, tem muitas StudySessions |
| Area | Área do conhecimento (ex: Exatas) | Tem muitos Subjects |
| Badge | Definição de conquistas e raridade | N:N com User via UserBadge |
| UserBadge | Tabela pivot usuário-badge com data | User + Badge |
| AIInsight | Insights gerados pelo motor de IA | Pertence a User |

## 3.2 Model: User

```prisma
// --- JÁ IMPLEMENTADO ---
id          String    @id @default(uuid())
email       String    @unique
username    String    @unique
password    String    // hash bcrypt
avatar      String?
bio         String?
level       Int       @default(1)
xp          Int       @default(0)
createdAt   DateTime  @default(now())
updatedAt   DateTime  @updatedAt

// --- A ADICIONAR ---
streak      Int       @default(0)    // dias consecutivos
lastStudy   DateTime?                // para cálculo de streak
riskScore   Float     @default(0)    // 0.0-1.0 calculado pela IA
objetivo    String?                  // 'concurso' | 'enem' | 'faculdade'
sessions    StudySession[]
badges      UserBadge[]
insights    AIInsight[]
```

## 3.3 Model: StudySession

```prisma
// --- JÁ IMPLEMENTADO ---
id          String    @id @default(uuid())
studyTime   Int       // minutos estudados
questions   Int       // questões feitas
rate        Int       // nota da sessão 1-10
createdAt   DateTime  @default(now())
userId      String    // FK -> User
subjectId   String    // FK -> Subject

// --- A ADICIONAR (CRÍTICO) ---
studiedAt      DateTime    // OBRIGATÓRIO: horário real do estudo
correctAnswers Int?        // para calcular % de acerto por matéria
sessionType    String?     // 'pomodoro' | 'manual' | 'cronômetro'
pomodoroCount  Int?        // quantos pomodoros completados
xpEarned       Int?        // XP ganho nessa sessão
distractions   String[]    // tipos de distração reportadas
notes          String?     // campo livre de anotações

@@index([userId, studiedAt])  // índice por data REAL, não por createdAt
```

## 3.4 Models: Subject e Area

Já implementados conforme schema original. Subject pertence a Area; Area agrupa Subjects por área de conhecimento (Exatas, Humanas, etc.).

## 3.5 Model: Badge e UserBadge

Schema de Badge e UserBadge já implementados. Critérios completos de cada badge definidos na seção 6.3.

## 3.6 Model: AIInsight (a implementar)

```prisma
id         String   @id @default(uuid())
userId     String
tipo       String   // 'risco_abandono' | 'horario_ideal' | 'performance'
titulo     String   // Ex: 'Você tende a parar após 3 dias sem Matemática'
descricao  String   // Texto completo do insight gerado pelo LLM
dados      Json     // Dados numéricos que geraram o insight
confianca  Float    // 0.0 - 1.0 | score do modelo
lido       Boolean  @default(false)
criadoEm   DateTime @default(now())
user       User     @relation(fields: [userId], references: [id])
```

---

# 4. Motor de Inteligência Artificial

O motor de IA é um serviço independente em Python/FastAPI. É importante ser preciso sobre o que ele faz: não é IA sofisticada — é estatística aplicada com LLM para apresentação. O valor está na aplicação contextualizada ao problema real de estudantes, não na complexidade do modelo.

> **O que o motor de IA realmente faz (sendo tecnicamente honesto)**
>
> → Predição de risco de abandono: regressão logística sobre features de comportamento
>
> → Sugestão de horário ideal: média de produtividade agrupada por faixa horária
>
> → Análise de performance: agregações SQL (tempo investido vs acerto por matéria)
>
> → Geração de texto dos insights: LLM transforma números calculados em linguagem natural
>
> Isso não é diferencial de ML — é engenharia de produto aplicada com critério. O diferencial real: dados específicos de estudo + lógica contextualizada + UX útil.

> **Estratégia para Cold Start (usuários novos sem histórico)**
>
> PROBLEMA: a IA não funciona com poucos registros — features dependem de histórico.
>
> → 0-5 sessões: gamificação básica funciona. IA silenciosa — sem insights ainda.
>
> → 6-13 sessões: analytics simples liberados (top matéria, total de horas).
>
> → 14+ sessões: horário ideal e análise de performance desbloqueados.
>
> → 30+ sessões: predição de risco de abandono ativada (dados suficientes).
>
> UI deve comunicar progresso: *'Faltam X sessões para desbloquear seus insights de IA'* — transforma o cold start em feature de gamificação, não em limitação.

## 4.1 Predição de Risco de Abandono

> **Como funciona**
>
> PROBLEMA: 68% dos estudantes abandonam rotinas em menos de 21 dias.
>
> DADOS DE ENTRADA: gaps entre sessões de estudo, queda de produtividade ao longo do tempo, redução progressiva de horas estudadas, padrões de distrações (tipo e frequência).
>
> SAÍDA: riskScore (0.0 - 1.0) atualizado a cada novo registro
>
> → 0.0 - 0.3: Em dia, sem risco
>
> → 0.3 - 0.6: Atenção — enviar nudge motivacional
>
> → 0.6 - 1.0: Alto risco — acionar sistema de retenção (email + notificação)
>
> IMPLEMENTAÇÃO: Regressão logística simples sobre features extraídas do histórico (sem necessidade de LLM para esta feature — mais rápido e previsível).

### 4.1.1 Lógica de Notificações de Risco de Abandono

✅ **[RESOLVIDO]** Lógica de notificações de retenção definida com gatilhos, canais, frequência e templates.

O sistema de retenção atua quando o riskScore ultrapassa limiares pré-definidos. As notificações seguem uma escalada progressiva para evitar fadiga de alerta e respeitar o usuário.

**Regras Gerais:**

- **Frequência máxima global:** 1 notificação a cada 48 horas por canal. Nunca mais de 3 notificações na mesma semana.
- **Horário de envio:** entre 9h e 21h no fuso do usuário (ou UTC-3 como padrão BR). Nunca de madrugada.
- **Cool-down após retorno:** se o usuário registra uma sessão, o sistema silencia por 72 horas.
- **Opt-out respeitado:** usuário pode desativar notificações nas configurações. LGPD exige isso.
- **Cap total:** após 5 notificações sem resposta (nenhuma sessão registrada), o sistema para de enviar. Última mensagem é de despedida respeitosa.

| Nível | Gatilho Exato | Canal | Delay Mínimo | Template da Mensagem |
|---|---|---|---|---|
| **Nível 1 — Nudge suave** | riskScore ≥ 0.3 E gap ≥ 2 dias sem sessão | Push notification (in-app / web push) | 48h desde última notificação | *"Faz [X] dias que você não registra. Sua streak de [N] dias está em risco! 5 minutos hoje mantêm o ritmo 💪"* |
| **Nível 2 — Alerta moderado** | riskScore ≥ 0.5 E gap ≥ 4 dias sem sessão | Email (se autorizado) + push notification | 72h desde última notificação | *"Notamos que você pausou seus estudos. Seus dados mostram que [matéria X] estava evoluindo bem. Que tal retomar com uma sessão curta de 15 min?"* |
| **Nível 3 — Reengajamento** | riskScore ≥ 0.7 E gap ≥ 7 dias sem sessão | Email personalizado com dados de progresso | 7 dias desde última notificação | *"[Nome], você acumulou [Y] XP e desbloqueou [Z] badges. Seu progresso ainda está salvo. Estudantes que retomam após uma pausa recuperam o ritmo em ~3 dias. Volte quando estiver pronto."* |
| **Nível 4 — Despedida** | 5 notificações enviadas sem nenhuma sessão registrada | Email final | 14 dias desde última notificação | *"Seu progresso está salvo e esperando por você. Quando quiser retomar, estaremos aqui. Sem pressão. 🎓"* — Sistema silencia permanentemente até o usuário retornar. |

> **Implementação técnica**
>
> → Cron job diário (Railway cron ou Bull queue) às 10h UTC-3 calcula riskScore para usuários com gap ≥ 2 dias
>
> → Tabela `NotificationLog`: userId, tipo, canal, enviadoEm, sessaoApos (nullable) — para medir eficácia
>
> → Email: SendGrid free tier (100 emails/dia) ou Resend (100 emails/dia gratuitos)
>
> → Push: Web Push API (VAPID keys) — gratuito, sem dependência de terceiros
>
> → Métrica de eficácia: % de usuários que registram sessão dentro de 48h após notificação

## 4.2 Sugestão de Horário Ideal

> **Como funciona**
>
> PROBLEMA: Estudantes desperdiçam energia estudando no horário errado.
>
> DADOS DE ENTRADA: campo `studiedAt` (horário REAL do estudo, não createdAt) + correlação entre faixa horária e produtividade (rate). Mínimo de 14 sessões para ativar.
>
> SAÍDA: Insight textual — ex: *'Seus estudos são 40% mais produtivos entre 20h e 22h'*
>
> IMPLEMENTAÇÃO: Agrupamento por faixa horária (manhã/tarde/noite/madrugada) + média de produtividade por faixa + LLM gera texto com os números calculados.
>
> **IMPORTANTE:** usa `studiedAt`, nunca `createdAt`. Usuário pode registrar às 23h um estudo que fez às 14h.

## 4.3 Análise de Performance por Matéria

> **Como funciona**
>
> PROBLEMA: Estudantes não sabem onde estão perdendo mais tempo com menos resultado.
>
> DADOS DE ENTRADA: % de acerto por matéria (questões acertadas / questões totais), tempo investido por matéria, evolução temporal da performance.
>
> SAÍDA: Ranking de matérias por eficiência + sugestão de redistribuição de carga. Exemplo: *'Você investe 40% do tempo em História mas tem apenas 52% de acerto. Considere revisar a técnica de estudo nessa matéria.'*
>
> IMPLEMENTAÇÃO: SQL aggregations + LLM para gerar texto de insight personalizado.

## 4.4 Decisão: API Externa vs Modelo Próprio

| Abordagem | Prós | Contras |
|---|---|---|
| API LLM (OpenAI/Claude) | Rápido, linguagem natural rica, zero infra ML | Custo por token, latência, dependência externa |
| ML próprio (sklearn) | Controle total, sem custo por chamada, offline | Mais tempo de desenvolvimento, menos flexível |
| **Híbrido (RECOMENDADO)** | Cálculo próprio para predição, LLM para texto | Um pouco mais complexo, mas demonstra mais skill |

**Recomendação:** usar abordagem híbrida. Predição de risco e análise de performance usam algoritmos próprios (scikit-learn). Geração de texto dos insights usa API de LLM. Isso demonstra conhecimento real de ML E de integração com IA generativa.

---

# 5. API Endpoints

## 5.1 Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro de novo usuário (nome, email, senha, objetivo) |
| POST | `/api/auth/signin` | Login — retorna JWT |
| POST | `/api/auth/signout` | Logout — invalida sessão |
| GET | `/api/auth/me` | Dados do usuário autenticado |

## 5.2 Registros

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/registros` | Criar registro + calcular XP + verificar badges + acionar IA (async) |
| GET | `/api/registros` | Listar registros do usuário (com paginação e filtros) |
| GET | `/api/registros/:id` | Obter registro específico |
| PUT | `/api/registros/:id` | Atualizar registro (janela de 24h) |
| DELETE | `/api/registros/:id` | Remover registro |

## 5.3 Gamificação e Perfil

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/perfil` | Dados completos: XP, nível, streak, badges, stats |
| GET | `/api/perfil/:username` | Perfil público de outro usuário |
| GET | `/api/badges` | Lista de badges do usuário autenticado |
| GET | `/api/analytics` | Dashboard de insights: melhor dia, matéria top, evolução XP |

## 5.4 IA

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/ai/insights` | Listar insights gerados pela IA para o usuário |
| GET | `/api/ai/risco` | Retorna riskScore atual e histórico |
| GET | `/api/ai/horario` | Sugestão de horário ideal (disponível após 14 registros) |
| GET | `/api/ai/performance` | Análise de performance por matéria |
| POST | `/api/ai/chat` | Chat livre com contexto do usuário (feature premium futura) |

---

# 6. Sistema de Gamificação

## 6.1 Cálculo de XP

A função base já está implementada com escalonamento por tempo. O sistema completo adiciona bônus por questões, produtividade e Pomodoro:

| Ação | XP / Bônus | Condição |
|---|---|---|
| studyTime ≤ 10 min | studyTime × 1.1 | Base — sessão curta |
| studyTime 11-30 min | studyTime × 1.3 | Base — sessão média |
| studyTime > 30 min | studyTime × 1.5 | Base — sessão longa |
| Por questão respondida | +2 XP por questão | questions > 0 |
| Bônus acerto alto | +15% do XP de questões | correctAnswers/questions > 80% |
| Bônus produtividade | +20% do XP total | rate ≥ 8 |
| Bônus Pomodoro próprio | +25% do XP total | Timer da plataforma usado |
| Streak 7 dias | +100 XP bônus | Marco semanal |
| Streak 30 dias | +500 XP bônus | Marco mensal |
| Streak 100 dias | +2000 XP bônus | Marco de longo prazo |

### 6.1.1 Decisão: Streak Bônus é EXCLUSIVO (não cumulativo)

✅ **[RESOLVIDO]** Streak bônus definido como EXCLUSIVO. Justificativa de balanceamento abaixo.

O bônus de streak aplica apenas o marco mais alto atingido, não a soma de todos os marcos anteriores.

**Exemplo prático:**

- Streak de 7 dias: **+100 XP** (e não +0, porque atingiu o marco de 7).
- Streak de 30 dias: **+500 XP** (e NÃO +100 + +500 = +600 XP).
- Streak de 100 dias: **+2000 XP** (e NÃO +100 + +500 + +2000 = +2600 XP).

**Justificativa de balanceamento:**

1. **Inflação de XP controlada:** com bônus cumulativo, um usuário com streak 100 ganharia +2.600 XP por sessão apenas de streak, o que equivale a ~43 sessões de 30 minutos (43 × 1.3 × 30 ≈ 1.674 XP base). Isso trivializa o XP base e desincentiva estudo real.
2. **Simplicidade de teste:** lógica exclusiva reduz casos de teste e elimina ambiguidade na implementação. Uma função `getStreakBonus(streak)` retorna um único valor com simples if/else.
3. **Progressão limpa:** cada marco é um evento celebratório distinto. O jogador sente o salto de 100 → 500 → 2000 como recompensa clara, não como acúmulo confuso.
4. **Referência de mercado:** Duolingo e similares usam marcos exclusivos (não cumulativos) justamente para evitar power-creep em sistemas de pontos.

> **Implementação — pseudocódigo**
>
> ```typescript
> function getStreakBonus(streak: number): number {
>   if (streak >= 100) return 2000;
>   if (streak >= 30) return 500;
>   if (streak >= 7) return 100;
>   return 0;
> }
> // Bônus aplicado 1x quando o marco é atingido (na sessão que completa o marco),
> // NÃO em toda sessão subsequente. Necessário flag: streakBonusClaimed7, 30, 100.
> // Isso evita que o usuário ganhe +2000 XP TODA sessão após streak 100.
> ```

> **Nota sobre o bônus Pomodoro**
>
> O bônus de 25% para uso do timer Pomodoro próprio da plataforma é intencional: cria um incentivo para o usuário permanecer dentro do StudyQuest ao invés de usar um timer externo — aumenta retenção e gera mais dados de comportamento.
>
> `sessionType = 'pomodoro'` + `pomodoroCount > 0` + `fonte = 'platform_timer'` → todos os três precisam ser verdadeiros para o bônus ser aplicado.

## 6.2 Sistema de Níveis

| Nível | XP Necessário | Título | Benefício |
|---|---|---|---|
| 1-5 | 0 - 500 XP | Iniciante | Acesso básico |
| 6-10 | 500 - 1.500 XP | Estudante | Perfil público desbloqueado |
| 11-20 | 1.500 - 5.000 XP | Dedicado | Analytics avançado |
| 21-30 | 5.000 - 15.000 XP | Veterano | IA insights premium |
| 31-50 | 15.000 - 50.000 XP | Mestre | Badge exclusivo verificável |
| 51+ | 50.000+ XP | Lenda | Destaque no ranking público |

## 6.3 Badges (MVP) — Critérios Completos

✅ **[RESOLVIDO]** Critérios completos de cada badge com condição exata, raridade e lógica de verificação.

Cada badge tem nome, descrição para o usuário, condição exata de desbloqueio (query/lógica), raridade (1=Comum a 5=Lendário) e categoria. Badges são verificados a cada novo registro de sessão via função `verificarBadges()`.

| Badge | Descrição (visível ao usuário) | Condição Exata de Desbloqueio | Raridade | Categoria |
|---|---|---|---|---|
| **Novato** | Deu o primeiro passo! | `COUNT(sessions WHERE userId = X) >= 1` | 1 — Comum | Início |
| **Primeira Semana** | 7 dias seguidos de estudo | `user.streak >= 7` (verificado no momento que streak atinge 7) | 2 — Incomum | Streak |
| **Maratonista** | Dedicou 20h+ em uma única semana | `SUM(studyTime WHERE studiedAt BETWEEN início_semana AND fim_semana) >= 1200` (minutos). Semana = segunda a domingo. | 3 — Raro | Volume |
| **Focado** | 7 dias sem reportar distrações | 7 sessões consecutivas (por `studiedAt`) com `distractions = []` (array vazio). Sessões devem ser em dias distintos. | 3 — Raro | Qualidade |
| **Disciplinado** | Estudou a mesma matéria 10+ vezes | `COUNT(sessions WHERE subjectId = qualquer_materia AND userId = X) >= 10` para pelo menos 1 matéria. | 2 — Incomum | Consistência |
| **Produtivo** | 5 dias com nota máxima de produtividade | `COUNT(DISTINCT DATE(studiedAt) WHERE rate >= 9 AND userId = X) >= 5`. Não precisa ser consecutivo. | 3 — Raro | Performance |
| **Campeão Mensal** | 30 dias consecutivos de estudo | `user.streak >= 30` (verificado no momento que streak atinge 30) | 4 — Épico | Streak |
| **Certeiro** | Acertou 80%+ em 5 sessões seguidas | 5 sessões consecutivas (por `studiedAt`) com `(correctAnswers/questions) >= 0.8` E `questions >= 5` em cada sessão. | 3 — Raro | Performance |
| **Madrugador** | Estudou antes das 7h em 3+ ocasiões | `COUNT(sessions WHERE HOUR(studiedAt) < 7 AND userId = X) >= 3`. Sessões em dias distintos. | 2 — Incomum | Hábito |
| **Noturno** | Estudou após as 22h em 3+ ocasiões | `COUNT(sessions WHERE HOUR(studiedAt) >= 22 AND userId = X) >= 3`. Sessões em dias distintos. | 2 — Incomum | Hábito |
| **Centurião** | 100 dias consecutivos — lendário | `user.streak >= 100` (verificado no momento que streak atinge 100) | 5 — Lendário | Streak |
| **Pomodoro Master** | Completou 50 pomodoros na plataforma | `SUM(pomodoroCount WHERE sessionType = 'pomodoro' AND userId = X) >= 50` | 3 — Raro | Método |
| **Multidisciplinar** | Estudou 5+ matérias diferentes | `COUNT(DISTINCT subjectId WHERE userId = X) >= 5` | 2 — Incomum | Diversidade |
| **Cientista de Dados** | Desbloqueou todos os insights de IA | `user.sessions.count >= 30` E user acessou cada tipo de insight (horário, performance, risco) ao menos 1x. | 4 — Épico | IA |

> **Regras de implementação de badges**
>
> → Função `verificarBadges()` é chamada em `POST /api/registros` após persistência da sessão
>
> → Verificar TODAS as condições de badges não conquistados (`UserBadge` não existe para o par userId+badgeId)
>
> → Usar `@@unique([userId, badgeId])` para prevenir duplicatas — UPSERT com conflito ignorado
>
> → Badges de streak são verificados apenas quando streak é atualizado (não em toda sessão)
>
> → Badges baseados em window temporal (Maratonista) usam `studiedAt`, não `createdAt`
>
> → Badge 'Certeiro' exige `questions >= 5` por sessão para evitar falsos positivos (1/1 = 100%)

---

# 7. Estratégia de Testes

Testes automatizados são obrigatórios para portfólio internacional. Cobertura mínima alvo: 80% nas funções de lógica de negócio crítica (XP, streak, badges). Testes de integração rodam contra PostgreSQL real — nunca SQLite, que tem comportamentos diferentes em constraints e transações.

## 7.1 Testes Unitários (Jest)

| Módulo | O que testar | Prioridade |
|---|---|---|
| `calcularXP()` | Todos os cenários: base, cada bônus, cumulatividade, edge cases (0 minutos, streak exato) | P0 — Crítico |
| `calcularStreak()` | Incremento diário, reset após gap, bônus de marcos 7/30/100, streak exclusivo (não cumulativo) | P0 — Crítico |
| `calcularNivel()` | Transições de nível, XP exato de borda, sem regressão de nível | P0 — Crítico |
| `verificarBadges()` | Cada badge: dados que atendem E não atendem. Badge não duplicado. | P1 |
| Schemas Zod | Cada schema com dados válidos, inválidos e de borda | P1 |
| riskScore features | Extração de features com dados sintéticos de abandono e retenção | P1 |
| `getStreakBonus()` | streak=6→0, streak=7→100, streak=29→100, streak=30→500, streak=100→2000 | P0 — Crítico |

> **Nota sobre streak bônus nos testes**
>
> DECISÃO TOMADA: streak bônus é EXCLUSIVO (ver seção 6.1.1).
>
> → Testes devem cobrir: streak 7 → +100 XP (não +0), streak 30 → +500 XP (não +600), streak 100 → +2000 XP (não +2600).
>
> → Testar também: bônus só é concedido 1x por marco (flag `streakBonusClaimed`).

## 7.2 Testes de Integração (Jest + Supertest)

| Endpoint | Cenários obrigatórios |
|---|---|
| `POST /api/sessions` | Criação válida, campos inválidos (Zod), usuário não autenticado, cálculo de XP correto, badge desbloqueado |
| `GET /api/analytics` | Usuário sem sessões, com 5 sessões, com 30+ sessões, filtro de data |
| `GET /api/ai/insights` | Usuário abaixo do mínimo (sem insights), acima do mínimo, insights marcados como lidos |
| `POST /api/auth/logout` | Token válido na blacklist Redis após logout, token inválido rejeitado |

> **Ferramentas e Ambiente de Teste**
>
> → Jest: testes unitários da lógica de negócio (pura, sem DB)
>
> → Supertest: testes de endpoints HTTP do Express
>
> → PostgreSQL dedicado: banco de testes real — nunca SQLite
>
> → Redis mock (ioredis-mock): mock do Redis para testes unitários de middleware
>
> → GitHub Actions: CI automático em cada Pull Request
>
> → Meta de cobertura: >= 80% nas funções `calcularXP`, `calcularStreak`, `verificarBadges`, `getStreakBonus`

---

# 8. Cronograma de Desenvolvimento

Cronograma para time de 4 pessoas: 1 tech lead, 1 dev backend junior, 2 designers/frontend em aprendizado. Prazo: 12 semanas para MVP funcional com usuários beta. O prazo total do TCC (~12 meses) deixa tempo para iteração, documentação acadêmica e preparação da defesa.

> **Estrutura do repositório (mono-repo com workspaces)**
>
> ```
> studyquest/
>   frontend/    ← Next.js — deploy Vercel
>   backend/     ← Node.js + Express — deploy Railway
>   ai-service/  ← Python + FastAPI — deploy Railway (serviço separado)
> ```
>
> Um repositório Git, três serviços deployados de forma independente.
> Autenticação: Passport.js + JWT no backend Express.
> Frontend usa cookies httpOnly para armazenar o JWT — sem NextAuth.

### Fase 1 — Fundação (Semanas 1-3)

| Semana | Tarefas | Responsável |
|---|---|---|
| 1 | Setup mono-repo (workspaces). Express + Prisma + PostgreSQL. Schemas iniciais. Passport.js + JWT. | Tech Lead |
| 2 | Autenticação completa (register, login, logout com blacklist Redis). Testes unitários de auth. | Tech Lead + Backend |
| 3 | API de sessões de estudo com cálculo de XP. studiedAt no schema. Testes unitários de XP. | Tech Lead + Backend |

### Fase 2 — Core Backend (Semanas 4-6)

| Semana | Tarefas | Responsável |
|---|---|---|
| 4 | Sistema de níveis, streak e badges. Testes unitários de cada lógica. Redis para XP em tempo real. | Backend |
| 5 | API de analytics. Cache Redis (TTL 5min). Rate limiting. Documentação Swagger. | Tech Lead + Backend |
| 6 | Setup serviço FastAPI. Predição de risco v1 (regressão logística). Testes com dados sintéticos. | Tech Lead |

### Fase 3 — IA e Frontend (Semanas 7-10)

| Semana | Tarefas | Responsável |
|---|---|---|
| 7 | Horário ideal + análise de performance. Integração LLM para texto. Cold start logic. | Tech Lead |
| 8 | Setup Shadcn/ui. Login/cadastro. Dashboard básico. Componentes XP/streak/nível. | Frontend + Design |
| 9 | Formulário de registro com timer Pomodoro. Página de perfil. Gráficos Recharts. | Frontend + Design |
| 10 | Display de badges. Seção de insights de IA com estado de cold start. Responsividade mobile. | Frontend + Design |

### Fase 4 — Qualidade e Launch (Semanas 11-12)

| Semana | Tarefas | Responsável |
|---|---|---|
| 11 | Testes de integração (Postgres real). Bug fixes. Observabilidade básica (logs, health checks). | Todos |
| 12 | Deploy Vercel + Railway. CI/CD GitHub Actions. Beta users (mínimo 10). Coleta de feedback. | Tech Lead |

---

# 9. Divisão do Time

| Papel | Responsabilidades Principais |
|---|---|
| Tech Lead (você) | Arquitetura geral, backend core, serviço de IA, code review, deploy, integração LLM, decisões técnicas |
| Dev Backend Junior | CRUD de registros, sistema de badges, endpoints de analytics, testes unitários, Swagger |
| Designer/Front 1 | Figma (design system, componentes), implementação de páginas com suporte do tech lead |
| Designer/Front 2 | Figma (fluxos de usuário, protótipo), responsividade, UX reviews, testes com usuários beta |

> **Nota sobre o time**
>
> Os dois designers/frontend estão em fase de aprendizado — isso é normal e manejável.
>
> → Eles constroem o Figma completo nas primeiras 6 semanas enquanto o backend é desenvolvido
>
> → Tech Lead cria os componentes base (Shadcn/ui + Tailwind) nas semanas 7-8
>
> → Eles implementam páginas usando os componentes prontos — curva de aprendizado menor
>
> → Code review obrigatório em todo PR — oportunidade de ensino contínuo

---

# 10. Conformidade LGPD

O StudyQuest coleta dados pessoais de estudantes brasileiros. A LGPD (Lei 13.709/2018) se aplica. Ignorar isso em 2026 é risco jurídico real — e ausência dessa seção numa banca de TCC é uma falha grave.

| Dado Coletado | Base Legal (LGPD) | Tratamento Necessário |
|---|---|---|
| Email e nome | Execução de contrato (Art. 7, V) | Armazenar com hash, nunca expor em logs |
| Horários de estudo | Consentimento explícito (Art. 7, I) | Anonimizar antes de usar para treino de IA |
| Performance por matéria | Consentimento explícito (Art. 7, I) | Não compartilhar com terceiros sem consentimento |
| Dados de distração | Consentimento explícito (Art. 7, I) | Opcional — usuário pode optar por não reportar |
| Histórico para IA | Consentimento explícito (Art. 7, I) | Possibilitar exclusão total (direito ao esquecimento) |

> **Implementações obrigatórias antes do launch**
>
> → Página de Política de Privacidade acessível no footer
>
> → Checkbox de consentimento explícito no cadastro (não pré-marcado)
>
> → Endpoint `DELETE /api/account` — exclusão completa de todos os dados do usuário
>
> → Logs sem PII (email, nome) — usar userId como identificador nos logs
>
> → Dados enviados ao serviço de IA devem ser anonimizados (userId, nunca email)

**[PENDENTE: revisar com advogado ou consultor de LGPD antes do launch público]**

---

# 11. Observabilidade

Com 3 serviços separados (Next.js, Express, FastAPI), voar sem observabilidade é garantia de problemas silenciosos. Implementação mínima necessária para o MVP:

| O que monitorar | Ferramenta | O que alertar |
|---|---|---|
| Erros de runtime | Sentry (free tier) | Qualquer erro não tratado em produção |
| Logs estruturados | Winston (Express) + pino | Logs em JSON com requestId, userId, duração |
| Health checks | `GET /health` em cada serviço | Railway reinicia automaticamente se falhar |
| Redis limites | Upstash Dashboard | Uso acima de 80% do free tier |
| Latência da IA | Log de duração em cada chamada FastAPI | Chamada > 5s é sinal de problema |
| Cache hit rate | Contador Redis | Hit rate < 60% indica cache ineficaz |

---

# 12. Estimativa de Custos Operacionais

Sem planejamento financeiro, o diferencial da IA pode se tornar o maior passivo. Estimativa para 3 cenários de uso:

| Componente | Free Tier | 100 usuários/mês | 1.000 usuários/mês |
|---|---|---|---|
| Vercel (frontend) | Gratuito | Gratuito | ~$20/mês (Pro) |
| Railway (backend + IA) | $5 crédito/mês | ~$10/mês | ~$40/mês |
| Supabase (PostgreSQL) | 500MB gratuito | Gratuito | ~$25/mês (Pro) |
| Upstash (Redis) | 10k req/dia gratuito | ~$0-10/mês | ~$20/mês |
| OpenAI API (insights) | Sem free tier | ~$5-15/mês* | ~$50-150/mês* |
| **TOTAL ESTIMADO** | **~$0/mês** | **~$15-40/mês** | **~$135-235/mês** |

\* Estimativa OpenAI: ~1 chamada de insight por sessão registrada. Com 100 usuários fazendo 5 sessões/semana = ~2.000 chamadas/mês. GPT-4o-mini custa ~$0.0015/1k tokens. Estimativa conservadora: $5-15/mês em 100 usuários.

> **Estratégia para controlar custo de LLM**
>
> → Cache de insights: não recalcular se o histórico não mudou significativamente
>
> → Threshold de mudança: só chamar LLM se novos dados alterarem o cálculo em >10%
>
> → Batch processing: calcular insights 1x/dia, não a cada sessão
>
> → Modelo econômico: usar GPT-4o-mini ou Claude Haiku (custo 10-20x menor que modelos maiores)

---

# 13. Posicionamento como Portfólio Internacional

Este projeto, quando completo, é um case forte para vagas internacionais. Veja como apresentar cada decisão técnica em entrevistas:

| O que você fez | Como apresentar em entrevista |
|---|---|
| Arquitetura 3 serviços separados | Separei responsabilidades: frontend Next.js, API Express e serviço de ML em Python — cada um deployado independentemente no Railway/Vercel |
| Motor de predição de abandono | Implementei regressão logística para prever churn com base em features de comportamento: gaps entre sessões, queda de produtividade, redução de carga |
| Integração com LLM para insights | Uso LLM como camada de linguagem: o cálculo é próprio (ML + SQL), o LLM transforma números em texto acionável para o usuário |
| Cold start tratado como feature | Usuários novos veem progresso até desbloquear IA — transformei uma limitação técnica em mecânica de gamificação |
| Redis com 4 casos de uso distintos | Blacklist JWT para logout, rate limiting por IP, XP em tempo real (write-through) e cache de analytics — cada um com estratégia de TTL justificada |
| Testes com PostgreSQL real | Testes de integração rodam contra Postgres dedicado — eliminei falsos positivos que SQLite causaria em constraints e transações |
| LGPD desde o início | Consentimento, anonimização dos dados para IA e endpoint de exclusão desenhados antes do primeiro usuário — compliance não é retrofitting |

---

# 14. Plano de Ação — Pendências (Atualizado v3.1)

Status atualizado após resolução de pendências pela consultoria. Itens resolvidos marcados. Itens pendentes são apenas os que requerem decisão do owner ou recurso externo.

| Prior. | O que precisa ser feito | Status v3.1 | Ação necessária |
|---|---|---|---|
| URGENTE | Adicionar studiedAt no schema | PENDENTE — requer migration | Migration Prisma. Campo obrigatório no form de registro. |
| URGENTE | Decidir: streak bônus cumulativo ou exclusivo? | ✅ RESOLVIDO — Seção 6.1.1 | Definido como EXCLUSIVO com justificativa de balanceamento. |
| URGENTE | Survey com 20+ estudantes | ✅ RESOLVIDO — Template na seção 15 | Template pronto para Google Forms. Owner precisa aplicar. |
| IMPORTANTE | Definir métricas de sucesso do MVP | ✅ RESOLVIDO — Seção 1.4 | 8 métricas definidas com metas numéricas para contexto de TCC. |
| IMPORTANTE | Estratégia de retenção (notificações) | ✅ RESOLVIDO — Seção 4.1.1 | 4 níveis de escalada com gatilhos, canais, templates e cool-downs. |
| IMPORTANTE | Revisar LGPD com especialista | PENDENTE — requer advogado | Usar template de startup BR como base ou consultar advogado de dados. |
| PODE ESPERAR | Modelo de monetização | PENDENTE — pós-MVP | Pesquisar pricing de Habitica, Anki. Definir freemium vs assinatura. |
| PODE ESPERAR | Validar modelo de risco com dados reais | PENDENTE — requer dados | Após 30+ dias com 50+ usuários. Cross-validation + precisão mínima. |

---

# 15. Survey de Validação com Estudantes (NOVO)

✅ **[RESOLVIDO]** Template completo do survey de validação com 24 perguntas prontas para Google Forms.

Este survey deve ser aplicado **ANTES** de iniciar o desenvolvimento do MVP para validar a dor do público-alvo e sustentar metodologicamente o TCC. Meta: 20+ respostas de estudantes brasileiros (concursos, ENEM, faculdade).

## 15.1 Instruções de Aplicação

- Criar no Google Forms com tema personalizado (logo StudyQuest se disponível).
- Distribuir em grupos de WhatsApp/Telegram de concurseiros, vestibulandos e universitários.
- Tempo estimado de resposta: 5-7 minutos (informar na abertura do form).
- Não coletar email (anonimato aumenta sinceridade das respostas).
- Manter aberto por no mínimo 7 dias antes de fechar coleta.
- Analisar resultados quantitativamente (gráficos automáticos do Google Forms) e qualitativamente (respostas abertas).

## 15.2 Título e Introdução do Formulário

> **Título:** "Pesquisa: Como você organiza seus estudos?"
>
> **Descrição:** "Essa pesquisa faz parte de um Trabalho de Conclusão de Curso em Engenharia de Software. Queremos entender como estudantes brasileiros organizam suas rotinas de estudo e quais dificuldades enfrentam. São apenas 24 perguntas (~5 min). Suas respostas são anônimas e serão usadas exclusivamente para fins acadêmicos. Obrigado por ajudar!"

## 15.3 Perguntas do Survey

### SEÇÃO 1: Perfil do Estudante

**1. Qual é seu objetivo principal de estudo atualmente?**
*Tipo: Múltipla escolha*
Opções: Concurso público | ENEM/vestibular | Graduação/faculdade | Pós-graduação | Estudo autodidata/certificações | Outro (campo aberto)

**2. Há quanto tempo você mantém uma rotina de estudo?**
*Tipo: Múltipla escolha*
Opções: Menos de 1 mês | 1-3 meses | 3-6 meses | 6-12 meses | Mais de 1 ano

**3. Quantas horas por semana você dedica aos estudos, em média?**
*Tipo: Múltipla escolha*
Opções: Menos de 5h | 5-10h | 10-20h | 20-30h | Mais de 30h

**4. Quantas matérias/disciplinas diferentes você estuda regularmente?**
*Tipo: Múltipla escolha*
Opções: 1-2 | 3-5 | 6-8 | 9+

### SEÇÃO 2: Ferramentas Atuais

**5. Quais ferramentas você usa para organizar seus estudos? (marque todas que se aplicam)**
*Tipo: Caixas de seleção*
Opções: Planilha (Excel/Google Sheets) | Notion/Trello/Todoist | Aplicativo de hábitos (Habitica, Forest, etc.) | Cronograma em papel/caderno | Anki ou similar (revisão espaçada) | Nenhuma — estudo sem organização formal | Outro (campo aberto)

**6. Você usa algum timer/cronômetro para estudar (ex: Pomodoro)?**
*Tipo: Múltipla escolha*
Opções: Sim, sempre | Sim, às vezes | Já tentei mas parei | Nunca usei

**7. Numa escala de 1 a 5, quão satisfeito(a) você está com suas ferramentas atuais de organização de estudo?**
*Tipo: Escala linear*
Opções: 1 (Nada satisfeito) a 5 (Totalmente satisfeito)

### SEÇÃO 3: Dificuldades e Dores

**8. Quais são suas maiores dificuldades na rotina de estudo? (marque até 3)**
*Tipo: Caixas de seleção (max 3)*
Opções: Manter a consistência/disciplina | Saber quanto tempo dedicar a cada matéria | Saber se estou realmente evoluindo | Lidar com distrações | Escolher o que estudar cada dia | Falta de motivação após algumas semanas | Não saber meu melhor horário para estudar | Outro (campo aberto)

**9. Você já abandonou uma rotina de estudo? Se sim, após quanto tempo?**
*Tipo: Múltipla escolha*
Opções: Nunca abandonei | Menos de 1 semana | 1-2 semanas | 2-4 semanas | 1-3 meses | Mais de 3 meses

**10. Qual foi o principal motivo de ter abandonado? (responda mesmo se não abandonou — pense no que poderia te fazer parar)**
*Tipo: Resposta curta (aberta)*

**11. Você sente que estuda muito mas não sabe QUAIS matérias realmente precisam de mais atenção?**
*Tipo: Múltipla escolha*
Opções: Sim, frequentemente | Às vezes | Raramente | Não, sei exatamente onde focar

**12. Você sabe em qual horário do dia você é mais produtivo(a) para estudar?**
*Tipo: Múltipla escolha*
Opções: Sei exatamente | Tenho uma ideia mas nunca medi | Não faço ideia

### SEÇÃO 4: Gamificação e Motivação

**13. Sistemas de pontos, níveis e conquistas (como em jogos) te motivariam a estudar mais consistentemente?**
*Tipo: Múltipla escolha*
Opções: Sim, com certeza | Provavelmente sim | Indiferente | Provavelmente não | Não, acho besteira

**14. Se existisse um 'streak' (dias consecutivos de estudo), isso te motivaria a não pular um dia?**
*Tipo: Múltipla escolha*
Opções: Sim, muito | Um pouco | Indiferente | Não faria diferença

**15. Você gostaria de ter um perfil público mostrando seu progresso de estudos (tipo portfólio de consistência)?**
*Tipo: Múltipla escolha*
Opções: Sim, adoraria compartilhar | Talvez, se fosse opcional | Não, prefiro privacidade total

### SEÇÃO 5: Inteligência Artificial nos Estudos

**16. Se uma IA analisasse seus dados de estudo e dissesse 'Você rende 40% mais entre 20h e 22h', você mudaria sua rotina com base nisso?**
*Tipo: Múltipla escolha*
Opções: Com certeza mudaria | Provavelmente consideraria | Talvez, depende | Não confiaria

**17. Se uma IA detectasse que você está prestes a abandonar sua rotina e te mandasse um alerta motivacional, como você reagiria?**
*Tipo: Múltipla escolha*
Opções: Acharia útil e me motivaria | Acharia ok mas não mudaria meu comportamento | Acharia invasivo | Ignoraria

**18. Qual destes insights de IA seria MAIS útil para você? (escolha 1)**
*Tipo: Múltipla escolha*
Opções: Seu melhor horário para estudar | Quais matérias você precisa reforçar | Previsão de quando você pode desistir | Sugestão de quanto tempo dedicar a cada matéria

### SEÇÃO 6: Interesse no Produto

**19. Se existisse uma plataforma que combinasse registro diário de estudos + gamificação + IA personalizada, você usaria?**
*Tipo: Múltipla escolha*
Opções: Com certeza usaria | Provavelmente testaria | Talvez, depende do preço e UX | Provavelmente não | Não usaria

**20. O que te faria PARAR de usar essa plataforma? (marque até 2)**
*Tipo: Caixas de seleção (max 2)*
Opções: Interface confusa ou feia | Muitas notificações | Ter que pagar | Não ver valor nos insights de IA | Ser muito demorado preencher o registro diário | Outro (campo aberto)

**21. Quanto você pagaria por mês por uma ferramenta dessas?**
*Tipo: Múltipla escolha*
Opções: Nada — só usaria se fosse gratuito | Até R$9,90/mês | R$10-19,90/mês | R$20-29,90/mês | R$30+/mês

**22. Qual funcionalidade seria ESSENCIAL para você? (marque até 3)**
*Tipo: Caixas de seleção (max 3)*
Opções: Timer Pomodoro integrado | Gráficos de evolução por matéria | Sistema de XP e níveis | Insights de IA sobre performance | Streak (dias consecutivos) | Badges/conquistas | Perfil público de progresso | Planejamento automático de grade horária

**23. Em qual plataforma você preferiria usar essa ferramenta?**
*Tipo: Múltipla escolha*
Opções: Navegador (computador) | App celular | Ambos | Tanto faz

**24. Tem algo que não perguntamos e que você gostaria de dizer sobre sua experiência de estudo?**
*Tipo: Resposta longa (aberta)*

> **Análise esperada dos resultados**
>
> → Perguntas 8-12: validam se o problema (inconsistência, cegueira de performance, ausência de contexto BR) é percebido como dor real
>
> → Perguntas 13-15: validam apetite por gamificação no público-alvo
>
> → Perguntas 16-18: validam se IA é percebida como valor ou ruído
>
> → Perguntas 19-23: validam intenção de uso e disposição a pagar (informação para futuro modelo de negócio)
>
> → Pergunta 24: qualitativa aberta — frequentemente gera os melhores insights para o TCC
>
> **META:** se ≥ 60% das respostas nas perguntas 8, 11 e 19 forem positivas, a dor está validada.

---

# 16. O que ainda precisa do Owner do Projeto

Itens que genuinamente não podem ser resolvidos sem ação direta do owner. Ordenados por urgência e impacto.

| # | Item | O que exatamente você precisa fazer | Por que importa | Prazo sugerido |
|---|---|---|---|---|
| 1 | **Aplicar o survey (seção 15)** | Criar o Google Forms com as 24 perguntas. Distribuir em 3+ grupos de WhatsApp/Telegram de estudantes. Coletar 20+ respostas. | Sem isso o TCC não tem validação metodológica. A banca vai questionar. | Antes de começar semana 1 do cronograma |
| 2 | **Migration studiedAt no Prisma** | Executar `prisma migrate` para adicionar o campo `studiedAt` como DateTime obrigatório em StudySession. | Feature de horário ideal e notificações dependem desse campo. Bug silencioso se não corrigido. | Semana 1 do cronograma |
| 3 | **Revisão LGPD com especialista** | Encontrar advogado de dados pessoais ou usar template de Política de Privacidade de startup BR como base mínima. | Exigência legal para qualquer app que coleta dados no Brasil. A banca também avalia isso. | Antes da semana 12 (launch) |
| 4 | **Validar modelo de risco com dados reais** | Após 30+ dias com 50+ usuários beta, rodar cross-validation no modelo de regressão logística e medir precisão. | Modelo treinado em dados sintéticos tem acurácia desconhecida. Essencial para credibilidade do TCC. | Após 30 dias de beta (pós-MVP) |
| 5 | **Definir modelo de monetização** | Pesquisar pricing de Habitica, Anki, similares. Decidir freemium vs assinatura. | Não bloqueia o MVP, mas necessário para escalar e para seção de viabilidade do TCC. | Pode esperar até pós-defesa |

---

*StudyQuest v3.1 — Março 2026*
