import React from 'react';
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from '../../../components/shared/BlankCard';
import ExamCard from './ExamCard';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { IconBook } from '@tabler/icons-react';

const Exams = () => {
  // Fetch exam data from the backend using useGetExamsQuery
  const { data: userExams, isLoading, isError, error } = useGetExamsQuery();
  console.log('Exam User ', userExams);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error fetching exams: {error?.data?.message || 'Something went wrong'}
      </Alert>
    );
  }

  if (!userExams || userExams.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="300px"
        sx={{ textAlign: 'center' }}
      >
        <IconBook size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <Typography variant="h4" color="textSecondary" gutterBottom>
          No Exams Assigned
        </Typography>
        <Typography variant="body1" color="textSecondary">
          You don't have any exams assigned yet. Please contact your teacher.
        </Typography>
      </Box>
    );
  }

  return (
    <PageContainer title="Exams" description="List of exams">
      <Grid container spacing={3}>
        {userExams.map((exam) => (
          <Grid item sm={6} md={4} lg={3} key={exam._id}>
            <BlankCard>
              <ExamCard exam={exam} />
            </BlankCard>
          </Grid>
        ))}
      </Grid>
    </PageContainer>
  );
};

export default Exams;
