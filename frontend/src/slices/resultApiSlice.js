import { apiSlice } from './apiSlice';

const RESULTS_URL = '/api/results';

export const resultApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    saveResult: builder.mutation({
      query: (data) => ({
        url: RESULTS_URL,
        method: 'POST',
        body: data,
      }),
    }),
    getResultsByExamId: builder.query({
      query: (examId) => ({
        url: `${RESULTS_URL}/exam/${examId}`,
        method: 'GET',
      }),
      providesTags: ['Results'],
    }),
    getUserResults: builder.query({
      query: () => ({
        url: `${RESULTS_URL}/user`,
        method: 'GET',
      }),
      providesTags: ['Results'],
    }),
    getAllResults: builder.query({
      query: () => ({
        url: RESULTS_URL,
        method: 'GET',
      }),
      providesTags: ['Results'],
    }),
  }),
});

export const {
  useSaveResultMutation,
  useGetResultsByExamIdQuery,
  useGetUserResultsQuery,
  useGetAllResultsQuery,
} = resultApiSlice;
