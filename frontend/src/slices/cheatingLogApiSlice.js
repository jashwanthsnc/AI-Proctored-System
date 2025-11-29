import { apiSlice } from './apiSlice';

// Define the base URL for the exams API
const CHEATING_LOGS_URL = '/api/users';

// Inject endpoints for the exam slice
export const cheatingLogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get cheating logs for a specific exam
    getCheatingLogs: builder.query({
      query: (examId) => ({
        url: `${CHEATING_LOGS_URL}/cheatingLogs/${examId}`,
        method: 'GET',
      }),
      providesTags: ['CheatingLogs'],
    }),
    // Save a new cheating log entry for an exam
    saveCheatingLog: builder.mutation({
      query: (data) => ({
        url: `${CHEATING_LOGS_URL}/cheatingLogs`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CheatingLogs', 'ActiveStudents', 'RecentViolations', 'ProctoringStats'],
    }),
    // Get active students (currently taking exams)
    getActiveStudents: builder.query({
      query: () => ({
        url: `${CHEATING_LOGS_URL}/exam/active-students`,
        method: 'GET',
      }),
      providesTags: ['ActiveStudents'],
    }),
    // Get recent violations (last 30 minutes)
    getRecentViolations: builder.query({
      query: () => ({
        url: `${CHEATING_LOGS_URL}/exam/recent-violations`,
        method: 'GET',
      }),
      providesTags: ['RecentViolations'],
    }),
    // Get live proctoring statistics
    getProctoringStats: builder.query({
      query: () => ({
        url: `${CHEATING_LOGS_URL}/exam/proctoring-stats`,
        method: 'GET',
      }),
      providesTags: ['ProctoringStats'],
    }),
  }),
});

// Export the generated hooks for each endpoint
export const { 
  useGetCheatingLogsQuery, 
  useSaveCheatingLogMutation,
  useGetActiveStudentsQuery,
  useGetRecentViolationsQuery,
  useGetProctoringStatsQuery,
} = cheatingLogApiSlice;
