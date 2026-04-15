import React, { useCallback } from 'react';
import { Box, Typography, Grid, Divider, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import ExamForm from './components/ExamForm';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCreateExamMutation } from '../../slices/examApiSlice.js';
import {
  IconClipboardList,
  IconClock,
  IconUsers,
  IconShieldCheck,
  IconCalendar,
  IconCalendarOff,
  IconPercentage,
} from '@tabler/icons-react';

const examValidationSchema = yup.object({
  examName: yup.string().required('Exam name is required'),
  totalQuestions: yup
    .number()
    .typeError('Must be a number')
    .integer('Must be an integer')
    .positive('Must be positive')
    .required('Required'),
  duration: yup
    .number()
    .typeError('Must be a number')
    .integer('Must be an integer')
    .min(1, 'Minimum 1 minute')
    .required('Required'),
  liveDate: yup.date().required('Live date is required'),
  deadDate: yup
    .date()
    .required('Deadline is required')
    .min(yup.ref('liveDate'), 'Deadline must be after live date'),
});

const fmt = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const PreviewRow = ({ icon: Icon, label, value, accent }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
    <Box sx={{
      width: 32, height: 32, borderRadius: '8px',
      backgroundColor: accent ? `${accent}18` : 'rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={15} color={accent || 'rgba(235,235,245,0.4)'} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: value ? '#EBEBF5' : 'rgba(235,235,245,0.25)', fontFamily: 'Inter, sans-serif', fontWeight: 500, mt: 0.25, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

const CreateExamPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [createExam, { isLoading }] = useCreateExamMutation();
  const navigate = useNavigate();

  const handleSubmit = useCallback(async (values, { setSubmitting, resetForm }) => {
    try {
      const examResponse = await createExam(values).unwrap();
      const examId = examResponse.examId || examResponse._id || examResponse.id;
      if (!examId) { toast.error('Failed to get exam ID'); setSubmitting(false); return; }
      toast.success('Exam created successfully');
      resetForm();
      setTimeout(() => { navigate('/all-exams'); toast.info('You can now assign students and add questions'); }, 1000);
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to create exam');
      setSubmitting(false);
    }
  }, [createExam, navigate]);

  const formik = useFormik({
    initialValues: {
      examName: '', description: '', subject: '', instructions: '',
      totalQuestions: '', duration: '', passingScore: '',
      marksPerQuestion: 1, negativeMarking: 0, maxAttempts: 1,
      shuffleQuestions: false, allowReview: true, tags: [],
      liveDate: '', deadDate: '',
    },
    validationSchema: examValidationSchema,
    onSubmit: handleSubmit,
    validateOnChange: true,
    validateOnBlur: true,
  });

  const { values } = formik;

  const windowMs = values.liveDate && values.deadDate
    ? new Date(values.deadDate) - new Date(values.liveDate)
    : null;
  const windowLabel = windowMs > 0
    ? (() => { const h = Math.floor(windowMs / 3600000); const d = Math.floor(h / 24); return d > 0 ? `${d}d ${h % 24}h` : `${h}h`; })()
    : null;

  return (
    <PageContainer title="Create Exam">
      <Box sx={{ pb: 6 }}>
        {/* ── Page Header ─────────────────────────────────────────── */}
        <Box sx={{
          mb: 4, pb: 3,
          borderBottom: '0.5px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.875rem', color: '#FFFFFF', letterSpacing: '-0.045em', fontFamily: 'Inter, sans-serif', lineHeight: 1.1 }}>
              Create Exam
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.4)', mt: 0.75, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
              Set up a new AI-proctored exam for your students
            </Typography>
          </Box>
          <Chip
            icon={<IconShieldCheck size={13} />}
            label="AI Proctoring Enabled"
            size="small"
            sx={{
              backgroundColor: 'rgba(48,209,88,0.1)',
              border: '0.5px solid rgba(48,209,88,0.25)',
              color: '#30D158',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#30D158' },
            }}
          />
        </Box>

        {/* ── Two-column Layout ────────────────────────────────────── */}
        <Grid container spacing={3} alignItems="flex-start">
          {/* Left — Form */}
          <Grid item xs={12} lg={7}>
            <ExamForm formik={formik} isLoading={isLoading} />
          </Grid>

          {/* Right — Live Preview */}
          <Grid item xs={12} lg={5}>
            <Box sx={{
              position: { lg: 'sticky' },
              top: { lg: 24 },
            }}>
              {/* Preview Card */}
              <Box sx={{
                backgroundColor: '#1C1C1E',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                overflow: 'hidden',
                mb: 2,
              }}>
                {/* Card Header */}
                <Box sx={{
                  px: 2.5, py: 2,
                  background: 'linear-gradient(135deg, rgba(10,132,255,0.15) 0%, rgba(48,209,88,0.08) 100%)',
                  borderBottom: '0.5px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', gap: 1.25,
                }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0A84FF, #30D158)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconClipboardList size={18} color="#fff" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                      Live Preview
                    </Typography>
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: values.examName ? '#EBEBF5' : 'rgba(235,235,245,0.25)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                      {values.examName || 'Exam Name…'}
                    </Typography>
                  </Box>
                </Box>

                {/* Preview Rows */}
                <Box sx={{ px: 2.5, py: 0.5 }}>
                  <PreviewRow icon={IconClock} label="Duration" value={values.duration ? `${values.duration} minutes` : null} accent="#0A84FF" />
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                  <PreviewRow icon={IconUsers} label="Total Questions" value={values.totalQuestions ? `${values.totalQuestions} questions` : null} accent="#5E5CE6" />
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                  <PreviewRow icon={IconPercentage} label="Passing Score" value={values.passingScore ? `${values.passingScore}%` : null} accent="#FF9F0A" />
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                  <PreviewRow icon={IconCalendar} label="Opens" value={values.liveDate ? fmt(values.liveDate) : null} accent="#30D158" />
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                  <PreviewRow icon={IconCalendarOff} label="Closes" value={values.deadDate ? fmt(values.deadDate) : null} accent="#FF453A" />
                  {windowLabel && (
                    <>
                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25 }}>
                        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' }}>Exam window</Typography>
                        <Box sx={{ backgroundColor: 'rgba(48,209,88,0.12)', border: '0.5px solid rgba(48,209,88,0.2)', borderRadius: '20px', px: 1.5, py: 0.375 }}>
                          <Typography sx={{ fontSize: '0.75rem', color: '#30D158', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{windowLabel}</Typography>
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              {/* Proctoring Features Card */}
              <Box sx={{
                backgroundColor: '#1C1C1E',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                p: 2.5,
              }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2, fontFamily: 'Inter, sans-serif' }}>
                  AI Proctoring Features
                </Typography>
                {[
                  { emoji: '👤', label: 'Face presence detection', desc: 'Alerts when no face or multiple faces detected' },
                  { emoji: '📱', label: 'Device detection', desc: 'Detects phones and prohibited objects via AI' },
                  { emoji: '👁️', label: 'Eye gaze tracking', desc: 'Monitors attention and gaze direction' },
                  { emoji: '🔒', label: 'Browser lockdown', desc: 'Blocks tab switching and window focus loss' },
                  { emoji: '🎤', label: 'Audio monitoring', desc: 'Detects unusual background noise' },
                ].map(({ emoji, label, desc }) => (
                  <Box key={label} sx={{ display: 'flex', gap: 1.5, mb: 1.75 }}>
                    <Typography sx={{ fontSize: '1rem', lineHeight: 1, mt: 0.125 }}>{emoji}</Typography>
                    <Box>
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(235,235,245,0.75)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
                        {label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', mt: 0.25, lineHeight: 1.4 }}>
                        {desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default CreateExamPage;
