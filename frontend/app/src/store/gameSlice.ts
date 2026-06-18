import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GameList {
  searchText: string;
  page: number;
  limit: number;
  totalPage: number;
  totalItems: number;
}

const initialState: GameList = {
  searchText: "",
  page: 1,
  limit: 20,
  totalPage: 1,
  totalItems: 0,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setSearchText: (state: GameList, action: PayloadAction<string>) => {
      state.searchText = action.payload;
    },

    setPage: (state: GameList, action: PayloadAction<number>) => {
      state.page = action.payload;
    },

    setLimit: (state: GameList, action: PayloadAction<number>) => {
      state.limit = action.payload;
    },

    setTotalPage: (state: GameList, action: PayloadAction<number>) => {
      state.totalPage = action.payload;
    },

    setTotalItems: (state: GameList, action: PayloadAction<number>) => {
      state.totalItems = action.payload;
    },
  },
});

export const {
  setSearchText,
  setPage,
  setLimit,
  setTotalPage,
  setTotalItems,
} = gameSlice.actions;

export default gameSlice.reducer;