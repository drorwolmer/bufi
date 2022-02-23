import { configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import {
  createApi,
  fetchBaseQuery,
  setupListeners,
} from "@reduxjs/toolkit/query/react";
import { BudgetEntry, ExpenseEntry } from "./types";
import moment from "moment";

export type BudgetResponse = {
  income: BudgetEntry[];
  expenses: BudgetEntry[];
};

export const bufiApi = createApi({
  reducerPath: "bufiApi",
  baseQuery: fetchBaseQuery({ baseUrl: "https://bufi.haminet.fm/" }),
  endpoints: (builder) => ({
    getBudget: builder.query<BudgetResponse, void>({
      query: () => "budget",
      transformResponse: (res: string[][]) => {
        const budget: BudgetEntry[] = res.map((r) => {
          return {
            name: r[0],
            budget: Math.abs(parseInt(r[1])),
            expense: parseInt(r[2]),
          };
        });

        return {
          income: budget.filter((b) => isNaN(b.expense)),
          expenses: budget.filter((b) => b.expense >= 0),
        };
      },
    }),
    getExpenses: builder.query<ExpenseEntry[], void>({
      query: () => "expenses",
      transformResponse: (res: string[][]) => {
        let id = 0;
        const data: ExpenseEntry[] = res
          .map((r) => {
            return {
              id: id++,
              timestamp: moment(r[0], "DD/MM/YYYY").valueOf(),
              category: r[1],
              expense: parseInt(r[2]),
              who: r[3],
              description: r[4],
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp);
        data.reverse();
        return data;
      },
    }),
  }),
});

const slice = createSlice({
  name: "app",
  initialState: {
    count: 0,
  },
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
    decrement: (state) => {
      state.count -= 1;
    },
  },
});

export const store = configureStore({
  reducer: {
    [bufiApi.reducerPath]: bufiApi.reducer,
    [slice.name]: slice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(bufiApi.middleware),
});

setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
// Use throughout your app instead of plain `useDispatch` and `useSelector`

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
setupListeners(store.dispatch);
