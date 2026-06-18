import axios from "axios";
import {
  AuthResponse,
  BetOptionsResponse,
  FavoritesResponse,
  GamesResponse,
  SpinHistoryResponse,
  SpinResponse,
  User,
  ExchangeRatesResponse
} from "../types/api";
import { getAccessToken } from "../utils/authStorage";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const exchangeApi = process.env.NEXT_PUBLIC_EXCHANGE_API_URL as string;

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    return message || error.message;
  }

  return "Something went wrong";
}

// Auth
export const registerUser = async (payload: {
  email: string;
  username: string;
  password: string;
  countryId?: string;
}) => {
  try {
    const response = await api.post<AuthResponse>("/auth/register", payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post<AuthResponse>("/auth/login", payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getMe = async () => {
  try {
    const response = await api.get<User>("/auth/me");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Games
export const getGameList = async (
  pageNumb: number = 1,
  searchText: string = "",
  limit: number = 20,
) => {
  try {
    const params = new URLSearchParams();

    params.set("page", pageNumb.toString());
    params.set("limit", limit.toString());

    if (searchText.trim()) {
      params.set("search", searchText.trim());
    }

    const response = await api.get<GamesResponse>(`/games?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Favorites
export const getFavorites = async (page: number = 1, limit: number = 20) => {
  try {
    const response = await api.get<FavoritesResponse>(
      `/favorites?page=${page}&limit=${limit}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const addFavorite = async (gameId: string) => {
  try {
    const response = await api.post(`/favorites/${gameId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const removeFavorite = async (gameId: string) => {
  try {
    const response = await api.delete(`/favorites/${gameId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Slot
export const getBetOptions = async () => {
  try {
    const response = await api.get<BetOptionsResponse>("/slot/bet-options");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const spinSlot = async (betAmount: number, gameId?: string) => {
  try {
    const response = await api.post<SpinResponse>("/slot/spin", {
      betAmount,
      ...(gameId ? { gameId } : {}),
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getSpinHistory = async (page: number = 1, limit: number = 20) => {
  try {
    const response = await api.get<SpinHistoryResponse>(
      `/slot/history?page=${page}&limit=${limit}`,
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getExchangeRates = async (baseCurrency: string = "EUR") => {
  try {
    const response = await axios.get<ExchangeRatesResponse>(
      `${exchangeApi}/latest/${baseCurrency}`,
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};