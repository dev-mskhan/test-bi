import { configureStore } from "@reduxjs/toolkit";
import { webhookApi } from "../features/webhook/webhookApi";

export const store = configureStore({
  reducer: {
    [webhookApi.reducerPath]: webhookApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(webhookApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
