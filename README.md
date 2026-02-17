# Ticket Throttle

A high-performance ticket reservation system designed to handle high concurrency using a throttling mechanism with Redis and BullMQ.

## 🚀 Technologies

- **Node.js** & **TypeScript**
- **Express** (API)
- **TypeORM** (PostgreSQL ORM)
- **Redis** (Queue & Caching)
- **BullMQ** (Job Queue)
- **Docker** & **Docker Compose**

## 🛠️ Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

## ⚙️ Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/VitorSMaia/ticket-throttle.git
    cd ticket-throttle
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the root directory (or copy from example if available).
    ```env
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_USER=user
    DB_PASSWORD=password
    DB_NAME=ticket_system

    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    REDIS_PASSWORD=password
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Start Infrastructure:**
    Start PostgreSQL and Redis containers.
    ```bash
    docker compose up -d
    ```

## 🏃‍♂️ Running the Application

This project consists of an API Server and a Worker for processing the queue.

### 1. Start the API Server
The server handles HTTP requests and pushes reservation jobs to the queue.
```bash
npm run server
```
*Server will start on port 3000.*

### 2. Start the Worker
The worker processes reservation jobs from the queue asynchronously.
```bash
npm run worker
```

### 3. Seed Database (Optional)
To populate the database with initial data:
```bash
npm run seed
```

## 🧪 Verification

You can check if the services are running correctly:

- **Healthchecks**: `docker compose ps` to see if `ticket_db` and `ticket_cache` are healthy.
- **Logs**:
    - Server: `🔥 Server rodando na porta 3000`
    - Worker: `🚀 Worker de Ingressos rodando...`
