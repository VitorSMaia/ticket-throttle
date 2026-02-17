# Ticket Throttle

Sistema de compra de ingressos de alta performance, projetado para lidar com alta concorrência usando throttling com Redis e BullMQ, pagamento via Stripe e expiração automática de reservas.

---

## 🧠 Práticas de Desenvolvimento Sênior

> Este projeto, apesar de pequeno em escopo, foi construído com práticas de engenharia encontradas em sistemas de produção de alta escala. Abaixo estão os pontos técnicos que elevam o padrão acima de um CRUD convencional.

### 🏛️ Arquitetura & Padrões de Design

| Prática | Implementação | Por que é Sênior |
|---|---|---|
| **MVC com Separation of Concerns** | `controllers/`, `routes/`, `entities/`, `services/`, `middlewares/`, `config/` | Cada camada tem responsabilidade única. Controllers não conhecem infraestrutura, routes não contêm lógica, services encapsulam integrações externas. |
| **Event-Driven Architecture** | BullMQ Worker como processo separado (`worker.ts`) | O processamento de reservas é desacoplado da API via fila de mensagens. O worker pode escalar independentemente do server. |
| **Webhook-Driven Payment Flow** | Stripe Webhooks (`webhooks.ts`) | O pagamento é confirmado via webhook do Stripe (server-to-server), não pela resposta do frontend — padrão obrigatório em sistemas financeiros reais. |
| **Idempotency Pattern** | Middleware `idempotencyShield` com tabela `idempotency_keys` | Requisições duplicadas (double-click, retry de rede) retornam a mesma resposta sem reprocessar — padrão usado por Stripe, AWS e APIs financeiras. |

### 🔒 Concorrência & Integridade de Dados

| Prática | Implementação | Por que é Sênior |
|---|---|---|
| **Pessimistic Locking** | `lock: { mode: 'pessimistic_write' }` no checkout e no worker | Impede que dois processos simultâneos reservem o mesmo ingresso. Resolve o clássico problema de *overselling* em e-commerce. |
| **Transações Atômicas** | `dataSource.transaction()` no checkout, webhook e worker | Todas as operações críticas (reserva, pagamento, expiração) são atômicas — ou tudo acontece, ou nada acontece. Sem estados intermediários corrompidos. |
| **Scheduled Job Expiration** | BullMQ delayed jobs de 15 minutos (`scheduleExpirationCheck`) | Reservas não pagas expiram automaticamente sem polling. O job verifica com lock pessimista se o ticket ainda está RESERVED antes de liberar. |
| **Enum Tipado no Banco** | `Ticket.status` como `type: 'enum'` PostgreSQL | Impede estados inválidos no nível do banco de dados. Um typo como `'AVALIABLE'` gera erro em vez de corromper dados silenciosamente. |

### 🛡️ Segurança & Resiliência

| Prática | Implementação | Por que é Sênior |
|---|---|---|
| **Stripe Webhook Signature Verification** | `stripe.webhooks.constructEvent()` com `STRIPE_WEBHOOK_SECRET` | Valida que o webhook realmente veio do Stripe, impedindo fraude por chamadas HTTP forjadas. |
| **Server-Side Ticket Selection** | Backend seleciona tickets disponíveis, não o frontend | O frontend envia apenas `eventName` + `quantity`. O backend decide quais IDs reservar dentro da transação — elimina manipulação de IDs pelo cliente. |
| **Environment Variables para Secrets** | `.env` para Stripe keys, DB credentials, Redis password | Nenhuma credencial hardcoded no código. `.env` está no `.gitignore`. Frontend usa `VITE_STRIPE_PUB_KEY` via `import.meta.env`. |
| **Raw Body para Webhooks** | Webhook router registrado **antes** de `express.json()` | O Stripe exige o body raw para verificar a assinatura. Ordem de middleware é crítica e facilmente esquecida. |

### ⚡ Frontend & Estado

| Prática | Implementação | Por que é Sênior |
|---|---|---|
| **Zustand com Estado Imutável** | `cartStore.ts` com `create<CartStore>()` | Estado global tipo-safe com TypeScript, sem boilerplate de Redux. Ações puras, sem side-effects no store. |
| **Optimistic UI + Polling** | `CartDrawer` faz polling de reservas ativas a cada 5s | O frontend adiciona ao carrinho otimisticamente e sincroniza com o backend via polling, mostrando reservas reais com timer de expiração. |
| **Auto-Refresh por State Key** | `refreshKey` no Zustand incrementa ao limpar o carrinho | Após pagamento bem-sucedido, a listagem de eventos refaz o fetch automaticamente sem `window.location.reload()`. |
| **Centralized API Config** | `config.ts` com `API_URL` via env var | Uma única fonte de verdade para a URL do backend. Trocar de dev para staging é uma variável de ambiente, não um find-and-replace. |

---

### 🏆 Top 5 — Destaques Técnicos

> **1. Pessimistic Lock + Transação Atômica no Checkout**
> O checkout usa `FOR UPDATE` no PostgreSQL dentro de uma transação. Dois requests simultâneos para o último ingresso: um ganha, outro recebe `409 Conflict`. Zero overselling.

> **2. Event-Driven com Worker Desacoplado**
> A API enfileira jobs, o worker processa. São processos diferentes que podem escalar independentemente. A fila no Redis garante que nenhuma reserva é perdida mesmo se o worker cair.

> **3. Idempotency Shield**
> O middleware intercepta `res.json()`, salva a resposta no banco e retorna o cache em requests duplicados. Mesmo padrão que a API do Stripe usa internamente.

> **4. Webhook-Driven Payment (não Frontend-Driven)**
> O frontend não decide se o pagamento foi aprovado. O Stripe envia um webhook server-to-server, verificado por assinatura criptográfica. Só então o ticket vira `SOLD`.

> **5. Expiração Automática com Job Scheduled**
> Cada reserva agenda um job delayed de 15 minutos no BullMQ. Se o pagamento não vier, o job libera o ticket com lock pessimista — sem cron jobs globais, sem polling do banco.

---

## 🏗️ Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│   Frontend  │────▶│  API Server  │────▶│  BullMQ   │────▶│  Worker  │
│  React/Vite │     │   Express    │     │   Redis   │     │ Reservas │
└─────────────┘     └──────┬───────┘     └───────────┘     └──────────┘
                           │
                    ┌──────┴───────┐
                    │  PostgreSQL  │
                    │   TypeORM    │
                    └──────────────┘
```

### Fluxo de Compra

1. **Listagem por Eventos** — `GET /tickets/events` agrupa ingressos por evento e retorna disponibilidade
2. **Seleção de Quantidade** — Usuário escolhe quantos ingressos (limitado ao estoque)
3. **Checkout com Lock** — Backend seleciona N ingressos com `FOR UPDATE`, cria PaymentIntent no Stripe
4. **Reserva Atômica** — Tickets marcados como `RESERVED` na mesma transação + expiração agendada
5. **Pagamento Stripe** — Frontend abre modal com Stripe Elements para pagamento seguro
6. **Confirmação via Webhook** — Stripe envia `payment_intent.succeeded`, ingressos marcados como `SOLD`
7. **Expiração** — Reservas não pagas expiram em 15 minutos (job delayed no BullMQ)

## 🚀 Tecnologias

### Backend
| Tecnologia | Uso |
|---|---|
| **Node.js** + **TypeScript** | Runtime e tipagem estática |
| **Express** | API REST |
| **TypeORM** + **PostgreSQL** | ORM com transações e locking |
| **BullMQ** + **Redis** | Fila de jobs assíncronos |
| **Stripe** | Gateway de pagamento + Webhooks |

### Frontend
| Tecnologia | Uso |
|---|---|
| **React 19** + **TypeScript** | UI reativa com tipagem |
| **Vite** | Build tool e HMR |
| **Tailwind CSS 4** | Estilização utilitária |
| **Zustand** | Estado global tipado |
| **Stripe React SDK** | Modal de pagamento seguro |
| **Lucide React** | Ícones |

## 🛠️ Pré-requisitos

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (v18+)
- Conta [Stripe](https://stripe.com/) (chaves de teste)

## ⚙️ Setup

### 1. Clone o repositório
```bash
git clone https://github.com/VitorSMaia/ticket-throttle.git
cd ticket-throttle
```

### 2. Configuração do `.env`

**Backend** (raiz do projeto):
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=ticket_system

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=password

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Frontend** (`frontend/.env`):
```env
VITE_STRIPE_PUB_KEY="pk_test_..."
VITE_API_URL=http://localhost:3000
```

### 3. Instale as dependências
```bash
npm install
cd frontend && npm install
```

### 4. Suba a infraestrutura
```bash
docker compose up -d
```

## 🏃‍♂️ Executando

São necessários **3 terminais**:

```bash
# Terminal 1 — API Server (porta 3000)
npm run server

# Terminal 2 — Worker (processa fila de reservas)
npm run worker

# Terminal 3 — Frontend (porta 5173)
cd frontend && npm run dev
```

### Seed (Opcional)
```bash
npm run seed
```

## 📁 Estrutura do Projeto

```
ticket-throttle/
├── src/
│   ├── config/          # db.ts, queue.ts
│   ├── controllers/     # TicketController (checkout, reserve, cart, paid)
│   ├── entities/        # Ticket (enum status), IdempotencyKey
│   ├── middlewares/     # idempotencyShield
│   ├── routes/          # ticket.routes, webhooks
│   ├── services/        # stripe.service.ts
│   ├── server.ts        # Express API (entry point)
│   ├── worker.ts        # BullMQ Worker (processo separado)
│   └── seed.ts          # Seed de dados
├── frontend/
│   └── src/
│       ├── components/  # EventCard, EventDetail, CartDrawer, PaymentModal, MyTickets, Toast
│       ├── store/       # cartStore.ts (Zustand)
│       ├── config.ts    # API_URL centralizado
│       └── App.tsx      # Navegação por tabs
├── docker-compose.yml
├── .env
└── frontend/.env
```

## 🔌 API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/tickets` | Lista todos os ingressos disponíveis |
| `GET` | `/tickets/events` | Lista eventos agrupados com disponibilidade |
| `POST` | `/tickets/batch` | Gera ingressos em lote (admin) |
| `POST` | `/tickets/reserve` | Reserva ingresso individual + Stripe |
| `POST` | `/tickets/checkout` | Checkout do carrinho (transação + lock) |
| `GET` | `/tickets/cart/:userId` | Reservas ativas do usuário |
| `GET` | `/tickets/paid/:userId` | Ingressos pagos (status SOLD) |
| `POST` | `/webhooks/stripe` | Webhook do Stripe (signature verified) |

## 🧪 Teste de Pagamento

Use o cartão de teste do Stripe:
```
Número: 4242 4242 4242 4242
Validade: qualquer data futura
CVC: qualquer 3 dígitos
```

## ✅ Verificação

```bash
# Containers rodando
docker compose ps

# Logs esperados
Server: 🔥 Server rodando na porta 3000
Worker: 🚀 Worker de Ingressos rodando...
```
