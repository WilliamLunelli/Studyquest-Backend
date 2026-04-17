# 📚 StudyQuest

> Plataforma de rotinas gamificadas para estudantes brasileiros.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 📖 Sobre o Projeto

O StudyQuest é uma ferramenta web de registro e acompanhamento de estudos desenvolvida especialmente para estudantes brasileiros que estudam de forma independente. Por meio de um formulário simples e rápido, o usuário registra diariamente o que estudou, quanto tempo dedicou e como avalia sua própria produtividade. Com base nesses registros, o StudyQuest transforma os dados em motivação: o estudante acumula pontos de experiência (XP), sobe de nível, mantém sequências de dias consecutivos de estudo e desbloqueia conquistas conforme avança.

### 🎯 Principais Funcionalidades

- **📝 Registro Diário de Estudos**: Formulário simples para registrar matéria, horas, questões e produtividade
- **⚡ Sistema de XP e Níveis**: Pontuação automática baseada nos registros reais do usuário
- **🔥 Streak de Dias Consecutivos**: Acompanhamento de sequências de estudo e recorde histórico
- **🏅 Badges e Conquistas**: Recompensas desbloqueadas automaticamente conforme o progresso
- **📊 Dashboard de Desempenho**: Gráficos e estatísticas sobre hábitos e produtividade
- **🇧🇷 Foco no Brasil**: Desenvolvido para o contexto de concursos, ENEM, graduação e certificações brasileiras

## 👥 Equipe

| Nome                                | Matrícula | Função                            |
| ----------------------------------- | --------- | --------------------------------- |
| William Pereira Lunelli             | 2410735   | Tech Lead / Desenvolvedor Backend |
| Ana Gabrielle de Albuquerque Santos | 2410613   | Desenvolvedora Frontend           |
| Guilherme Sousa Barbosa             | 2410167   | Desenvolvedor Full Stack          |
| André Mendes Carvalho               | 2411585   | Desenvolvedor Backend             |

## 🚀 Tecnologias

### Frontend

- **Next.js** - Framework React com roteamento automático e SSR
- **React** - Biblioteca de construção de interfaces
- **TypeScript** - Superset tipado do JavaScript
- **Tailwind CSS** - Framework de estilização utilitário
- **Recharts** - Biblioteca de gráficos para React

### Backend

- **Node.js** - Runtime JavaScript
- **Express** - Framework web minimalista
- **TypeScript** - Superset tipado do JavaScript
- **PostgreSQL** - Banco de dados relacional
- **Prisma** - ORM moderno para TypeScript
- **JWT** - Autenticação stateless segura
- **Bcrypt** - Hash seguro de senhas
- **Zod** - Validação de schemas
- **Swagger** - Documentação interativa da API

### Ferramentas

- **Figma** - Prototipação de telas
- **Trello** - Gestão de tarefas
- **GitHub** - Versionamento e colaboração
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- [PostgreSQL](https://www.postgresql.org/) (versão 16 ou superior)
- [Git](https://git-scm.com/)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/studyquest.git
cd studyquest
```

### 2. Configure o Backend

```bash
npm install
cp .env.example .env
# Edite o arquivo .env com suas configurações
npx prisma migrate dev
npm run dev
```

### 3. Acesse no navegador

```bash
http://localhost:<PORT>
```

### 4. Acesse a documentação Swagger

```bash
http://localhost:<PORT>/api/docs
```

## 🔑 Variáveis de Ambiente

### Backend — arquivo `.env`

```env
# Servidor
PORT=3333

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/studyquest

# Autenticação
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d
```

### Frontend — arquivo `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## 📁 Estrutura do Projeto

```bash
studyquest/
├── src/
│   ├── config/               # Configurações (banco, swagger)
│   ├── controllers/          # Lógica de controle das rotas
│   ├── middlewares/          # Middlewares (auth, validação)
│   ├── routes/               # Definição das rotas da API
│   ├── services/             # Regras de negócio (XP, badges, streak)
│   ├── types/                # Tipos e extensões do TypeScript
│   ├── utils/                # Funções auxiliares
│   ├── validations/          # Schemas Zod de validação
│   └── index.ts              # Ponto de entrada da aplicação
├── prisma/                   # Schema e migrações do Prisma
├── .env.example              # Template de variáveis de ambiente
└── README.md
```

## 🎮 Scripts Disponíveis

### Backend

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Iniciar servidor em produção
npm start

# Executar migrações do banco
npx prisma migrate dev

# Abrir Prisma Studio (visualizador do banco)
npx prisma studio
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm start
```

## 📊 Modelo de Dados

### Entidades Principais

- **User**: Dados do usuário, XP total, nível atual, streak e objetivo acadêmico
- **StudySession**: Registros diários de estudo com matéria, horas, questões e produtividade
- **Subject**: Catálogo de matérias disponíveis por objetivo acadêmico
- **Badge**: Catálogo de conquistas disponíveis com critérios de desbloqueio
- **UserBadge**: Relação entre usuário e badges conquistados com data de conquista

## 🛣️ Roadmap

### ✅ Fase 1 — Planejamento e Documentação (Em andamento)

- [x] Definição do produto e proposta de valor
- [x] Levantamento de requisitos funcionais e não funcionais
- [x] Regras de negócio documentadas
- [x] Prototipação das telas no Figma
- [x] Diagramas de arquitetura, casos de uso e modelo de dados

### 🔄 Fase 2 — Autenticação e Base

- [ ] Telas de cadastro e login no frontend
- [x] Endpoints de autenticação com JWT no backend
- [ ] Integração frontend ↔ backend
- [x] Configuração do banco de dados e migrações

### 📅 Fase 3 — Core do Produto

- [x] Endpoint de criação de sessão de estudos (`POST /api/registros`)
- [x] Endpoint de listagem de sessões (`GET /api/registros`)
- [x] Cálculo automático de XP
- [ ] Sistema de streak
- [ ] Dashboard básico com resumo do perfil

### 🚀 Fase 4 — Gamificação e Analytics

- [ ] Sistema completo de badges
- [ ] Dashboard com gráficos de desempenho
- [ ] Edição de perfil
- [ ] Histórico de registros

### 🤖 Fase 5 — Extensões Futuras

- [ ] Recomendações personalizadas com IA
- [ ] Feed social e sistema de amigos
- [ ] Aplicativo mobile (React Native)
- [ ] Rankings e desafios comunitários

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
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

Este projeto foi desenvolvido para fins acadêmicos como parte do Projeto Integrador do curso de Análise e Desenvolvimento de Sistemas.

## 👤 Autores

Desenvolvido com 💙 pela equipe StudyQuest

## 📞 Contato

- **William Lunelli** — [LinkedIn](https://linkedin.com/in/william-lunelli-6b1448300) · [Instagram](https://www.instagram.com/william_lunelli/) · williamlunelli07@gmail.com

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!

## 🙏 Agradecimentos

- Comunidade de estudantes brasileiros que inspirou o produto
- Professores e orientadores do curso
- Todos que contribuíram com feedback e ideias ao longo do desenvolvimento

---

**StudyQuest** - Transformando a rotina de estudos em uma jornada gamificada 🎮📚
