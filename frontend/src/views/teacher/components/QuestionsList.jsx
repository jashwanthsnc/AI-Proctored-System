import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Quiz, Code, CheckCircle, Cancel, Edit, Delete, Visibility } from '@mui/icons-material';
import { useGetExamsQuery, useGetQuestionsQuery, useDeleteQuestionMutation, useGetCodingQuestionsQuery, useDeleteCodingQuestionMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const QuestionsList = ({ onAddMCQ, onAddCoding, onEditMCQ, onEditCoding, selectedExamId, onExamChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('mcq'); // 'mcq' or 'coding'

  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery();
  const { data: mcqQuestions, isLoading: mcqLoading } = useGetQuestionsQuery(
    selectedExamId !== 'all' ? selectedExamId : null,
    { skip: selectedExamId === 'all' }
  );

  const { data: codingQuestionsData, isLoading: codingLoading } = useGetCodingQuestionsQuery(
    selectedExamId !== 'all' ? selectedExamId : null,
    { skip: selectedExamId === 'all' }
  );

  const [deleteQuestion, { isLoading: isDeleting }] = useDeleteQuestionMutation();
  const [deleteCodingQuestion, { isLoading: isDeletingCoding }] = useDeleteCodingQuestionMutation();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDeleteClick = (question, type = 'mcq') => {
    setQuestionToDelete(question);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === 'coding') {
        await deleteCodingQuestion(questionToDelete._id).unwrap();
      } else {
        await deleteQuestion(questionToDelete._id).unwrap();
      }
      toast.success(`${deleteType === 'coding' ? 'Coding' : 'MCQ'} question deleted successfully`);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete question');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const handleEditClick = (question) => {
    if (onEditMCQ) {
      onEditMCQ(question);
    }
  };

  const handleEditCodingClick = (question) => {
    if (onEditCoding) {
      onEditCoding(question);
    }
  };

  // Filter questions based on selected exam
  const filteredMCQQuestions = selectedExamId === 'all' ? [] : mcqQuestions || [];
  const filteredCodingQuestions = selectedExamId === 'all' ? [] : codingQuestionsData?.data || [];

  return (
    <Box>
      {/* Header with Exam Filter */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select Exam</InputLabel>
          <Select
            value={selectedExamId}
            onChange={(e) => onExamChange(e.target.value)}
            label="Select Exam"
          >
            <MenuItem value="all">All Exams</MenuItem>
            {examsData?.map((exam) => (
              <MenuItem key={exam.examId} value={exam.examId}>
                {exam.examName} ({exam.totalQuestions} questions)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            icon={<Quiz />}
            iconPosition="start"
            label={`MCQ Questions ${filteredMCQQuestions.length > 0 ? `(${filteredMCQQuestions.length})` : ''}`}
          />
          <Tab 
            icon={<Code />} 
            iconPosition="start" 
            label={`Coding Questions ${filteredCodingQuestions.length > 0 ? `(${filteredCodingQuestions.length})` : ''}`}
          />
        </Tabs>
      </Paper>

      {/* MCQ Questions Tab */}
      <TabPanel value={activeTab} index={0}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">MCQ Questions</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddMCQ}
            disabled={selectedExamId === 'all'}
          >
            Add MCQ Question
          </Button>
        </Stack>

        {selectedExamId === 'all' ? (
          <Alert severity="info">Please select an exam to view and add questions</Alert>
        ) : mcqLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : !filteredMCQQuestions || filteredMCQQuestions.length === 0 ? (
          <Alert severity="warning">
            No MCQ questions found for this exam. Click "Add MCQ Question" to create one.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="5%">#</TableCell>
                  <TableCell width="45%">Question</TableCell>
                  <TableCell width="15%">Options</TableCell>
                  <TableCell width="20%">Correct Answer</TableCell>
                  <TableCell width="15%">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMCQQuestions.map((question, index) => (
                  <TableRow key={question._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body1"
                        dangerouslySetInnerHTML={{ __html: question.question }}
                      />
                    </TableCell>
                    <TableCell>{question.options?.length || 0} options</TableCell>
                    <TableCell>
                      {question.options
                        ?.filter((opt) => opt.isCorrect)
                        .map((opt, i) => (
                          <Chip
                            key={i}
                            label={opt.optionText}
                            size="small"
                            color="success"
                            icon={<CheckCircle />}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(question)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(question)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Coding Questions Tab */}
      <TabPanel value={activeTab} index={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Coding Questions</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddCoding}
            disabled={selectedExamId === 'all'}
          >
            Add Coding Question
          </Button>
        </Stack>

        {selectedExamId === 'all' ? (
          <Alert severity="info">Please select an exam to view and add coding questions</Alert>
        ) : codingLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : !filteredCodingQuestions || filteredCodingQuestions.length === 0 ? (
          <Alert severity="warning">
            No coding questions found for this exam. Click "Add Coding Question" to create one.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="5%">#</TableCell>
                  <TableCell width="30%">Question</TableCell>
                  <TableCell width="35%">Description</TableCell>
                  <TableCell width="10%">Difficulty</TableCell>
                  <TableCell width="10%">Time/Points</TableCell>
                  <TableCell width="10%">Test Cases</TableCell>
                  <TableCell width="10%">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCodingQuestions.map((question, index) => (
                  <TableRow key={question._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={500}>
                        {question.question}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: question.description?.substring(0, 100) + '...' 
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={question.difficulty}
                        size="small"
                        color={
                          question.difficulty === 'easy' ? 'success' :
                          question.difficulty === 'medium' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {question.timeLimit} min
                      </Typography>
                      <Typography variant="caption" color="primary">
                        {question.points} pts
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {question.testCases?.length || 0} total
                      </Typography>
                      <Typography variant="caption" color="primary">
                        {question.testCases?.filter(tc => tc.isSample).length || 0} sample
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditCodingClick(question)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(question, 'coding')}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this question? This action cannot be undone.
          </DialogContentText>
          {questionToDelete && (
            <Box mt={2} p={2} sx={{ bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography 
                variant="body2"
                dangerouslySetInnerHTML={{ __html: questionToDelete.question }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting || isDeletingCoding}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting || isDeletingCoding}
          >
            {(isDeleting || isDeletingCoding) ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionsList;
