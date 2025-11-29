import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Save,
  ArrowBack,
  Edit as EditIcon,
  CalendarToday,
  Timer,
  Quiz,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useUpdateExamMutation, useGetExamsQuery } from 'src/slices/examApiSlice';

const EditExamPage = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const location = useLocation();
  const examFromState = location.state?.exam;

  const [formData, setFormData] = useState({
    examName: '',
    totalQuestions: '',
    duration: '',
    liveDate: '',
    deadDate: '',
  });
  const [error, setError] = useState('');

  // RTK Query hooks
  const { data: examsData, isLoading: fetchingExam, error: fetchError } = useGetExamsQuery();
  const [updateExam, { isLoading: isUpdating }] = useUpdateExamMutation();

  useEffect(() => {
    if (examFromState) {
      // Use exam data passed from navigation
      populateForm(examFromState);
    } else if (examsData) {
      // Fetch exam data from RTK Query cache
      const exam = examsData.find((e) => e.examId === examId);
      
      if (exam) {
        populateForm(exam);
      } else {
        setError('Exam not found');
        toast.error('Exam not found');
      }
    }
  }, [examId, examFromState, examsData]);

  useEffect(() => {
    if (fetchError) {
      setError(fetchError?.data?.message || 'Failed to fetch exam data');
      toast.error('Failed to fetch exam data');
    }
  }, [fetchError]);

  const populateForm = (exam) => {
    setFormData({
      examName: exam.examName || '',
      totalQuestions: exam.totalQuestions || '',
      duration: exam.duration || '',
      liveDate: formatDateForInput(exam.liveDate),
      deadDate: formatDateForInput(exam.deadDate),
    });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Format: YYYY-MM-DDTHH:mm for datetime-local input
    return date.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.examName.trim()) {
      toast.error('Please enter exam name');
      return false;
    }
    if (!formData.totalQuestions || formData.totalQuestions <= 0) {
      toast.error('Please enter a valid number of questions');
      return false;
    }
    if (!formData.duration || formData.duration <= 0) {
      toast.error('Please enter a valid duration');
      return false;
    }
    if (!formData.liveDate) {
      toast.error('Please select live date');
      return false;
    }
    if (!formData.deadDate) {
      toast.error('Please select deadline');
      return false;
    }
    if (new Date(formData.deadDate) <= new Date(formData.liveDate)) {
      toast.error('Deadline must be after live date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const response = await updateExam({
        examId,
        examName: formData.examName,
        totalQuestions: parseInt(formData.totalQuestions),
        duration: parseInt(formData.duration),
        liveDate: new Date(formData.liveDate).toISOString(),
        deadDate: new Date(formData.deadDate).toISOString(),
      }).unwrap();

      toast.success('✅ Exam updated successfully!');
      navigate('/all-exams');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update exam');
    }
  };

  const calculateTimeWindow = () => {
    if (!formData.liveDate || !formData.deadDate) return null;
    const live = new Date(formData.liveDate);
    const dead = new Date(formData.deadDate);
    const diffMs = dead - live;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  };

  if (fetchingExam) {
    return (
      <PageContainer title="Edit Exam" description="Update exam details">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Edit Exam" description="Update exam details">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/all-exams')}
          sx={{ mt: 2 }}
        >
          Back to Exams
        </Button>
      </PageContainer>
    );
  }

  const timeWindow = calculateTimeWindow();

  return (
    <PageContainer title="Edit Exam" description="Update exam details">
      <Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/all-exams')}
          sx={{ mb: 3 }}
        >
          Back to All Exams
        </Button>

        <DashboardCard title={
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon />
            <span>Edit Exam</span>
          </Box>
        }>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update the exam details below. Make sure to save your changes before leaving.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Exam Name */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                      Basic Information
                    </Typography>
                    <TextField
                      fullWidth
                      label="Exam Name"
                      name="examName"
                      value={formData.examName}
                      onChange={handleChange}
                      placeholder="e.g., Mid-Term Examination"
                      required
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Exam Configuration */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Quiz fontSize="small" />
                        Exam Configuration
                      </Box>
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Total Questions"
                          name="totalQuestions"
                          type="number"
                          value={formData.totalQuestions}
                          onChange={handleChange}
                          inputProps={{ min: 1 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Duration (minutes)"
                          name="duration"
                          type="number"
                          value={formData.duration}
                          onChange={handleChange}
                          inputProps={{ min: 1 }}
                          required
                          InputProps={{
                            startAdornment: <Timer fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Exam Schedule */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday fontSize="small" />
                        Exam Schedule
                      </Box>
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Live Date & Time"
                          name="liveDate"
                          type="datetime-local"
                          value={formData.liveDate}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Deadline"
                          name="deadDate"
                          type="datetime-local"
                          value={formData.deadDate}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                          required
                        />
                      </Grid>
                    </Grid>
                    {timeWindow && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Exam will be available for: <strong>{timeWindow}</strong>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/all-exams')}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={isUpdating ? <CircularProgress size={20} /> : <Save />}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Exam'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </DashboardCard>
      </Box>
    </PageContainer>
  );
};

export default EditExamPage;
