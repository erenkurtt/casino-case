# Casino Game Platform Backend

A production-oriented backend API for a casino game platform.
The project includes game listing, search/filter/sort/pagination, JWT authentication, favorite games, and an authenticated slot machine system with persistent spin history.

## Tech Stack

* Node.js
* NestJS
* TypeScript
* PostgreSQL
* Prisma ORM
* JWT Authentication
* Docker / Docker Compose
* Swagger / OpenAPI
* Jest

## Features

### Game Listing

* List all games
* Search by name, slug, or provider
* Filter by provider, country, game type, and active status
* Pagination
* Sorting
* Lightweight in-memory cache
* PostgreSQL indexes for optimized search

### Authentication

* User registration
* User login
* JWT-based authentication
* Protected routes
* Password hashing with bcryptjs
* Authenticated user profile endpoint

### Favorite Games

* Authenticated users can add games to favorites
* Authenticated users can remove favorite games
* Authenticated users can list their favorite games
* Favorite list supports pagination

### Slot Machine

* Only authenticated users can spin
* New users start with 20 coins
* Bet amount must be between 0.50 and 5.00
* Bet amount must increase by 0.50 steps
* Balance is updated after every spin
* Every spin is stored permanently
* Spin history includes:

  * User ID
  * Optional game ID
  * Reel results
  * Bet amount
  * Win amount
  * Net amount
  * Balance before spin
  * Balance after spin
  * Timestamp

### API Documentation

Swagger documentation is available at:

```text
http://localhost:3000/api
```

JWT-protected endpoints can be tested from Swagger by using the **Authorize** button and providing the access token returned from `/auth/login`.

## Project Structure

```text
src
├── auth
│   ├── decorators
│   ├── dto
│   ├── guards
│   ├── types
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common
│   ├── filters
│   └── middleware
├── favorites
│   ├── dto
│   ├── favorites.controller.ts
│   ├── favorites.module.ts
│   └── favorites.service.ts
├── games
│   ├── dto
│   ├── games.controller.ts
│   ├── games.module.ts
│   └── games.service.ts
├── prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── slot
│   ├── dto
│   ├── types
│   ├── slot.controller.ts
│   ├── slot-machine.service.ts
│   ├── slot.module.ts
│   └── slot.service.ts
├── app.module.ts
└── main.ts
```

## Database Design

The database is designed around the following main entities:

```text
User
Casino
GameType
Country
Game
GameCountry
UserFavoriteGame
SpinHistory
```

### Main Relationships

```text
Casino 1 ─── N Game

GameType 1 ─── N Game

Country 1 ─── N User

Game N ─── N Country
through GameCountry

User N ─── N Game
through UserFavoriteGame

User 1 ─── N SpinHistory

Game 1 ─── N SpinHistory
```

### Important Tables

#### users

Stores registered users.

Important fields:

```text
id
email
username
password_hash
balance
country_id
created_at
updated_at
```

Each new user starts with a default balance of `20.00`.

#### games

Stores imported casino games.

Important fields:

```text
id
external_id
casino_id
game_type_id
name
slug
provider_name
thumbnail_url
is_active
created_at
updated_at
```

#### user_favorite_games

Stores user favorite games.

Composite key:

```text
user_id + game_id
```

This prevents the same user from adding the same game more than once.

#### spin_history

Stores all slot machine spins permanently.

Important fields:

```text
id
user_id
game_id
round_id
bet_amount
win_amount
net_amount
balance_before
balance_after
reel_1
reel_2
reel_3
currency
result_data
spun_at
```

## Slot Machine Rules

The slot machine uses three reels.

### Reel 1

```text
["cherry", "lemon", "apple", "lemon", "banana", "banana", "lemon", "lemon"]
```

### Reel 2

```text
["lemon", "apple", "lemon", "lemon", "cherry", "apple", "banana", "lemon"]
```

### Reel 3

```text
["lemon", "apple", "lemon", "apple", "cherry", "lemon", "banana", "lemon"]
```

### Payout Rules

Matching is evaluated from left to right starting from Reel 1.

```text
3 cherries  => bet amount x 50
2 cherries  => bet amount x 40

3 apples    => bet amount x 20
2 apples    => bet amount x 10

3 bananas   => bet amount x 15
2 bananas   => bet amount x 5

3 lemons    => bet amount x 3
```

Important example:

```text
lemon, lemon, apple => no win
```

There is no payout for two lemons.

### Balance Formula

```text
balance_after = balance_before - bet_amount + win_amount
```

### Example

If the user has 20 coins and spins with 1 coin:

```text
Result: cherry, cherry, lemon
Multiplier: x40
Win amount: 40
Net amount: 39
Balance after: 20 - 1 + 40 = 59
```

## Environment Variables

Create a `.env` file in the backend root directory.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/game_platform_db?schema=public"
JWT_SECRET="super-secret-jwt-key-change-this"
PORT=3000
```

For production, replace `JWT_SECRET` with a strong secret value.

## Running PostgreSQL with Docker

Start PostgreSQL:

```bash
docker compose up -d
```

Check container status:

```bash
docker ps
```

Stop PostgreSQL:

```bash
docker compose down
```

The PostgreSQL database runs on:

```text
localhost:5432
```

Default credentials:

```text
Database: game_platform_db
Username: postgres
Password: postgres
```

## Installation

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

Seed the database:

```bash
npx prisma db seed
```

Start the development server:

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/api
```

## Useful Prisma Commands

Generate Prisma client:

```bash
npx prisma generate
```

Create and apply a new migration:

```bash
npx prisma migrate dev
```

Check migration status:

```bash
npx prisma migrate status
```

Open Prisma Studio:

```bash
npx prisma studio
```

Seed database:

```bash
npx prisma db seed
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

Header:

```http
Authorization: Bearer <access_token>
```

---

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
  }
}
```

---

### Favorites

All favorites endpoints require JWT.

Header:

```http
Authorization: Bearer <access_token>
```

#### List Favorite Games

```http
GET /favorites?page=1&limit=20
```

#### Add Favorite Game

```http
POST /favorites/:gameId
```

Example:

```http
POST /favorites/b0f8f3d2-5a41-4f5a-b7e6-7baf4a2c1234
```

#### Remove Favorite Game

```http
DELETE /favorites/:gameId
```

Example:

```http
DELETE /favorites/b0f8f3d2-5a41-4f5a-b7e6-7baf4a2c1234
```

---

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

Header:

```http
Authorization: Bearer <access_token>
```

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

Header:

```http
Authorization: Bearer <access_token>
```

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

## Authentication Flow

1. User registers with `/auth/register`
2. User logs in with `/auth/login`
3. API returns an `accessToken`
4. The token is sent in protected requests:

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

## Security

The backend includes several security-focused features:

* Passwords are hashed using bcryptjs
* JWT authentication for protected routes
* Global validation pipe
* Request body whitelist
* Unknown request fields are rejected
* Helmet middleware
* CORS configuration
* Rate limiting
* Centralized HTTP exception filter

## Validation

The backend validates request bodies and query parameters with `class-validator` and `class-transformer`.

Examples:

* Email must be valid
* Password must be at least 8 characters
* Username can only contain letters, numbers, and underscore
* Bet amount must be between 0.50 and 5.00
* Bet amount must be one of the allowed 0.50-step values
* Pagination values must be positive integers
* UUID path parameters must be valid UUIDs

## Search Optimization

Game search is optimized using PostgreSQL indexes.

Implemented optimizations include:

* Trigram search indexes on game name, slug, and provider name
* Indexes for active games and creation date
* Indexes for active games and provider name
* In-memory response cache for repeated game listing requests

PostgreSQL extension:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Example indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_games_name_trgm
ON games USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_games_slug_trgm
ON games USING GIN (slug gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_games_provider_name_trgm
ON games USING GIN (provider_name gin_trgm_ops);
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

Current test coverage includes:

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

The tests cover:

* User registration
* User login
* JWT guard behavior
* Game listing
* Search/filter/pagination
* Slot payout rules
* Slot balance updates
* Spin history creation
* Favorite game creation/removal
* Protected controller behavior

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

The backend is ready to be deployed to cloud providers such as:

* Render
* Railway
* AWS
* Azure
* Google Cloud Platform

Required production environment variables:

```env
DATABASE_URL="production-postgresql-url"
JWT_SECRET="strong-production-secret"
PORT=3000
```

For production deployments:

* Use a managed PostgreSQL instance
* Use a strong JWT secret
* Run migrations during deployment
* Do not commit `.env`
* Configure CORS for the deployed frontend URL
* Use HTTPS
* Store secrets in the cloud provider's secret manager

## License

This project was developed as part of a full-stack JavaScript developer assessment.
