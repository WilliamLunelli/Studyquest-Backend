# 🎮 PlatinaBR

> Rede social de jogos focada em competição, conquistas e comunidade brasileira de gamers.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 📖 Sobre o Projeto

PlatinaBR é uma plataforma social que integra conquistas de múltiplas plataformas de jogos (Steam, Epic Games, PlayStation, Xbox) com um robusto sistema de competição, comunidade e progressão gamificada.

### 🎯 Principais Funcionalidades

- **🏆 Importação de Conquistas**: Sincronização automática com Steam, Epic Games e outras plataformas
- **⚔️ Sistema de Competição**: Desafios semanais, mensais e rankings em tempo real
- **📊 Progressão Gamificada**: Sistema de XP, níveis, badges e recompensas
- **👥 Comunidade Ativa**: Feed social, fóruns de ajuda e guias em português
- **🇧🇷 Foco no Brasil**: Primeira rede social de jogos totalmente em português brasileiro

## 🚀 Tecnologias

### Backend

- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Express** - Framework web minimalista
- **PostgreSQL** - Banco de dados relacional
- **Redis** - Cache e rankings em tempo real
- **Prisma** - ORM moderno para TypeScript

### Ferramentas

- **tsx** - Execução de TypeScript em desenvolvimento
- **dotenv** - Gerenciamento de variáveis de ambiente
- **helmet** - Segurança para Express

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [PostgreSQL](https://www.postgresql.org/) (versão 14 ou superior)
- [Redis](https://redis.io/) (versão 6 ou superior)
- [Git](https://git-scm.com/)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/platinabr-backend.git
cd platinabr-backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
PORT=3000

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/platinabr

# Redis
REDIS_URL=redis://localhost:6379

# APIs Externas
STEAM_API_KEY=sua_chave_steam_aqui
EPIC_API_KEY=sua_chave_epic_aqui

# JWT
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d
```

### 4. Execute as migrações do banco

```bash
npm run migrate
```

### 5. Inicie o servidor

#### Modo Desenvolvimento

```bash
npm run dev
```

#### Modo Produção

```bash
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
platinabr-backend/
├── src/
│   ├── config/          # Configurações da aplicação
│   ├── controllers/     # Lógica de controle das rotas
│   ├── middlewares/     # Middlewares (auth, validação, etc)
│   ├── models/          # Schemas e interfaces do banco
│   ├── routes/          # Definição das rotas da API
│   ├── services/        # Integrações externas (Steam, Epic, etc)
│   ├── utils/           # Funções auxiliares
│   └── index.ts         # Ponto de entrada da aplicação
├── prisma/              # Schema e migrações do Prisma
├── public/              # Arquivos estáticos
├── .env.example         # Template de variáveis de ambiente
├── .gitignore           # Arquivos ignorados pelo Git
├── package.json         # Dependências e scripts
├── tsconfig.json        # Configuração do TypeScript
└── README.md            # Este arquivo
```

## 🎮 Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Iniciar servidor em produção
npm start

# Executar migrações do banco
npm run migrate

# Gerar Prisma Client
npm run prisma:generate

# Abrir Prisma Studio (visualizador do banco)
npm run prisma:studio
```

## 🔑 Obtendo API Keys

### Steam Web API

1. Acesse [Steam Web API Key](https://steamcommunity.com/dev/apikey)
2. Faça login com sua conta Steam
3. Registre um novo domínio
4. Copie a chave gerada para `.env`

### Epic Games API

1. Acesse [Epic Games Dev Portal](https://dev.epicgames.com/)
2. Crie uma nova aplicação
3. Configure OAuth e permissões
4. Copie as credenciais para `.env`

## 📊 Banco de Dados

### Modelos Principais

- **User**: Informações do usuário
- **Achievement**: Conquistas importadas das plataformas
- **Challenge**: Desafios semanais/mensais
- **Badge**: Badges e recompensas da plataforma
- **Post**: Posts do feed social
- **Follow**: Relacionamento entre usuários

## 🛣️ Roadmap

### ✅ Fase 1 - MVP (Em Desenvolvimento)

- [x] Configuração inicial do projeto
- [x] Servidor Express básico
- [ ] Autenticação com JWT
- [ ] Integração com Steam API
- [ ] CRUD de usuários
- [ ] Sistema básico de XP

### 🔄 Fase 2 - Funcionalidades Core

- [ ] Feed social
- [ ] Sistema de follow/unfollow
- [ ] Importação automática de conquistas
- [ ] Primeiro desafio semanal
- [ ] Rankings básicos

### 📅 Fase 3 - Expansão

- [ ] Integração com Epic Games
- [ ] Sistema de badges
- [ ] Fórum de ajuda
- [ ] Customização de perfil
- [ ] App mobile (React Native)

### 🚀 Fase 4 - Avançado

- [ ] PlayStation/Xbox APIs
- [ ] Sistema de ligas
- [ ] Torneios premium
- [ ] Marketplace
- [ ] Integrações com streamers

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature incrível'`)
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

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

Desenvolvido com 💜 por William Lunelli

## 📞 Contato

- Email: williamlunelli07@gmail.com
- LinkedIn: (https://linkedin.com/in/william-lunelli-6b1448300)
- Instagram: (https://www.instagram.com/william_lunelli/)

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!

## 🙏 Agradecimentos

- Comunidade de gamers brasileiros
- Desenvolvedores de jogos indie nacionais
- Todos que contribuíram com feedback e ideias

---

**PlatinaBR** - A primeira rede social de jogos feita por gamers brasileiros, para gamers brasileiros 🇧🇷🎮
