import React, { useCallback } from 'react';
import { Grid, Box, Card, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import ExamForm from './components/ExamForm';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCreateExamMutation } from '../../slices/examApiSlice.js';

const examValidationSchema = yup.object({
  examName: yup.string().required('Exam Name is required'),
  totalQuestions: yup
    .number()
    .typeError('Total Number of Questions must be a number')
    .integer('Total Number of Questions must be an integer')
    .positive('Total Number of Questions must be positive')
    .required('Total Number of Questions is required'),
  duration: yup
    .number()
    .typeError('Exam Duration must be a number')
    .integer('Exam Duration must be an integer')
    .min(1, 'Exam Duration must be at least 1 minute')
    .required('Exam Duration is required'),
  liveDate: yup.date().required('Live Date and Time is required'),
  deadDate: yup
    .date()
    .required('Dead Date and Time is required')
    .min(yup.ref('liveDate'), 'Deadline must be after Live Date'),
});

const CreateExamPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [createExam, { isLoading }] = useCreateExamMutation();
  const navigate = useNavigate();

  const initialExamValues = {
    examName: '',
    totalQuestions: '',
    duration: '',
    liveDate: '',
    deadDate: '',
  };

  const handleSubmit = useCallback(async (values, { setSubmitting, resetForm }) => {
    try {
      const examResponse = await createExam(values).unwrap();
      const examId = examResponse.examId || examResponse._id || examResponse.id;

      if (!examId) {
        toast.error('Failed to get exam ID');
        setSubmitting(false);
        return;
      }

      toast.success('🎉 Exam created successfully!');
      resetForm();
      
      // Navigate to All Exams page after successful creation
      setTimeout(() => {
        navigate('/all-exams');
        toast.info('💡 You can now assign students and add questions to the exam');
      }, 1000);
      
    } catch (err) {
      console.error('Exam Creation Error:', err);
      toast.error(err?.data?.message || err.error || 'Failed to create exam');
      setSubmitting(false);
    }
  }, [createExam, navigate]);

  const formik = useFormik({
    initialValues: initialExamValues,
    validationSchema: examValidationSchema,
    onSubmit: handleSubmit,
    validateOnChange: true,
    validateOnBlur: true,
  });

  return (
    <PageContainer title="Create Exam" description="Create a new exam">
      <Box>
        <Grid container spacing={0} justifyContent="center" sx={{ py: 3 }}>
          <Grid
            item
            xs={12}
            sm={12}
            lg={10}
            xl={8}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Card elevation={9} sx={{ p: 4, width: '100%', maxWidth: '900px' }}>
              <ExamForm
                formik={formik}
                isLoading={isLoading}
                title={
                  <Typography variant="h3" textAlign="center" color="textPrimary" mb={1}>
                    Create Exam
                  </Typography>
                }
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default CreateExamPage;
