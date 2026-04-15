import { apiSlice } from './apiSlice';

const RESULTS_URL = '/api/users/results';

export const resultApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    saveResult: builder.mutation({
      query: (data) => ({
        url: RESULTS_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Results'],
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
      query: (params = {}) => {
        const { page = 1, limit = 50, examId, search } = params;
        const q = new URLSearchParams({ page, limit });
        if (examId) q.append('examId', examId);
        if (search) q.append('search', search);
        return { url: `${RESULTS_URL}/all?${q.toString()}`, method: 'GET' };
      },
      providesTags: ['Results'],
    }),
    toggleResultVisibility: builder.mutation({
      query: (resultId) => ({
        url: `${RESULTS_URL}/${resultId}/toggle-visibility`,
        method: 'PUT',
      }),
      invalidatesTags: ['Results'],
    }),
    bulkReleaseResults: builder.mutation({
      query: (examId) => ({
        url: `${RESULTS_URL}/bulk-release`,
        method: 'POST',
        body: examId ? { examId } : {},
      }),
      invalidatesTags: ['Results'],
    }),
    addFeedback: builder.mutation({
      query: ({ resultId, feedback }) => ({
        url: `${RESULTS_URL}/${resultId}/feedback`,
        method: 'PUT',
        body: { feedback },
      }),
      invalidatesTags: ['Results'],
    }),
    getExamSummary: builder.query({
      query: (examId) => ({
        url: `${RESULTS_URL}/summary/${examId}`,
        method: 'GET',
      }),
      providesTags: (result, error, examId) => [{ type: 'Results', id: examId }],
    }),
  }),
});

export const {
  useSaveResultMutation,
  useGetResultsByExamIdQuery,
  useGetUserResultsQuery,
  useGetAllResultsQuery,
  useToggleResultVisibilityMutation,
  useBulkReleaseResultsMutation,
  useAddFeedbackMutation,
  useGetExamSummaryQuery,
} = resultApiSlice;
