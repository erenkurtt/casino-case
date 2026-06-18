export type User = {
  id: string;
  email: string;
  username: string;
  balance: number;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type Game = {
  id: string;
  externalId: number;
  name: string;
  slug: string;
  providerName: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  createdAt?: string;
  casino: {
    id: string;
    name: string;
  };
  gameType: {
    id: string;
    name: string;
    slug: string;
  };
  countries: {
    id: string;
    isoCode: string;
    name: string;
  }[];
};

export type GamesResponse = {
  data: Game[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    sortBy: string;
    sortOrder: string;
    cacheHit: boolean;
  };
  filters?: {
    search: string | null;
    providerName: string | null;
    country: string | null;
    gameType: string | null;
    isActive: boolean;
  };
};

export type FavoriteGame = {
  favoritedAt: string;
  game: Game;
};

export type FavoritesResponse = {
  data: FavoriteGame[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type BetOptionsResponse = {
  min: number;
  max: number;
  step: number;
  options: number[];
};

export type SpinResponse = {
  spinId: string;
  roundId: string;
  reels: string[];
  betAmount: number;
  winAmount: number;
  amountWonLost: number;
  balanceBefore: number;
  balanceAfter: number;
  updatedBalance: number;
  timestamp: string;
};

export type SpinHistoryResponse = {
  data: {
    id: string;
    roundId: string;
    reels: string[];
    betAmount: number;
    winAmount: number;
    amountWonLost: number;
    balanceBefore: number;
    balanceAfter: number;
    game: {
      id: string;
      name: string;
      slug: string;
      thumbnailUrl: string | null;
    } | null;
    spunAt: string;
  }[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type ExchangeRatesResponse = {
  base?: string;
  base_code?: string;
  date?: string;
  rates?: Record<string, number>;
  conversion_rates?: Record<string, number>;
};