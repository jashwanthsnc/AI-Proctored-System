import React, { useState } from 'react';
import { Typography, Box, IconButton } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import QuestionsList from './components/QuestionsList';
import AddQuestionForm from './components/AddQuestionForm';
import AddCodingQuestionForm from './components/AddCodingQuestionForm';

const viewTitles = {
  list: { title: 'Question Bank', sub: 'Manage MCQ and coding questions for your exams' },
  'mcq-form': { title: 'Add MCQ Question', sub: 'Create a new multiple choice question' },
  'mcq-edit': { title: 'Edit MCQ Question', sub: 'Update the question details' },
  'coding-form': { title: 'Add Coding Question', sub: 'Create a new coding challenge' },
  'coding-edit': { title: 'Edit Coding Question', sub: 'Update the coding challenge' },
};

const AddQuestions = () => {
  const [currentView, setCurrentView] = useState('list');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingCodingQuestion, setEditingCodingQuestion] = useState(null);

  const [selectedExamId, setSelectedExamId] = useState(() => localStorage.getItem('selectedExamId') || 'all');

  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    localStorage.setItem('selectedExamId', examId);
  };

  const handleBackToList = () => { setCurrentView('list'); setEditingQuestion(null); setEditingCodingQuestion(null); };
  const handleAddMCQ = () => { setEditingQuestion(null); setCurrentView('mcq-form'); };
  const handleEditMCQ = (q) => { setEditingQuestion(q); setEditingCodingQuestion(null); setCurrentView('mcq-edit'); };
  const handleAddCoding = () => { setEditingCodingQuestion(null); setCurrentView('coding-form'); };
  const handleEditCoding = (q) => { setEditingCodingQuestion(q); setEditingQuestion(null); setCurrentView('coding-edit'); };

  const { title, sub } = viewTitles[currentView] || viewTitles.list;

  return (
    <PageContainer title="Question Bank">
      <Box sx={{ pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          {currentView !== 'list' && (
            <IconButton
              onClick={handleBackToList}
              size="small"
              sx={{ color: 'rgba(235,235,245,0.6)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              <IconArrowLeft size={18} />
            </IconButton>
          )}
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.45)', mt: 0.75, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
              {sub}
            </Typography>
          </Box>
        </Box>

        {currentView === 'list' && (
          <QuestionsList
            onAddMCQ={handleAddMCQ}
            onAddCoding={handleAddCoding}
            onEditMCQ={handleEditMCQ}
            onEditCoding={handleEditCoding}
            selectedExamId={selectedExamId}
            onExamChange={handleExamChange}
          />
        )}

        {(currentView === 'mcq-form' || currentView === 'mcq-edit') && (
          <AddQuestionForm
            onSuccess={handleBackToList}
            editingQuestion={editingQuestion}
            selectedExamId={selectedExamId}
          />
        )}

        {(currentView === 'coding-form' || currentView === 'coding-edit') && (
          <AddCodingQuestionForm
            onSuccess={handleBackToList}
            editingQuestion={editingCodingQuestion}
            selectedExamId={selectedExamId}
          />
        )}
      </Box>
    </PageContainer>
  );
};

export default AddQuestions;
