import { apiSlice } from './apiSlice';

// Define the base URL for the exams API
const EXAMS_URL = '/api/users';

// Inject endpoints for the exam slice
export const examApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all exams
    getExams: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam`,
        method: 'GET',
      }),
      providesTags: ['Exams'],
    }),
    // Create a new exam
    createExam: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Exams'],
    }),

    // Update an exam
    updateExam: builder.mutation({
      query: ({ examId, ...fields }) => ({
        url: `${EXAMS_URL}/exam/${examId}`,
        method: 'PUT',
        body: fields,
      }),
      invalidatesTags: ['Exams'],
    }),

    // Get questions for a specific exam
    getQuestions: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/questions/${examId}`,
        method: 'GET',
      }),
      providesTags: ['Questions'],
    }),

    // Get coding questions for a specific exam
    getCodingQuestions: builder.query({
      query: (examId) => ({
        url: `/api/coding/questions/exam/${examId}`,
        method: 'GET',
      }),
      providesTags: ['CodingQuestions'],
    }),

    // Create a new question for an exam
    createQuestion: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/questions`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Questions'],
    }),

    //Delete an exam
    deleteExam: builder.mutation({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['Exams'],
    }),

    // Get eligible students for an exam
    getEligibleStudents: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}/students`,
        method: 'GET',
      }),
      providesTags: (result, error, examId) => [{ type: 'ExamStudents', id: examId }],
    }),

    // Assign students to an exam
    assignStudentsToExam: builder.mutation({
      query: ({ examId, studentIds }) => ({
        url: `${EXAMS_URL}/exam/${examId}/students`,
        method: 'POST',
        body: { studentIds },
      }),
      invalidatesTags: (result, error, { examId }) => [
        'Exams',
        { type: 'ExamStudents', id: examId },
      ],
    }),

    // Remove students from an exam
    removeStudentsFromExam: builder.mutation({
      query: ({ examId, studentIds }) => ({
        url: `${EXAMS_URL}/exam/${examId}/students`,
        method: 'DELETE',
        body: { studentIds },
      }),
      invalidatesTags: (result, error, { examId }) => [
        'Exams',
        { type: 'ExamStudents', id: examId },
      ],
    }),

    // Update a question
    updateQuestion: builder.mutation({
      query: ({ id, question, options }) => ({
        url: `${EXAMS_URL}/exam/question/${id}`,
        method: 'PUT',
        body: { question, options },
      }),
      invalidatesTags: ['Questions'],
    }),

    // Delete a question
    deleteQuestion: builder.mutation({
      query: (id) => ({
        url: `${EXAMS_URL}/exam/question/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Questions'],
    }),

    // Update a coding question
    updateCodingQuestion: builder.mutation({
      query: ({ id, question, description, difficulty, timeLimit, points }) => ({
        url: `/api/coding/question/${id}`,
        method: 'PUT',
        body: { question, description, difficulty, timeLimit, points },
      }),
      invalidatesTags: ['CodingQuestions'],
    }),

    // Delete a coding question
    deleteCodingQuestion: builder.mutation({
      query: (id) => ({
        url: `/api/coding/question/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CodingQuestions'],
    }),

    // Duplicate an exam
    duplicateExam: builder.mutation({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['Exams'],
    }),

    // Get single exam details
    getExamById: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}/details`,
        method: 'GET',
      }),
      providesTags: (result, error, examId) => [{ type: 'Exams', id: examId }],
    }),

    // Get exam stats for teacher dashboard
    getExamStats: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam/stats`,
        method: 'GET',
      }),
      providesTags: ['ExamStats'],
    }),
  }),
});

// Export the generated hooks for each endpoint
export const {
  useGetExamsQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useGetQuestionsQuery,
  useGetCodingQuestionsQuery,
  useCreateQuestionMutation,
  useDeleteExamMutation,
  useGetEligibleStudentsQuery,
  useAssignStudentsToExamMutation,
  useRemoveStudentsFromExamMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useUpdateCodingQuestionMutation,
  useDeleteCodingQuestionMutation,
  useDuplicateExamMutation,
  useGetExamByIdQuery,
  useGetExamStatsQuery,
} = examApiSlice;
