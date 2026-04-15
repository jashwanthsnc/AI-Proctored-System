import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Grid,
  CircularProgress,
  Switch,
  Chip,
} from '@mui/material';
import {
  IconClipboard,
  IconClock,
  IconHash,
  IconCalendar,
  IconCalendarOff,
  IconRocket,
  IconInfoCircle,
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

const sectionSx = {
  backgroundColor: '#111113',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  p: 3,
  mb: 2.5,
};

const sectionTitleSx = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: 'rgba(235,235,245,0.3)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  fontFamily: 'Inter, sans-serif',
  mb: 2.5,
};

const labelSx = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'rgba(235,235,245,0.55)',
  fontFamily: 'Inter, sans-serif',
  letterSpacing: '-0.005em',
  mb: 0.625,
  display: 'block',
};

const getInputSx = (hasError) => ({
  width: '100%',
  background: 'rgba(255,255,255,0.055)',
  border: `0.5px solid ${hasError ? 'rgba(255,69,58,0.55)' : 'rgba(255,255,255,0.09)'}`,
  borderRadius: '10px',
  padding: '10px 13px',
  color: '#FFFFFF',
  fontSize: '0.9375rem',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  colorScheme: 'dark',
  lineHeight: '1.5',
});

const focusStyle = {
  borderColor: 'rgba(10,132,255,0.6)',
  boxShadow: '0 0 0 3px rgba(10,132,255,0.12)',
};

const FieldLabel = ({ icon: Icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.625 }}>
    <Icon size={13} color="rgba(235,235,245,0.35)" />
    <Typography component="label" sx={labelSx}>{label}</Typography>
  </Box>
);

const FieldError = ({ msg }) => msg ? (
  <Typography sx={{ fontSize: '0.75rem', color: '#FF453A', fontFamily: 'Inter, sans-serif', mt: 0.5, letterSpacing: '-0.005em' }}>
    {msg}
  </Typography>
) : null;

const ToggleRow = ({ icon: Icon, label, desc, name, value, onChange, disabled }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Icon size={15} color="rgba(235,235,245,0.4)" />
      <Box>
        <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.8)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{label}</Typography>
        {desc && <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>{desc}</Typography>}
      </Box>
    </Box>
    <Switch
      name={name}
      checked={!!value}
      onChange={onChange}
      disabled={disabled}
      size="small"
      sx={{
        '& .MuiSwitch-switchBase.Mui-checked': { color: '#30D158' },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#30D158' },
      }}
    />
  </Box>
);

const ExamForm = ({ formik, isLoading }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit, isSubmitting, setFieldValue } = formik;
  const [tagInput, setTagInput] = useState('');

  const timeDifference = useMemo(() => {
    if (values.liveDate && values.deadDate) {
      const diff = new Date(values.deadDate) - new Date(values.liveDate);
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        return days > 0 ? `${days}d ${hours % 24}h window` : `${hours}h window`;
      }
    }
    return null;
  }, [values.liveDate, values.deadDate]);

  const isFormDisabled = isSubmitting || isLoading;

  const inp = (field, extra = {}) => ({
    ...getInputSx(touched[field] && Boolean(errors[field])),
    ...extra,
  });

  const addFocus = (e) => {
    e.target.style.borderColor = focusStyle.borderColor;
    e.target.style.boxShadow = focusStyle.boxShadow;
  };
  const removeFocus = (e, field) => {
    e.target.style.borderColor = touched[field] && errors[field]
      ? 'rgba(255,69,58,0.55)'
      : 'rgba(255,255,255,0.09)';
    e.target.style.boxShadow = 'none';
    handleBlur(e);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const current = values.tags || [];
    if (!current.includes(tag)) {
      setFieldValue('tags', [...current, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setFieldValue('tags', (values.tags || []).filter((t) => t !== tag));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>

      {/* ── Basic Information ──────────────────────────────────── */}
      <Box sx={sectionSx}>
        <Typography sx={sectionTitleSx}>Basic Information</Typography>
        <Stack spacing={2.5}>

          {/* Exam Name */}
          <Box>
            <FieldLabel icon={IconClipboard} label="Exam Name *" />
            <input
              name="examName"
              value={values.examName}
              onChange={handleChange}
              onFocus={addFocus}
              onBlur={(e) => removeFocus(e, 'examName')}
              disabled={isFormDisabled}
              placeholder="e.g., Data Structures Final Exam"
              style={inp('examName')}
            />
            <FieldError msg={touched.examName && errors.examName} />
          </Box>

          {/* Description */}
          <Box>
            <FieldLabel icon={IconNotes} label="Description" />
            <textarea
              name="description"
              value={values.description || ''}
              onChange={handleChange}
              onFocus={addFocus}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                e.target.style.boxShadow = 'none';
                handleBlur(e);
              }}
              disabled={isFormDisabled}
              placeholder="Briefly describe what this exam covers…"
              rows={3}
              style={{ ...getInputSx(false), resize: 'vertical' }}
            />
          </Box>

          {/* Duration / Questions / Passing Score */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box>
                <FieldLabel icon={IconClock} label="Duration (min) *" />
                <input
                  name="duration"
                  type="number"
                  value={values.duration}
                  onChange={handleChange}
                  onFocus={addFocus}
                  onBlur={(e) => removeFocus(e, 'duration')}
                  disabled={isFormDisabled}
                  placeholder="60"
                  min="1"
                  style={inp('duration')}
                />
                <FieldError msg={touched.duration && errors.duration} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <FieldLabel icon={IconHash} label="Questions *" />
                <input
                  name="totalQuestions"
                  type="number"
                  value={values.totalQuestions}
                  onChange={handleChange}
                  onFocus={addFocus}
                  onBlur={(e) => removeFocus(e, 'totalQuestions')}
                  disabled={isFormDisabled}
                  placeholder="20"
                  min="1"
                  style={inp('totalQuestions')}
                />
                <FieldError msg={touched.totalQuestions && errors.totalQuestions} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <FieldLabel icon={IconPercentage} label="Pass Score (%)" />
                <input
                  name="passingScore"
                  type="number"
                  value={values.passingScore || ''}
                  onChange={handleChange}
                  onFocus={addFocus}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                    e.target.style.boxShadow = 'none';
                    handleBlur(e);
                  }}
                  disabled={isFormDisabled}
                  placeholder="60"
                  min="1"
                  max="100"
                  style={getInputSx(false)}
                />
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </Box>

      {/* ── Schedule ──────────────────────────────────────────── */}
      <Box sx={sectionSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Typography sx={sectionTitleSx}>Schedule</Typography>
          {timeDifference && (
            <Box sx={{ backgroundColor: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.2)', borderRadius: '20px', px: 1.5, py: 0.375 }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#30D158', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                {timeDifference}
              </Typography>
            </Box>
          )}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <FieldLabel icon={IconCalendar} label="Live Date & Time *" />
              <input
                name="liveDate"
                type="datetime-local"
                value={values.liveDate}
                onChange={handleChange}
                onFocus={addFocus}
                onBlur={(e) => removeFocus(e, 'liveDate')}
                disabled={isFormDisabled}
                style={inp('liveDate')}
              />
              <FieldError msg={touched.liveDate && errors.liveDate} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <FieldLabel icon={IconCalendarOff} label="Deadline *" />
              <input
                name="deadDate"
                type="datetime-local"
                value={values.deadDate}
                onChange={handleChange}
                onFocus={addFocus}
                onBlur={(e) => removeFocus(e, 'deadDate')}
                disabled={isFormDisabled}
                style={inp('deadDate')}
              />
              <FieldError msg={touched.deadDate && errors.deadDate} />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Subject & Instructions ────────────────────────────── */}
      <Box sx={sectionSx}>
        <Typography sx={sectionTitleSx}>Subject & Instructions</Typography>
        <Stack spacing={2.5}>
          <Box>
            <FieldLabel icon={IconBook} label="Subject" />
            <input
              name="subject"
              value={values.subject || ''}
              onChange={handleChange}
              onFocus={addFocus}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; handleBlur(e); }}
              disabled={isFormDisabled}
              placeholder="e.g., Computer Science, Mathematics"
              style={getInputSx(false)}
            />
          </Box>
          <Box>
            <FieldLabel icon={IconListCheck} label="Student Instructions" />
            <textarea
              name="instructions"
              value={values.instructions || ''}
              onChange={handleChange}
              onFocus={addFocus}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; handleBlur(e); }}
              disabled={isFormDisabled}
              placeholder="e.g., Read each question carefully. No calculators allowed. Submit before the deadline."
              rows={4}
              style={{ ...getInputSx(false), resize: 'vertical' }}
            />
          </Box>
        </Stack>
      </Box>

      {/* ── Scoring ───────────────────────────────────────────── */}
      <Box sx={sectionSx}>
        <Typography sx={sectionTitleSx}>Scoring</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box>
              <FieldLabel icon={IconPercentage} label="Marks / Question" />
              <input
                name="marksPerQuestion"
                type="number"
                value={values.marksPerQuestion !== undefined ? values.marksPerQuestion : ''}
                onChange={handleChange}
                onFocus={addFocus}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; handleBlur(e); }}
                disabled={isFormDisabled}
                placeholder="1"
                min="0"
                step="0.5"
                style={getInputSx(false)}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box>
              <FieldLabel icon={IconMinus} label="Negative Marking" />
              <input
                name="negativeMarking"
                type="number"
                value={values.negativeMarking !== undefined ? values.negativeMarking : ''}
                onChange={handleChange}
                onFocus={addFocus}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; handleBlur(e); }}
                disabled={isFormDisabled}
                placeholder="0"
                min="0"
                step="0.25"
                style={getInputSx(false)}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box>
              <FieldLabel icon={IconRepeat} label="Max Attempts" />
              <input
                name="maxAttempts"
                type="number"
                value={values.maxAttempts !== undefined ? values.maxAttempts : ''}
                onChange={handleChange}
                onFocus={addFocus}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; handleBlur(e); }}
                disabled={isFormDisabled}
                placeholder="1"
                min="1"
                max="10"
                style={getInputSx(false)}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Exam Behaviour ────────────────────────────────────── */}
      <Box sx={sectionSx}>
        <Typography sx={sectionTitleSx}>Exam Behaviour</Typography>
        <ToggleRow
          icon={IconAdjustments}
          label="Shuffle Questions"
          desc="Randomise question order for each student"
          name="shuffleQuestions"
          value={values.shuffleQuestions}
          onChange={handleChange}
          disabled={isFormDisabled}
        />
        <Box sx={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', my: 0.5 }} />
        <ToggleRow
          icon={IconListCheck}
          label="Allow Review"
          desc="Students can revisit answered questions before submitting"
          name="allowReview"
          value={values.allowReview}
          onChange={handleChange}
          disabled={isFormDisabled}
        />
      </Box>

      {/* ── Tags ──────────────────────────────────────────────── */}
      <Box sx={sectionSx}>
        <Typography sx={sectionTitleSx}>Tags</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            onFocus={addFocus}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
            disabled={isFormDisabled}
            placeholder="Add a tag and press Enter"
            style={{ ...getInputSx(false), flex: 1 }}
          />
          <Button
            onClick={addTag}
            disabled={isFormDisabled || !tagInput.trim()}
            sx={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(235,235,245,0.7)', borderRadius: '10px', px: 2, textTransform: 'none', fontFamily: 'Inter, sans-serif', flexShrink: 0, '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' } }}
          >
            Add
          </Button>
        </Box>
        {(values.tags || []).length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {(values.tags || []).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => removeTag(tag)}
                deleteIcon={<IconX size={12} />}
                size="small"
                sx={{
                  backgroundColor: 'rgba(10,132,255,0.12)',
                  color: '#0A84FF',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  border: '0.5px solid rgba(10,132,255,0.25)',
                  '& .MuiChip-deleteIcon': { color: 'rgba(10,132,255,0.6)', '&:hover': { color: '#0A84FF' } },
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Submit ────────────────────────────────────────────── */}
      <Button
        type="submit"
        disabled={isFormDisabled}
        fullWidth
        startIcon={isFormDisabled
          ? <CircularProgress size={15} color="inherit" />
          : <IconRocket size={15} />}
        sx={{
          backgroundColor: '#0A84FF',
          color: '#fff',
          borderRadius: '12px',
          py: 1.5,
          fontSize: '0.9375rem',
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          textTransform: 'none',
          letterSpacing: '-0.01em',
          boxShadow: '0 4px 20px rgba(10,132,255,0.3)',
          mb: 2,
          '&:hover': { backgroundColor: '#409CFF', boxShadow: '0 6px 24px rgba(10,132,255,0.45)' },
          '&:disabled': { opacity: 0.45, boxShadow: 'none' },
        }}
      >
        {isFormDisabled ? 'Creating…' : 'Create Exam'}
      </Button>

      {/* ── Hint ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', backgroundColor: 'rgba(10,132,255,0.05)', border: '0.5px solid rgba(10,132,255,0.12)', borderRadius: '10px', p: 1.625 }}>
        <IconInfoCircle size={14} color="#0A84FF" style={{ marginTop: 2, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.8rem', color: 'rgba(235,235,245,0.45)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
          After creating, you'll be redirected to All Exams to assign students and add questions.
        </Typography>
      </Box>
    </Box>
  );
};

export default ExamForm;
