import { baseApi } from "../../services/baseApi";
import { User, ApiResponse } from "../../types";
import { setCredentials, logout, setLoading } from "./authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    me: builder.query<ApiResponse<User>, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            dispatch(setCredentials({ user: data.data }));
          } else {
            dispatch(logout());
          }
        } catch (error) {
          dispatch(logout());
        }
      },
    }),
    login: builder.mutation<ApiResponse<User>, any>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User", "Analysis", "Workflows"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            dispatch(setCredentials({ user: data.data }));
          }
        } catch (error) {
          // Handled in component
        }
      },
    }),
    register: builder.mutation<ApiResponse<User>, any>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            dispatch(setCredentials({ user: data.data }));
          }
        } catch (error) {
          // Handled in component
        }
      },
    }),
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logout());
        } catch (error) {
          dispatch(logout());
        }
      },
    }),
  }),
});

export const { useMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
