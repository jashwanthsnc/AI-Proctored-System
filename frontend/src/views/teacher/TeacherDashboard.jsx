import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Assessment,
  Add,
  People,
  CheckCircle,
  Schedule,
  ArrowForward,
  Quiz,
  Code,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { useGetStudentsQuery } from 'src/slices/usersApiSlice';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery();
  const { data: studentsData, isLoading: studentsLoading } = useGetStudentsQuery();

  const exams = examsData || [];
  const students = studentsData?.data || [];

  // Calculate statistics
  const getExamStatus = (exam) => {
    const now = new Date();
    const liveDate = new Date(exam.liveDate);
    const deadDate = new Date(exam.deadDate);

    if (now < liveDate) return 'upcoming';
    if (now > deadDate) return 'ended';
    return 'active';
  };

  const stats = {
    totalExams: exams.length,
    activeExams: exams.filter((e) => getExamStatus(e) === 'active').length,
    upcomingExams: exams.filter((e) => getExamStatus(e) === 'upcoming').length,
    totalStudents: students.length,
  };

  // Get recent exams (last 5)
  const recentExams = exams
    .sort((a, b) => new Date(b.liveDate) - new Date(a.liveDate))
    .slice(0, 5);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusChip = (exam) => {
    const status = getExamStatus(exam);
    const colors = {
      active: 'success',
      upcoming: 'info',
      ended: 'default',
    };
    const labels = {
      active: 'Active',
      upcoming: 'Upcoming',
      ended: 'Ended',
    };
    return <Chip label={labels[status]} size="small" color={colors[status]} />;
  };

  if (examsLoading || studentsLoading) {
    return (
      <PageContainer title="Dashboard" description="Teacher Dashboard Overview">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard" description="Teacher Dashboard Overview">
      <Box>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" fontWeight={600} gutterBottom>
            Welcome Back! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your exams today
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Exams */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={700}>
                  {stats.totalExams}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Exams */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={700}>
                  {stats.activeExams}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Active Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Exams */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={700}>
                  {stats.upcomingExams}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Upcoming Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Students */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={700}>
                  {stats.totalStudents}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Add />}
                  onClick={() => navigate('/create-exam')}
                  sx={{ py: 1.5 }}
                >
                  Create Exam
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Quiz />}
                  onClick={() => navigate('/add-questions')}
                  sx={{ py: 1.5 }}
                >
                  Add Questions
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Assessment />}
                  onClick={() => navigate('/all-exams')}
                  sx={{ py: 1.5 }}
                >
                  View All Exams
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<People />}
                  onClick={() => navigate('/students')}
                  sx={{ py: 1.5 }}
                >
                  Manage Students
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Recent Exams */}
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h5" fontWeight={600}>
                Recent Exams
              </Typography>
              <Button
                endIcon={<ArrowForward />}
                onClick={() => navigate('/all-exams')}
              >
                View All
              </Button>
            </Box>

            {recentExams.length === 0 ? (
              <Alert severity="info" icon={<Assessment />}>
                No exams created yet. Create your first exam to get started!
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell>Exam Name</TableCell>
                      <TableCell align="center">Questions</TableCell>
                      <TableCell align="center">Duration</TableCell>
                      <TableCell>Live Date</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Students</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentExams.map((exam) => (
                      <TableRow key={exam.examId} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {exam.examName}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={exam.totalQuestions}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {exam.duration} min
                        </TableCell>
                        <TableCell>{formatDate(exam.liveDate)}</TableCell>
                        <TableCell align="center">
                          {getStatusChip(exam)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={<People fontSize="small" />}
                            label={exam.eligibleStudents?.length || 0}
                            size="small"
                            color={
                              exam.eligibleStudents?.length > 0
                                ? 'success'
                                : 'default'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default TeacherDashboard;
