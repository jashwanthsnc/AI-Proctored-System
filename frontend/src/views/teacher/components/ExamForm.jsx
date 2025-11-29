import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Grid,
  Paper,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Assessment,
  Schedule,
  CalendarToday,
  Quiz,
  Info,
  CheckCircle,
} from '@mui/icons-material';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';

const CreateExam = ({ formik, title, subtitle, subtext, isLoading }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit, isSubmitting } = formik;

  // Calculate time between dates - memoized to prevent recalculation on every render
  const timeDifference = useMemo(() => {
    if (values.liveDate && values.deadDate) {
      const live = new Date(values.liveDate);
      const dead = new Date(values.deadDate);
      const diff = dead - live;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (diff > 0) {
        return days > 0
          ? `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`
          : `${hours} hour${hours !== 1 ? 's' : ''}`;
      }
    }
    return null;
  }, [values.liveDate, values.deadDate]);

  const isFormDisabled = isSubmitting || isLoading;

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1} textAlign="center">
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box component="form" onSubmit={handleSubmit}>
        {/* SECTION 1: Basic Information */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderTop: 3, borderColor: 'primary.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Assessment sx={{ fontSize: 28, color: 'primary.main', mr: 1 }} />
            <Typography variant="h5" fontWeight={600}>
              Basic Information
            </Typography>
          </Box>

          <Stack spacing={3}>
            {/* Exam Name */}
            <CustomTextField
              id="examName"
              name="examName"
              label="Exam Name"
              variant="outlined"
              fullWidth
              placeholder="e.g., Data Structures Final Exam"
              value={values.examName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.examName && Boolean(errors.examName)}
              helperText={touched.examName && errors.examName}
              disabled={isFormDisabled}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Quiz color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Duration and Total Questions */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  id="duration"
                  name="duration"
                  label="Exam Duration"
                  type="number"
                  placeholder="60"
                  value={values.duration}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.duration && Boolean(errors.duration)}
                  helperText={touched.duration && errors.duration}
                  disabled={isFormDisabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Schedule color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">
                          minutes
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  id="totalQuestions"
                  name="totalQuestions"
                  label="Total Questions"
                  type="number"
                  placeholder="5"
                  value={values.totalQuestions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.totalQuestions && Boolean(errors.totalQuestions)}
                  helperText={touched.totalQuestions && errors.totalQuestions}
                  disabled={isFormDisabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Quiz color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* SECTION 2: Schedule */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderTop: 3, borderColor: 'success.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CalendarToday sx={{ fontSize: 28, color: 'success.main', mr: 1 }} />
            <Typography variant="h5" fontWeight={600}>
              Exam Schedule
            </Typography>
          </Box>

          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  id="liveDate"
                  name="liveDate"
                  label="Live Date and Time"
                  type="datetime-local"
                  value={values.liveDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.liveDate && Boolean(errors.liveDate)}
                  helperText={touched.liveDate && errors.liveDate || 'When students can start the exam'}
                  disabled={isFormDisabled}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  id="deadDate"
                  name="deadDate"
                  label="Deadline Date and Time"
                  type="datetime-local"
                  value={values.deadDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.deadDate && Boolean(errors.deadDate)}
                  helperText={touched.deadDate && errors.deadDate || 'Last date to submit the exam'}
                  disabled={isFormDisabled}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>

            {/* Time Difference Indicator */}
            {timeDifference && (
              <Alert severity="info" icon={<CheckCircle />}>
                Exam window: <strong>{timeDifference}</strong>
              </Alert>
            )}
          </Stack>
        </Paper>

        {/* Submit Button */}
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={isFormDisabled}
          startIcon={isFormDisabled ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
            },
          }}
        >
          {isFormDisabled ? 'Creating Exam...' : '🚀 Create Exam'}
        </Button>

        {/* Helper Info */}
        <Alert severity="info" sx={{ mt: 3 }} icon={<Info />}>
          <Typography variant="body2">
            <strong>Next Step:</strong> After creating the exam, you'll be redirected to All Exams page where you can assign students and add questions.
          </Typography>
        </Alert>
      </Box>

      {subtitle}
    </>
  );
};

export default CreateExam;
