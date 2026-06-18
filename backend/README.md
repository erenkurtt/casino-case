# Casino Game Platform Backend

This is the backend service for the Casino Game Platform full-stack assessment.

The backend is built with **NestJS**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.
It provides REST APIs for game listing, backend-powered search, JWT authentication, favorite games, protected slot machine gameplay, spin history, security middleware, Swagger API documentation, and database persistence.

## Table of Contents

* [Tech Stack](#tech-stack)
* [Main Features](#main-features)
* [Project Structure](#project-structure)
* [Environment Variables](#environment-variables)
* [Local Setup](#local-setup)
* [Docker PostgreSQL Setup](#docker-postgresql-setup)
* [Prisma Commands](#prisma-commands)
* [Running the Backend](#running-the-backend)
* [Swagger API Documentation](#swagger-api-documentation)
* [Authentication Flow](#authentication-flow)
* [API Endpoints](#api-endpoints)
* [Slot Machine Rules](#slot-machine-rules)
* [Database Design](#database-design)
* [Search Optimization](#search-optimization)
* [Middleware and Security](#middleware-and-security)
* [Testing](#testing)
* [Build](#build)
* [Deployment Notes](#deployment-notes)
* [AI Usage Disclosure](#ai-usage-disclosure)

## Tech Stack

* Node.js
* NestJS
* TypeScript
* PostgreSQL
* Prisma ORM
* JWT Authentication
* bcryptjs
* Docker / Docker Compose
* Swagger / OpenAPI
* Jest

## Main Features

### Game Listing

* Serves game data through a REST API.
* Game data is imported from `game-data.json` into PostgreSQL.
* Supports pagination.
* Supports backend search.
* Supports filtering by provider, country, game type, and active status.
* Supports sorting.
* Uses optimized PostgreSQL indexes for scalable search.

### Search Functionality

* Search is performed on the backend.
* Frontend uses debouncing to reduce unnecessary requests.
* Backend validates query parameters.
* Backend includes caching and database indexes to reduce load.

### Authentication

* User registration.
* User login.
* Password hashing with bcryptjs.
* JWT-based authentication.
* Protected endpoints using JWT guard.
* Authenticated user profile endpoint.

### Slot Machine

* Only authenticated users can spin.
* Newly registered users start with 20 coins.
* User can select a bet amount between 0.50 and 5.00 coins.
* Bet amount increases in 0.50 increments.
* Every spin updates the user's balance.
* Every spin is permanently stored in PostgreSQL.
* Spin history includes reel results, bet amount, win/loss amount, balance before and after, timestamp, and optional game ID.

### Favorite Games

* Authenticated users can add games to favorites.
* Authenticated users can remove games from favorites.
* Authenticated users can list their favorite games.
* Favorite games are stored in a normalized join table.

### Currency Conversion

Currency conversion is implemented on the frontend using an external exchange-rate API.

The backend stores balance only in coins.
Currency conversion is for display purposes only and does not modify the stored user balance.

### API Documentation

Swagger documentation is available at:

```text
http://localhost:3000/api
```

## Project Structure

```text
backend
├── prisma
│   ├── migrations
│   ├── seed-data
│   ├── schema.prisma
│   └── seed.ts
├── scripts
│   ├── setup-linux.sh
│   └── setup-windows.ps1
├── src
│   ├── auth
│   │   ├── constants
│   │   ├── decorators
│   │   ├── dto
│   │   ├── guards
│   │   ├── types
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── common
│   │   ├── filters
│   │   └── middleware
│   ├── favorites
│   │   ├── dto
│   │   ├── favorites.controller.ts
│   │   ├── favorites.module.ts
│   │   └── favorites.service.ts
│   ├── games
│   │   ├── dto
│   │   ├── games.controller.ts
│   │   ├── games.module.ts
│   │   └── games.service.ts
│   ├── generated
│   │   └── prisma
│   ├── prisma
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── slot
│   │   ├── dto
│   │   ├── types
│   │   ├── slot.controller.ts
│   │   ├── slot-machine.service.ts
│   │   ├── slot.module.ts
│   │   └── slot.service.ts
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── package.json
├── prisma.config.ts
└── README.md
```

## Environment Variables

Create a `.env` file in the backend root directory.

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/game_platform_db?schema=public"
JWT_SECRET="change-this-secret-in-production"
PORT=3000
```

A sample file should be provided as:

```text
backend/.env.example
```

For production, use a strong `JWT_SECRET` and a production PostgreSQL connection string.

## Local Setup

### Linux / WSL

From the project root:

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

If the setup script is available:

```bash
cd backend
chmod +x scripts/setup-linux.sh
./scripts/setup-linux.sh
```

### Windows PowerShell

From the project root:

```powershell
cd backend
Copy-Item .env.example .env
npm install
docker compose up -d
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

If the setup script is available:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

## Docker PostgreSQL Setup

The backend uses PostgreSQL as the primary database.

Start PostgreSQL:

```bash
docker compose up -d
```

Check running containers:

```bash
docker ps
```

Stop PostgreSQL:

```bash
docker compose down
```

Default local database configuration:

```text
Host: localhost
Port: 5432
Database: game_platform_db
Username: postgres
Password: postgres
```

## Prisma Commands

Generate Prisma client:

```bash
npx prisma generate
```

Create and apply migrations:

```bash
npx prisma migrate dev
```

Check migration status:

```bash
npx prisma migrate status
```

Seed database:

```bash
npx prisma db seed
```

Open Prisma Studio:

```bash
npx prisma studio
```

Reset database during local development:

```bash
npx prisma migrate reset
```

## Running the Backend

Development mode:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

Default API URL:

```text
http://localhost:3000
```

## Swagger API Documentation

Swagger UI is available at:

```text
http://localhost:3000/api
```

JWT-protected endpoints can be tested from Swagger by clicking **Authorize** and entering the JWT access token returned by `/auth/login`.

When using Swagger Authorize, paste only the token value. Swagger will add the `Bearer` prefix automatically.

## Authentication Flow

1. Register a user with:

```http
POST /auth/register
```

2. Login with:

```http
POST /auth/login
```

3. Copy the returned `accessToken`.

4. Use it in protected requests:

```http
Authorization: Bearer <access_token>
```

Protected endpoints:

```text
GET    /auth/me
GET    /favorites
POST   /favorites/:gameId
DELETE /favorites/:gameId
POST   /slot/spin
GET    /slot/history
```

## API Endpoints

### Auth

#### Register

```http
POST /auth/register
```

Request body:

```json
{
  "email": "eren@test.com",
  "username": "eren",
  "password": "Password123",
  "countryId": "optional-country-uuid"
}
```

Response:

```json
{
  "user": {
    "id": "user-uuid",
    "email": "eren@test.com",
    "username": "eren",
    "balance": 20,
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt-token"
}
```

#### Login

```http
POST /auth/login
```

Request body:

```json
{
  "email": "eren@test.com",
  "password": "Password123"
}
```

Response:

```json
{
  "user": {
    "id": "user-uuid",
    "email": "eren@test.com",
    "username": "eren",
    "balance": 20,
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt-token"
}
```

#### Get Authenticated User

```http
GET /auth/me
```

Requires JWT.

Response:

```json
{
  "id": "user-uuid",
  "email": "eren@test.com",
  "username": "eren",
  "balance": 20,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### Games

#### List Games

```http
GET /games
```

Query parameters:

```text
page
limit
search
providerName
country
gameType
isActive
sortBy
sortOrder
```

Example:

```http
GET /games?page=1&limit=20&search=fire&providerName=BGaming&sortBy=createdAt&sortOrder=desc
```

Response:

```json
{
  "data": [
    {
      "id": "game-uuid",
      "externalId": 9150,
      "name": "Fire Lightning",
      "slug": "fire-lightning",
      "providerName": "BGaming",
      "thumbnailUrl": "https://example.com/image.webp",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "casino": {
        "id": "casino-uuid",
        "name": "Default Casino"
      },
      "gameType": {
        "id": "game-type-uuid",
        "name": "Slot",
        "slug": "slot"
      },
      "countries": [
        {
          "id": "country-uuid",
          "isoCode": "TR",
          "name": "Türkiye"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 78,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "sortBy": "createdAt",
    "sortOrder": "desc",
    "cacheHit": false
  },
  "filters": {
    "search": "fire",
    "providerName": "BGaming",
    "country": null,
    "gameType": null,
    "isActive": true
  }
}
```

### Favorites

All favorite endpoints require JWT.

#### List Favorite Games

```http
GET /favorites?page=1&limit=20
```

Response:

```json
{
  "data": [
    {
      "favoritedAt": "2026-01-01T00:00:00.000Z",
      "game": {
        "id": "game-uuid",
        "externalId": 9150,
        "name": "Fire Lightning",
        "slug": "fire-lightning",
        "providerName": "BGaming",
        "thumbnailUrl": "https://example.com/image.webp",
        "isActive": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

#### Add Favorite Game

```http
POST /favorites/:gameId
```

Example:

```http
POST /favorites/b0f8f3d2-5a41-4f5a-b7e6-7baf4a2c1234
```

Response:

```json
{
  "message": "Game added to favorites",
  "favoritedAt": "2026-01-01T00:00:00.000Z",
  "game": {
    "id": "game-uuid",
    "externalId": 9150,
    "name": "Fire Lightning",
    "slug": "fire-lightning",
    "providerName": "BGaming",
    "thumbnailUrl": "https://example.com/image.webp",
    "isActive": true
  }
}
```

#### Remove Favorite Game

```http
DELETE /favorites/:gameId
```

Example:

```http
DELETE /favorites/b0f8f3d2-5a41-4f5a-b7e6-7baf4a2c1234
```

Response:

```json
{
  "message": "Game removed from favorites",
  "gameId": "game-uuid"
}
```

### Slot Machine

#### Get Bet Options

```http
GET /slot/bet-options
```

Response:

```json
{
  "min": 0.5,
  "max": 5,
  "step": 0.5,
  "options": [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
}
```

#### Spin

```http
POST /slot/spin
```

Requires JWT.

Request body:

```json
{
  "betAmount": 1,
  "gameId": "optional-game-uuid"
}
```

Response:

```json
{
  "spinId": "spin-uuid",
  "roundId": "round-uuid",
  "reels": ["cherry", "cherry", "lemon"],
  "betAmount": 1,
  "winAmount": 40,
  "amountWonLost": 39,
  "balanceBefore": 20,
  "balanceAfter": 59,
  "updatedBalance": 59,
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

#### Spin History

```http
GET /slot/history?page=1&limit=20
```

Requires JWT.

Response:

```json
{
  "data": [
    {
      "id": "spin-uuid",
      "roundId": "round-uuid",
      "reels": ["apple", "apple", "banana"],
      "betAmount": 1,
      "winAmount": 10,
      "amountWonLost": 9,
      "balanceBefore": 20,
      "balanceAfter": 29,
      "game": {
        "id": "game-uuid",
        "name": "Fire Lightning",
        "slug": "fire-lightning",
        "thumbnailUrl": "https://example.com/image.webp"
      },
      "spunAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Slot Machine Rules

The slot machine consists of three reels with fixed symbols.

### Reel 1

```json
["cherry", "lemon", "apple", "lemon", "banana", "banana", "lemon", "lemon"]
```

### Reel 2

```json
["lemon", "apple", "lemon", "lemon", "cherry", "apple", "banana", "lemon"]
```

### Reel 3

```json
["lemon", "apple", "lemon", "apple", "cherry", "lemon", "banana", "lemon"]
```

For each spin, the backend randomly selects one symbol from each reel.

The selected result is ordered from left to right:

```text
Reel 1 → Reel 2 → Reel 3
```

### Winning Rules

```text
3 cherries  => bet amount x 50
2 cherries  => bet amount x 40

3 apples    => bet amount x 20
2 apples    => bet amount x 10

3 bananas   => bet amount x 15
2 bananas   => bet amount x 5

3 lemons    => bet amount x 3
```

There is no payout for two lemons.

### Matching Rules

A match is only valid when symbols appear consecutively from left to right, starting with Reel 1.

Examples:

```text
Apple, Cherry, Apple     => No win
Apple, Apple, Cherry     => Win, 2 apples
Cherry, Cherry, Lemon    => Win, 2 cherries
Banana, Banana, Banana   => Win, 3 bananas
Lemon, Lemon, Lemon      => Win, 3 lemons
Lemon, Lemon, Apple      => No win
```

Only the highest applicable payout is awarded. Payouts are not cumulative.

### Balance Update Formula

```text
new_balance = previous_balance - bet_amount + winnings
```

The selected bet amount is deducted before calculating winnings.

If the user does not have sufficient balance, the spin is rejected.

## Database Design

The database is normalized around the following entities:

```text
Users
Casinos
Games
Game Types
Countries
Game Countries
User Favorite Games
Spin History
```

Main relationships:

```text
A casino contains multiple games.
Each game belongs to one game type.
Games can be available in multiple countries.
Users can favorite multiple games.
Every spin is permanently recorded.
Spin history belongs to a user and can optionally belong to a game.
```

Detailed ER diagram, SQL CREATE TABLE statements, primary keys, foreign keys, indexes, and constraints are documented in:

```text
../docs/database-schema.md
```

## Search Optimization

The game search endpoint is optimized using multiple techniques.

### Frontend Debouncing

The frontend waits before sending search requests while the user types.
This reduces unnecessary API calls.

### Backend Validation

Query parameters are validated with `class-validator` and `class-transformer`.

Examples:

```text
page must be a positive integer
limit must be between 1 and 50
search must be at least 2 characters
sortBy must be one of the allowed values
sortOrder must be asc or desc
```

### Pagination

The backend returns paginated data instead of loading all games at once.

### In-Memory Cache

Repeated game listing requests are cached for a short period to reduce repeated database queries.

### PostgreSQL Indexing

The backend uses PostgreSQL indexes and trigram search indexes.

Example:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_games_name_trgm
ON games USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_games_slug_trgm
ON games USING GIN (slug gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_games_provider_name_trgm
ON games USING GIN (provider_name gin_trgm_ops);
```

Additional indexes are used for active games, provider filtering, creation date sorting, spin history lookups, and favorite game lookups.

## Middleware and Security

The backend includes several security and robustness features.

### Implemented Middleware / Guards / Pipes

* Helmet security headers.
* CORS configuration.
* Global validation pipe.
* Request body whitelist.
* Rejection of unknown request fields.
* JWT authentication guard.
* Rate limiting with NestJS throttler.
* Request logging middleware.
* Centralized HTTP exception filter.

### Validation

All request bodies and query parameters are validated.

Examples:

* Email must be valid.
* Password must be at least 8 characters.
* Username must have valid characters.
* Bet amount must be between 0.50 and 5.00.
* Bet amount must be one of the allowed 0.50 increment options.
* UUID path parameters are validated.
* Pagination values are validated.

### Password Security

Passwords are never stored as plain text.
They are hashed with bcryptjs before being saved in the database.

### Authentication

Protected endpoints require a valid JWT access token.

Invalid or missing tokens return an unauthorized response.

## Error Handling

The backend uses a centralized HTTP exception filter to return consistent error responses.

Example:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Missing or invalid Authorization header",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/slot/spin"
}
```

## Testing

Run all tests:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:cov
```

Run a specific test file:

```bash
npm run test -- auth.service.spec.ts
```

The backend test suite covers:

```text
AuthService
AuthController
JwtAuthGuard
GamesService
GamesController
SlotMachineService
SlotService
SlotController
FavoritesService
FavoritesController
```

Covered scenarios include:

* User registration.
* Duplicate user prevention.
* User login.
* Invalid credential handling.
* JWT guard behavior.
* Game listing.
* Search/filter/pagination.
* Favorite game add/remove/list.
* Slot payout rules.
* Lemon, Lemon, Apple no-win rule.
* Insufficient balance handling.
* Balance update after spin.
* Permanent spin history creation.
* Controller-to-service integration.

## Build

Create production build:

```bash
npm run build
```

Run production build:

```bash
npm run start:prod
```

## Local Development Checklist

```bash
docker compose up -d
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run test
npm run start:dev
```

Then open:

```text
http://localhost:3000/api
```

## Deployment Notes

The backend can be deployed to cloud platforms such as:

```text
Render
Railway
AWS
Azure
Google Cloud Platform
```

Recommended deployment setup:

```text
Backend API: Render / Railway / AWS / Azure / GCP
Database: Managed PostgreSQL, Neon, Railway PostgreSQL, Render PostgreSQL
Frontend: Vercel / Netlify / Cloud provider static hosting
```

Required production environment variables:

```env
DATABASE_URL="production-postgresql-url"
JWT_SECRET="strong-production-secret"
PORT=3000
```

Production recommendations:

* Use a managed PostgreSQL database.
* Use a strong JWT secret.
* Do not commit `.env`.
* Run Prisma migrations during deployment.
* Configure CORS for the deployed frontend URL.
* Use HTTPS.
* Store secrets in the cloud provider's secret manager.
* Avoid using development credentials in production.

## AI Usage Disclosure

AI-assisted tools were used during development.

They helped with:

* Planning the backend architecture.
* Reviewing database relationships.
* Creating NestJS module/service/controller structures.
* Drafting DTO validation patterns.
* Drafting unit test cases.
* Debugging Prisma, ESM/CommonJS, Windows, and WSL environment issues.
* Improving Swagger documentation.
* Improving README and project documentation.

All generated code was reviewed, tested, modified, and adapted manually before being used.

The final implementation decisions, endpoint behavior, database schema, validation rules, and test results were verified during development.

## Notes

This backend was developed as part of a full-stack JavaScript developer assessment.

It focuses on:

* Clean architecture.
* Normalized relational database design.
* Secure authentication.
* Validated REST API design.
* Search scalability.
* Persistent slot machine transaction history.
* Clear documentation and test coverage.
