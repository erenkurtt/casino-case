# Casino Game Platform Frontend

This is the frontend application for the Casino Game Platform full-stack assessment.

The frontend is built with **Next.js**, **TypeScript**, **React**, and **Ant Design**.
It provides a responsive user interface for game listing, backend-powered search, JWT authentication, favorite games, protected slot machine gameplay, spin history, and display-only currency conversion.

## Table of Contents

* [Tech Stack](#tech-stack)
* [Main Features](#main-features)
* [Project Structure](#project-structure)
* [Environment Variables](#environment-variables)
* [Local Setup](#local-setup)
* [Running the Frontend](#running-the-frontend)
* [Routes](#routes)
* [Authentication Flow](#authentication-flow)
* [Game Listing and Search](#game-listing-and-search)
* [Favorite Games](#favorite-games)
* [Slot Machine](#slot-machine)
* [Currency Conversion](#currency-conversion)
* [Responsive Design](#responsive-design)
* [API Integration](#api-integration)
* [Build](#build)
* [Deployment Notes](#deployment-notes)
* [AI Usage Disclosure](#ai-usage-disclosure)

## Tech Stack

* Next.js
* React
* TypeScript
* Ant Design
* SCSS Modules
* Redux Toolkit
* Axios
* JWT stored in browser localStorage
* External exchange-rate API

## Main Features

### Game Listing

* Displays all games served by the backend.
* Uses thumbnails from the backend game response.
* Supports pagination.
* Supports backend-powered search.
* Uses debouncing while the user types.
* Prevents invalid one-character search requests.
* Uses Ant Design cards and pagination.

### Authentication

* User registration page.
* User login page.
* JWT token storage.
* Logout support.
* Protected routes.
* Automatic redirect to login when accessing protected pages without a token.
* Redirects users back to the originally requested protected page after login.

### Favorite Games

* Logged-in users can add games to favorites.
* Logged-in users can remove games from favorites.
* Favorite games can be viewed on a dedicated page.
* Unauthenticated users are redirected to login when trying to favorite a game.

### Slot Machine

* Slot page is protected.
* User can select bet amount from available backend-provided options.
* Bet amount ranges from 0.50 to 5.00 coins.
* Spin result is received from the backend.
* SVG slot symbols are displayed.
* Spin animation is shown while waiting for the backend response.
* Balance is updated after a successful spin.
* Spin history is displayed.
* Mobile view uses card layout instead of compressed tables.

### Currency Conversion

* Current coin balance can be converted to another currency.
* Uses an external exchange-rate API.
* Conversion is display-only.
* Stored coin balance is not modified.

## Project Structure

```text
frontend
├── app
│   ├── favorites
│   │   └── page.tsx
│   ├── login
│   │   └── page.tsx
│   ├── register
│   │   └── page.tsx
│   ├── spin
│   │   └── page.tsx
│   ├── src
│   │   ├── api
│   │   │   └── apiCalls.ts
│   │   ├── components
│   │   │   ├── auth
│   │   │   ├── currency
│   │   │   ├── gameList
│   │   │   ├── navigation
│   │   │   ├── pagination
│   │   │   ├── search
│   │   │   ├── slotspin
│   │   │   └── utils
│   │   ├── pages
│   │   │   ├── FavoritesPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── store
│   │   ├── styles
│   │   ├── types
│   │   │   └── api.ts
│   │   └── utils
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public
│   └── slot-symbols
│       ├── apple.svg
│       ├── banana.svg
│       ├── cherry.svg
│       └── lemon.svg
├── package.json
└── README.md
```

## Environment Variables

Create a `.env.local` file in the frontend root directory.

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.exchangerate-api.com/v4
```

A sample file should be provided as:

```text
frontend/.env.example
```

Example `.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.exchangerate-api.com/v4
```

## Local Setup

### Linux / WSL

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Windows PowerShell

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

## Running the Frontend

Development mode:

```bash
npm run dev
```

The frontend usually runs on:

```text
http://localhost:3001
```

If port `3000` is free, Next.js may use:

```text
http://localhost:3000
```

In this project, the backend usually runs on `http://localhost:3000`, so the frontend may automatically start on `3001`.

## Routes

### Public Routes

```text
/             Game listing page
/login        User login page
/register     User registration page
```

### Protected Routes

```text
/spin         Slot machine page
/favorites    Favorite games page
```

Protected routes use an `AuthGuard` component.
If the user is not authenticated, they are redirected to:

```text
/login?redirect=<original-path>
```

After successful login, the user is redirected back to the originally requested page.

## Authentication Flow

1. User registers on `/register` or logs in on `/login`.
2. Backend returns a JWT access token.
3. The frontend stores the token in localStorage.
4. API requests use the token in the Authorization header.
5. Protected routes verify the token by calling `/auth/me`.
6. Invalid or expired tokens are removed from localStorage.

Authorization header format:

```http
Authorization: Bearer <access_token>
```

Token storage helper:

```text
app/src/utils/authStorage.ts
```

Auth event helper:

```text
app/src/utils/appEvents.ts
```

The event helper is used to sync authentication and balance state across the UI.

## Game Listing and Search

The game listing page calls the backend endpoint:

```http
GET /games
```

Supported query parameters:

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

Example request:

```http
GET /games?page=1&limit=20&search=fire
```

The frontend search input uses debouncing.

Search behavior:

* Empty input loads all games.
* One-character input does not trigger a backend request.
* Two or more characters trigger backend search.
* Pagination uses backend metadata.

This avoids unnecessary API calls and prevents invalid search requests.

## Favorite Games

Favorite games are available only for authenticated users.

Used backend endpoints:

```http
GET /favorites?page=1&limit=20
POST /favorites/:gameId
DELETE /favorites/:gameId
```

Frontend behavior:

* If the user is not logged in, clicking favorite redirects to `/login`.
* If the game is not favorited, the card shows `Add Favorite`.
* If the game is already favorited, the card shows `Remove Favorite`.
* The `/favorites` page lists all favorite games.
* Users can remove favorite games from the favorites page.

## Slot Machine

The slot page is protected.

Used backend endpoints:

```http
GET /slot/bet-options
POST /slot/spin
GET /slot/history
GET /auth/me
```

### Bet Amount

Available bet options are fetched from the backend.

Example response:

```json
{
  "min": 0.5,
  "max": 5,
  "step": 0.5,
  "options": [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
}
```

### Spin

The frontend sends the selected bet amount to the backend.

Example request:

```json
{
  "betAmount": 1
}
```

Example response:

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

The frontend displays:

* Reel symbols
* Win or loss amount
* Updated balance
* Spin history

### Slot Animation

SVG assets are stored in:

```text
public/slot-symbols
```

Available symbols:

```text
apple.svg
banana.svg
cherry.svg
lemon.svg
```

While the spin request is in progress, the frontend randomly cycles through the SVG symbols.
When the backend response arrives, the animation stops and displays the actual backend result.

The animation is visual only.
The backend remains the source of truth for the final spin result.

## Currency Conversion

The frontend includes a display-only currency conversion feature.

Used external API:

```text
https://api.exchangerate-api.com/v4/latest/EUR
```

Environment variable:

```env
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.exchangerate-api.com/v4
```

Conversion behavior:

* User selects a target currency.
* User clicks `Convert Balance`.
* The frontend fetches exchange rates.
* Current coin balance is converted for display.
* Stored backend balance is not modified.

Assumption:

```text
1 coin = 1 EUR for display conversion
```

The backend stores balance only in coins.

## Responsive Design

The UI is designed with mobile-first responsiveness in mind.

Implemented responsive behavior:

* Navigation collapses/wraps on small screens.
* Game cards use responsive grid columns.
* Favorite games use responsive cards.
* Slot reels resize on mobile.
* Spin history table is replaced by mobile-friendly cards on small screens.
* Pagination supports different page sizes.
* Ant Design components are used for consistent responsive UI.

## API Integration

All API calls are centralized in:

```text
app/src/api/apiCalls.ts
```

The API client uses Axios.

Main responsibilities:

* Uses `NEXT_PUBLIC_API_URL`.
* Adds JWT token to protected requests.
* Normalizes backend error messages.
* Provides typed API functions.

API types are defined in:

```text
app/src/types/api.ts
```

## Ant Design and React 19 Compatibility

If the project uses React 19, Ant Design v5 may show a compatibility warning.

The frontend uses the official Ant Design React 19 patch:

```bash
npm install @ant-design/v5-patch-for-react-19
```

Imported in:

```text
app/layout.tsx
```

```ts
import "@ant-design/v5-patch-for-react-19";
```

## Build

Create a production build:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

## Lint

Run lint checks:

```bash
npm run lint
```

## Local Development Checklist

Backend should be running first:

```bash
cd ../backend
npm run start:dev
```

Then start frontend:

```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Open:

```text
http://localhost:3001
```

Recommended manual test flow:

```text
1. Open game listing page.
2. Search games with two or more characters.
3. Register a new user.
4. Confirm navbar shows username and balance.
5. Add a game to favorites.
6. Open favorites page.
7. Remove favorite game.
8. Open slot page.
9. Select bet amount.
10. Spin.
11. Confirm balance updates.
12. Confirm spin history updates.
13. Convert balance into another currency.
14. Logout.
15. Try to access /spin and confirm redirect to /login.
```

## Deployment Notes

The frontend can be deployed to:

```text
Vercel
Netlify
AWS Amplify
Azure Static Web Apps
Google Cloud
```

Recommended deployment:

```text
Frontend: Vercel
Backend: Render / Railway / Cloud provider
Database: Neon / Railway PostgreSQL / Render PostgreSQL
```

Production environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api-url
NEXT_PUBLIC_EXCHANGE_API_URL=https://api.exchangerate-api.com/v4
```

Deployment recommendations:

* Configure the backend CORS setting for the deployed frontend URL.
* Use HTTPS for both frontend and backend.
* Do not expose secrets in frontend environment variables.
* Only use `NEXT_PUBLIC_` variables for values that are safe to expose to the browser.
* Verify protected routes after deployment.
* Verify currency conversion works from deployed domain.

## AI Usage Disclosure

AI-assisted tools were used during development.

They helped with:

* Planning frontend integration with the backend API.
* Refactoring old API calls to match the new backend contract.
* Creating typed API models.
* Implementing JWT storage and protected route behavior.
* Improving game listing pagination and search behavior.
* Implementing favorite game UI.
* Connecting slot machine UI to the backend.
* Adding SVG-based spin animation.
* Improving responsive mobile layout.
* Drafting README documentation.

All generated code was reviewed, tested, modified, and adapted manually before being used.

The final implementation was manually verified through local testing, browser testing, backend API testing, and build checks.

## Notes

This frontend was developed as part of a full-stack JavaScript developer assessment.

It focuses on:

* Modern React and Next.js architecture.
* Clean API integration.
* Authenticated user flows.
* Responsive UI.
* Typed data handling.
* Slot machine interaction.
* Display-only currency conversion.
