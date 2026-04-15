import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Stack,
  Switch,
  Chip,
} from '@mui/material';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconClipboard,
  IconClock,
  IconHash,
  IconCalendar,
  IconCalendarOff,
  IconNotes,
  IconPercentage,
  IconBook,
  IconListCheck,
  IconAdjustments,
  IconTag,
  IconX,
  IconRepeat,
  IconMinus,
} from '@tabler/icons-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageContainer from 'src/components/container/PageContainer';
import { useUpdateExamMutation, useGetExamsQuery } from 'src/slices/examApiSlice';

const EditExamPage = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const location = useLocation();
  const examFromState = location.state?.exam;

  const [formData, setFormData] = useState({
    examName: '',
    description: '',
    subject: '',
    instructions: '',
    totalQuestions: '',
    duration: '',
    passingScore: '',
    marksPerQuestion: 1,
    negativeMarking: 0,
    maxAttempts: 1,
    shuffleQuestions: false,
    allowReview: true,
    tags: [],
    liveDate: '',
    deadDate: '',
  });
  const [tagInput, setTagInput] = useState('');
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
      description: exam.description || '',
      subject: exam.subject || '',
      instructions: exam.instructions || '',
      totalQuestions: exam.totalQuestions || '',
      duration: exam.duration || '',
      passingScore: exam.passingScore !== undefined ? exam.passingScore : 60,
      marksPerQuestion: exam.marksPerQuestion !== undefined ? exam.marksPerQuestion : 1,
      negativeMarking: exam.negativeMarking !== undefined ? exam.negativeMarking : 0,
      maxAttempts: exam.maxAttempts !== undefined ? exam.maxAttempts : 1,
      shuffleQuestions: exam.shuffleQuestions || false,
      allowReview: exam.allowReview !== undefined ? exam.allowReview : true,
      tags: exam.tags || [],
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
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
        description: formData.description,
        subject: formData.subject,
        instructions: formData.instructions,
        passingScore: Number(formData.passingScore) || 60,
        marksPerQuestion: Number(formData.marksPerQuestion) || 1,
        negativeMarking: Number(formData.negativeMarking) || 0,
        maxAttempts: Number(formData.maxAttempts) || 1,
        shuffleQuestions: formData.shuffleQuestions,
        allowReview: formData.allowReview,
        tags: formData.tags,
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
      <PageContainer title="Edit Exam">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#0A84FF' }} />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Edit Exam">
        <Box sx={{ backgroundColor: 'rgba(255,69,58,0.1)', border: '0.5px solid rgba(255,69,58,0.3)', borderRadius: '12px', p: 3, mt: 2 }}>
          <Typography sx={{ color: '#FF453A', fontFamily: 'Inter, sans-serif', mb: 1 }}>{error}</Typography>
          <Button
            onClick={() => navigate('/all-exams')}
            startIcon={<IconArrowLeft size={16} />}
            sx={{ color: '#0A84FF', textTransform: 'none', fontFamily: 'Inter, sans-serif', p: 0 }}
          >
            Back to Exams
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const timeWindow = calculateTimeWindow();
  const sectionSx = { backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', p: 2.5, mb: 2 };
  const labelSx = { fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif', mb: 0.75, display: 'block' };
  const inputSx = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', color: '#FFFFFF', fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' };

  return (
    <PageContainer title="Edit Exam">
      <Box sx={{ pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Button
            onClick={() => navigate('/all-exams')}
            startIcon={<IconArrowLeft size={16} />}
            sx={{ color: 'rgba(235,235,245,0.6)', textTransform: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 500, borderRadius: '980px', px: 2, '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}
          >
            All Exams
          </Button>
          <Typography sx={{ color: 'rgba(235,235,245,0.25)', fontSize: '0.875rem' }}>/</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif' }}>Edit</Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
            Edit Exam
          </Typography>
          <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.45)', mt: 0.75, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
            Update exam details and schedule
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 680 }} component="form" onSubmit={handleSubmit}>
          {/* Basic Info */}
          <Box sx={sectionSx}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2, fontFamily: 'Inter, sans-serif' }}>
              Basic Information
            </Typography>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <IconClipboard size={14} color="rgba(235,235,245,0.4)" />
                <Typography component="label" sx={labelSx}>Exam Name</Typography>
              </Box>
              <input name="examName" value={formData.examName} onChange={handleChange} placeholder="e.g., Mid-Term Examination" required style={inputSx} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <IconNotes size={14} color="rgba(235,235,245,0.4)" />
                <Typography component="label" sx={labelSx}>Description (optional)</Typography>
              </Box>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Briefly describe what this exam covers…" rows={3} style={{ ...inputSx, resize: 'vertical', lineHeight: '1.5' }} />
            </Box>
          </Box>

          {/* Configuration */}
          <Box sx={sectionSx}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2, fontFamily: 'Inter, sans-serif' }}>
              Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <IconClock size={14} color="rgba(235,235,245,0.4)" />
                    <Typography component="label" sx={labelSx}>Duration (minutes)</Typography>
                  </Box>
                  <input name="duration" type="number" value={formData.duration} onChange={handleChange} min="1" required style={inputSx} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <IconHash size={14} color="rgba(235,235,245,0.4)" />
                    <Typography component="label" sx={labelSx}>Total Questions</Typography>
                  </Box>
                  <input name="totalQuestions" type="number" value={formData.totalQuestions} onChange={handleChange} min="1" required style={inputSx} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <IconPercentage size={14} color="rgba(235,235,245,0.4)" />
                    <Typography component="label" sx={labelSx}>Passing Score (%)</Typography>
                  </Box>
                  <input name="passingScore" type="number" value={formData.passingScore} onChange={handleChange} min="1" max="100" placeholder="60" style={inputSx} />
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Subject & Instructions */}
          <Box sx={sectionSx}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2, fontFamily: 'Inter, sans-serif' }}>
              Subject & Instructions
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                  <IconBook size={14} color="rgba(235,235,245,0.4)" />
                  <Typography component="label" sx={labelSx}>Subject</Typography>
                </Box>
                <input name="subject" value={formData.subject} onChange={handleChange} placeholder="e.g., Computer Science, Mathematics" style={inputSx} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                  <IconListCheck size={14} color="rgba(235,235,245,0.4)" />
                  <Typography component="label" sx={labelSx}>Student Instructions</Typography>
                </Box>
                <textarea name="instructions" value={formData.instructions} onChange={handleChange} placeholder="e.g., Read each question carefully. No calculators allowed." rows={4} style={{ ...inputSx, resize: 'vertical', lineHeight: '1.5' }} />
              </Box>
            </Stack>
          </Box>

          {/* Scoring */}
          <Box sx={sectionSx}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2, fontFamily: 'Inter, sans-serif' }}>
              Scoring
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <IconPercentage size={14} color="rgba(235,235,245,0.4)" />
                    <Typography component="label" sx={labelSx}>Marks / Question</Typography>
                  </Box>
                  <input name="marksPerQuestion" type="number" value={formData.marksPerQuestion} onChange={handleChange} min="0" step="0.5" placeholder="1" style={inputSx} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <IconMinus size={14} color="rgba(235,235,245,0.4)" />
                    <Typography component="label" sx={labelSx}>Negative Marking</Typography>
                  </Box>
                  <input name="negativeMarking" type="number" value={formData.negativeMarking} onChange={handleChange} min="0" step="0.25" placeholder="0" style={inputSx} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <IconRepeat size={14} color="rgba(235,235,245,0.4)" />
                    <Typography component="label" sx={labelSx}>Max Attempts</Typography>
                  </Box>
                  <input name="maxAttempts" type="number" value={formData.maxAttempts} onChange={handleChange} min="1" max="10" placeholder="1" style={inputSx} />
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Exam Behaviour */}
          <Box sx={sectionSx}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5, fontFamily: 'Inter, sans-serif' }}>
              Exam Behaviour
            </Typography>
            {[
              { name: 'shuffleQuestions', label: 'Shuffle Questions', desc: 'Randomise question order for each student', icon: IconAdjustments },
              { name: 'allowReview', label: 'Allow Review', desc: 'Students can revisit answered questions', icon: IconListCheck },
            ].map(({ name, label, desc, icon: Icon }) => (
              <Box key={name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Icon size={15} color="rgba(235,235,245,0.4)" />
                  <Box>
                    <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.8)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>{desc}</Typography>
                  </Box>
                </Box>
                <Switch
                  name={name}
                  checked={!!formData[name]}
                  onChange={handleChange}
                  size="small"
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#30D158' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#30D158' } }}
                />
              </Box>
            ))}
          </Box>

          {/* Tags */}
          <Box sx={sectionSx}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2, fontFamily: 'Inter, sans-serif' }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag and press Enter"
                style={{ ...inputSx, flex: 1 }}
              />
              <Button onClick={addTag} disabled={!tagInput.trim()} sx={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(235,235,245,0.7)', borderRadius: '10px', px: 2, textTransform: 'none', fontFamily: 'Inter, sans-serif', flexShrink: 0, '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' } }}>
                Add
              </Button>
            </Box>
            {formData.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {formData.tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} deleteIcon={<IconX size={12} />} size="small"
                    sx={{ backgroundColor: 'rgba(10,132,255,0.12)', color: '#0A84FF', fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', fontWeight: 500, border: '0.5px solid rgba(10,132,255,0.25)', '& .MuiChip-deleteIcon': { color: 'rgba(10,132,255,0.6)' } }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Schedule */}
          <Box sx={sectionSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                Schedule
              </Typography>
              {timeWindow && (
                <Box sx={{ backgroundColor: 'rgba(48,209,88,0.12)', border: '0.5px solid rgba(48,209,88,0.2)', borderRadius: '20px', px: 1.5, py: 0.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#30D158', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{timeWindow} window</Typography>
                </Box>
              )}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <IconCalendar size={14} color="rgba(235,235,245,0.4)" />
                    <Typography component="label" sx={labelSx}>Live Date & Time</Typography>
                  </Box>
                  <input name="liveDate" type="datetime-local" value={formData.liveDate} onChange={handleChange} required style={inputSx} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <IconCalendarOff size={14} color="rgba(235,235,245,0.4)" />
                    <Typography component="label" sx={labelSx}>Deadline</Typography>
                  </Box>
                  <input name="deadDate" type="datetime-local" value={formData.deadDate} onChange={handleChange} required style={inputSx} />
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              onClick={() => navigate('/all-exams')}
              disabled={isUpdating}
              sx={{ color: 'rgba(235,235,245,0.6)', borderRadius: '980px', px: 2.5, textTransform: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 500, '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={16} />}
              sx={{ backgroundColor: '#0A84FF', color: '#fff', borderRadius: '980px', px: 2.5, textTransform: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 600, '&:hover': { backgroundColor: '#409CFF' }, '&:disabled': { opacity: 0.5 } }}
            >
              {isUpdating ? 'Saving…' : 'Save Changes'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default EditExamPage;
