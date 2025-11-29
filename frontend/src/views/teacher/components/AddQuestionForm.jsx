import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Select,
  MenuItem,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import swal from 'sweetalert';
import { v4 as uuidv4 } from 'uuid';
import { useCreateQuestionMutation, useGetExamsQuery, useUpdateQuestionMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AddQuestionForm = ({ onSuccess, editingQuestion, selectedExamId: propSelectedExamId }) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctOptions, setCorrectOptions] = useState([false, false, false, false]);
  const [selectedExamId, setSelectedExamId] = useState('');

  const handleOptionChange = (index) => {
    const updatedCorrectOptions = [...correctOptions];
    updatedCorrectOptions[index] = !correctOptions[index];
    setCorrectOptions(updatedCorrectOptions);
  };

  const [createQuestion, { isLoading: isCreating }] = useCreateQuestionMutation();
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionMutation();
  const { data: examsData } = useGetExamsQuery();

  const isLoading = isCreating || isUpdating;
  const isEditMode = Boolean(editingQuestion);

  // Load editing question data
  useEffect(() => {
    if (editingQuestion) {
      setNewQuestion(editingQuestion.question);
      setSelectedExamId(editingQuestion.examId);
      
      // Load options
      const options = editingQuestion.options || [];
      const optionTexts = options.map(opt => opt.optionText);
      const correctOpts = options.map(opt => opt.isCorrect);
      
      // Pad to 4 options
      while (optionTexts.length < 4) {
        optionTexts.push('');
        correctOpts.push(false);
      }
      
      setNewOptions(optionTexts);
      setCorrectOptions(correctOpts);
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

  const handleAddOrUpdateQuestion = async () => {
    if (newQuestion.trim() === '' || newOptions.some((option) => option.trim() === '')) {
      swal('', 'Please fill out the question and all options.', 'error');
      return;
    }

    // Validate at least one correct answer
    if (!correctOptions.some((isCorrect) => isCorrect)) {
      swal('', 'Please mark at least one correct answer.', 'error');
      return;
    }

    const questionData = {
      question: newQuestion,
      options: newOptions.map((option, index) => ({
        id: uuidv4(),
        optionText: option,
        isCorrect: correctOptions[index],
      })),
    };

    try {
      if (isEditMode) {
        // Update existing question
        const res = await updateQuestion({
          id: editingQuestion._id,
          ...questionData,
        }).unwrap();
        
        if (res) {
          toast.success('Question updated successfully!');
          if (onSuccess) {
            setTimeout(() => onSuccess(), 1500);
          }
        }
      } else {
        // Create new question
        const newQuestionObj = {
          ...questionData,
          examId: selectedExamId,
        };

        const res = await createQuestion(newQuestionObj).unwrap();
        if (res) {
          toast.success('Question added successfully!!!');
          if (onSuccess) {
            setTimeout(() => onSuccess(), 1500);
          }
        }
        setQuestions([...questions, res]);
      }
      
      // Reset form
      setNewQuestion('');
      setNewOptions(['', '', '', '']);
      setCorrectOptions([false, false, false, false]);
    } catch (err) {
      swal('', `Failed to ${isEditMode ? 'update' : 'create'} question. Please try again.`, 'error');
    }
  };

  const handleSubmitQuestions = () => {
    setQuestions([]);
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectOptions([false, false, false, false]);
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
      ['link'],
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
  ];

  return (
    <div>
      {!isEditMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Questions are saved immediately when you click "Add Question". You can add multiple questions to the selected exam.
        </Alert>
      )}

      {!isEditMode && (
        <Select
          label="Select Exam"
          value={selectedExamId}
          onChange={(e) => {
            console.log(e.target.value, 'option ID');
            setSelectedExamId(e.target.value);
          }}
          fullWidth
          sx={{ mb: 2 }}
        >
          {examsData &&
            examsData.map((exam) => (
              <MenuItem key={exam.examId} value={exam.examId}>
                {exam.examName}
              </MenuItem>
            ))}
        </Select>
      )}

      {isEditMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Editing question for exam: <strong>{examsData?.find(e => e.examId === selectedExamId)?.examName}</strong>
        </Alert>
      )}

      {!isEditMode && questions.map((questionObj, questionIndex) => (
        <div key={questionIndex}>
          <TextField
            label={`Question ${questionIndex + 1}`}
            value={questionObj.question}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
          />
          {questionObj.options.map((option, optionIndex) => (
            <div key={optionIndex}>
              <TextField
                label={`Option ${optionIndex + 1}`}
                value={option.optionText}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
              <FormControlLabel
                control={<Checkbox checked={option.isCorrect} disabled />}
                label={`Correct Option ${optionIndex + 1}`}
              />
            </div>
          ))}
        </div>
      ))}

      <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>
        {isEditMode ? 'Question Content' : 'New Question'}
      </Typography>
      
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 2, 
          border: '1px solid #e0e0e0',
          '& .ql-toolbar': {
            backgroundColor: '#f5f5f5',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
          },
          '& .ql-container': {
            backgroundColor: 'white',
            borderBottomLeftRadius: '4px',
            borderBottomRightRadius: '4px',
            minHeight: '150px',
          },
          '& .ql-editor': {
            minHeight: '150px',
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
          value={newQuestion}
          onChange={setNewQuestion}
          modules={quillModules}
          formats={quillFormats}
          placeholder="Enter your question here... You can format text, add lists, code blocks, etc."
        />
      </Paper>

      {newOptions.map((option, index) => (
        <Stack
          key={index}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          mb={1}
        >
          <TextField
            label={`Option ${index + 1}`}
            value={newOptions[index]}
            onChange={(e) => {
              const updatedOptions = [...newOptions];
              updatedOptions[index] = e.target.value;
              setNewOptions(updatedOptions);
            }}
            fullWidth
            sx={{ flex: '80%' }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={correctOptions[index]}
                onChange={() => handleOptionChange(index)}
              />
            }
            label={`Correct Option ${index + 1}`}
          />
        </Stack>
      ))}

      <Stack mt={2} direction="row" spacing={2}>
        <Button variant="contained" onClick={handleAddOrUpdateQuestion} disabled={isLoading}>
          {isLoading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Question' : 'Add Question')}
        </Button>
        {!isEditMode && (
          <Button variant="outlined" onClick={handleSubmitQuestions}>
            Clear Form
          </Button>
        )}
      </Stack>
    </div>
  );
};

export default AddQuestionForm;
