import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Stack,
  Select,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Paper,
  Typography,
  Chip,
  Alert,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Code, Schedule, EmojiEvents, Save, Refresh } from '@mui/icons-material';
import { useGetExamsQuery, useUpdateCodingQuestionMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';
import axiosInstance from '../../../axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AddCodingQuestionForm = ({ onSuccess, editingQuestion, selectedExamId: propSelectedExamId }) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timeLimit, setTimeLimit] = useState(30);
  const [points, setPoints] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery();
  const [updateCodingQuestion] = useUpdateCodingQuestionMutation();

  const isEditMode = Boolean(editingQuestion);

  // Load editing question data
  useEffect(() => {
    if (editingQuestion) {
      setQuestion(editingQuestion.question || '');
      setDescription(editingQuestion.description || '');
      setDifficulty(editingQuestion.difficulty || 'medium');
      setTimeLimit(editingQuestion.timeLimit || 30);
      setPoints(editingQuestion.points || 100);
      setSelectedExamId(editingQuestion.examId || '');
    }
  }, [editingQuestion]);

  useEffect(() => {
    if (!isEditMode && examsData && examsData.length > 0) {
      // Use the prop selectedExamId if provided and not 'all', otherwise use first exam
      if (propSelectedExamId && propSelectedExamId !== 'all') {
        setSelectedExamId(propSelectedExamId);
      } else {
        setSelectedExamId(examsData[0].examId);
      }
    }
  }, [examsData, isEditMode, propSelectedExamId]);

  const handleReset = () => {
    setQuestion('');
    setDescription('');
    setDifficulty('medium');
    setTimeLimit(30);
    setPoints(100);
  };

  const handleAddOrUpdateCodingQuestion = async () => {
    // Validation
    if (!selectedExamId && !isEditMode) {
      toast.error('Please select an exam');
      return;
    }

    if (question.trim() === '') {
      toast.error('Please enter a question');
      return;
    }

    if (description.trim() === '' || description === '<p><br></p>') {
      toast.error('Please enter a description');
      return;
    }

    if (timeLimit < 1) {
      toast.error('Time limit must be at least 1 minute');
      return;
    }

    if (points < 1) {
      toast.error('Points must be at least 1');
      return;
    }

    const codingQuestionData = {
      question,
      description,
      difficulty,
      timeLimit,
      points,
    };

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Update existing coding question
        const response = await updateCodingQuestion({
          id: editingQuestion._id,
          ...codingQuestionData,
        }).unwrap();

        if (response.success) {
          toast.success('🎉 Coding question updated successfully!');
          if (onSuccess) {
            setTimeout(() => onSuccess(), 1500);
          }
        }
      } else {
        // Create new coding question
        const response = await axiosInstance.post(
          '/api/coding/question',
          {
            ...codingQuestionData,
            examId: selectedExamId,
          },
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          toast.success('🎉 Coding question added successfully!');
          handleReset();
          // Call onSuccess callback if provided
          if (onSuccess) {
            setTimeout(() => onSuccess(), 1500); // Delay to show success message
          }
        } else {
          toast.error(response.data.message || 'Failed to add coding question');
        }
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} coding question:`, err);
      const errorMessage =
        err.response?.data?.message || 
        err.message || 
        `Failed to ${isEditMode ? 'update' : 'add'} coding question. Please try again.`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  // Rich text editor configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ color: [] }, { background: [] }],
      ['code-block'],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'script',
    'color', 'background',
    'code-block',
    'link',
    'image',
  ];

  return (
    <Box>
      {/* Exam Selection */}
      {!isEditMode && (
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderLeft: 4, borderColor: 'primary.main' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Code color="primary" />
            Select Exam
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which exam this coding question belongs to
          </Typography>

          <FormControl fullWidth disabled={examsLoading}>
            <InputLabel>Exam</InputLabel>
            <Select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              label="Exam"
            >
              {examsData?.map((exam) => (
                <MenuItem key={exam.examId} value={exam.examId}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography>{exam.examName}</Typography>
                    <Chip label={`${exam.totalQuestions} questions`} size="small" />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      {isEditMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Editing question for exam: <strong>{examsData?.find(e => e.examId === selectedExamId)?.examName}</strong>
        </Alert>
      )}
      {/* Question Details */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderLeft: 4, borderColor: 'success.main' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Code color="success" />
          Question Details
        </Typography>

        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Question Title */}
          <TextField
            label="Question Title"
            placeholder="e.g., Implement Binary Search Tree"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            fullWidth
            required
            helperText="A clear, concise title for the coding problem"
          />

          {/* Question Description with Rich Text Editor */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Description & Instructions *
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                '& .ql-toolbar': {
                  backgroundColor: '#f5f5f5',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                },
                '& .ql-container': {
                  backgroundColor: 'white',
                  borderBottomLeftRadius: '4px',
                  borderBottomRightRadius: '4px',
                  minHeight: '200px',
                },
                '& .ql-editor': {
                  minHeight: '200px',
                  fontSize: '14px',
                  color: '#000',
                },
                '& .ql-toolbar button': {
                  color: '#444',
                },
                '& .ql-toolbar button:hover': {
                  color: '#000',
                },
                '& .ql-toolbar .ql-stroke': {
                  stroke: '#444',
                },
                '& .ql-toolbar .ql-fill': {
                  fill: '#444',
                },
                '& .ql-toolbar button:hover .ql-stroke': {
                  stroke: '#000',
                },
                '& .ql-toolbar button:hover .ql-fill': {
                  fill: '#000',
                },
                '& .ql-toolbar .ql-active .ql-stroke': {
                  stroke: '#1976d2',
                },
                '& .ql-toolbar .ql-active .ql-fill': {
                  fill: '#1976d2',
                },
                '& .ql-picker-label': {
                  color: '#444',
                },
                '& .ql-picker-options': {
                  backgroundColor: 'white',
                },
              }}
            >
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Provide detailed problem description, input/output format, constraints, and examples. You can format text, add code blocks, lists, etc."
              />
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Include problem statement, input/output specifications, constraints, and sample test cases
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Question Configuration */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderLeft: 4, borderColor: 'warning.main' }}>
        <Typography variant="h6" gutterBottom>
          Configuration
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Difficulty */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                label="Difficulty Level"
              >
                <MenuItem value="easy">
                  <Chip label="Easy" color="success" size="small" sx={{ mr: 1 }} />
                  Easy
                </MenuItem>
                <MenuItem value="medium">
                  <Chip label="Medium" color="warning" size="small" sx={{ mr: 1 }} />
                  Medium
                </MenuItem>
                <MenuItem value="hard">
                  <Chip label="Hard" color="error" size="small" sx={{ mr: 1 }} />
                  Hard
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Time Limit */}
          <Grid item xs={12} md={4}>
            <TextField
              label="Time Limit"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Schedule />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption">minutes</Typography>
                  </InputAdornment>
                ),
              }}
              helperText="Time allocated for this question"
            />
          </Grid>

          {/* Points */}
          <Grid item xs={12} md={4}>
            <TextField
              label="Points"
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmojiEvents />
                  </InputAdornment>
                ),
              }}
              helperText="Points awarded for correct answer"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Preview */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Preview:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <Chip
            label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            color={getDifficultyColor(difficulty)}
            size="small"
          />
          <Chip label={`${timeLimit} minutes`} size="small" />
          <Chip label={`${points} points`} size="small" />
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Students will be able to code in <strong>JavaScript, Python, Java, and C++</strong>
        </Typography>
      </Alert>

      <Divider sx={{ mb: 3 }} />

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        {!isEditMode && (
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReset}
            disabled={isSubmitting}
          >
            Reset
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleAddOrUpdateCodingQuestion}
          disabled={isSubmitting}
          size="large"
        >
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Coding Question' : 'Save Coding Question')}
        </Button>
      </Stack>

      {/* Helper Text */}
      <Alert severity="success" icon={<Code />} sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Pro Tip:</strong> Write clear problem statements with examples. Include edge cases
          in your description to help students understand the requirements better.
        </Typography>
      </Alert>
    </Box>
  );
};

export default AddCodingQuestionForm;
