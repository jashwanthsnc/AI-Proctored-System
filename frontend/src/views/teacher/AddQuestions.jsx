import React, { useState } from 'react';
import { Typography, Box, Button, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import QuestionsList from './components/QuestionsList';
import AddQuestionForm from './components/AddQuestionForm';
import AddCodingQuestionForm from './components/AddCodingQuestionForm';

const AddQuestions = () => {
  const [currentView, setCurrentView] = useState('list');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingCodingQuestion, setEditingCodingQuestion] = useState(null);
  
  // Lift selectedExamId state to parent and persist in localStorage
  const [selectedExamId, setSelectedExamId] = useState(() => {
    const cached = localStorage.getItem('selectedExamId');
    return cached || 'all';
  });

  // Update localStorage whenever selectedExamId changes
  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    localStorage.setItem('selectedExamId', examId);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingQuestion(null);
    setEditingCodingQuestion(null);
  };

  const handleAddMCQ = () => {
    setEditingQuestion(null);
    setCurrentView('mcq-form');
  };

  const handleEditMCQ = (question) => {
    setEditingQuestion(question);
    setEditingCodingQuestion(null);
    setCurrentView('mcq-form');
  };

  const handleAddCoding = () => {
    setEditingCodingQuestion(null);
    setCurrentView('coding-form');
  };

  const handleEditCoding = (question) => {
    setEditingCodingQuestion(question);
    setEditingQuestion(null);
    setCurrentView('coding-form');
  };

  return (
    <PageContainer title="Question Bank" description="Manage MCQ and Coding questions">
      <DashboardCard 
        title={
          <Box display="flex" alignItems="center" gap={1}>
            {currentView !== 'list' && (
              <IconButton onClick={handleBackToList} size="small">
                <ArrowBack />
              </IconButton>
            )}
            {currentView === 'list' && 'Question Bank'}
            {currentView === 'mcq-form' && (editingQuestion ? 'Edit MCQ Question' : 'Add MCQ Question')}
            {currentView === 'coding-form' && (editingCodingQuestion ? 'Edit Coding Question' : 'Add Coding Question')}
          </Box>
        }
      >
        {currentView === 'list' && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              View and manage all your exam questions. Select an exam to see its questions or add new ones.
            </Typography>
            <QuestionsList 
              onAddMCQ={handleAddMCQ} 
              onAddCoding={handleAddCoding}
              onEditMCQ={handleEditMCQ}
              onEditCoding={handleEditCoding}
              selectedExamId={selectedExamId}
              onExamChange={handleExamChange}
            />
          </>
        )}

        {currentView === 'mcq-form' && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {editingQuestion 
                ? 'Edit the question details below. Changes will be saved immediately.'
                : 'Create multiple choice questions for your exams. Questions are saved immediately when you click "Add Question".'
              }
            </Typography>
            <AddQuestionForm 
              onSuccess={handleBackToList}
              editingQuestion={editingQuestion}
              selectedExamId={selectedExamId}
            />
          </>
        )}

        {currentView === 'coding-form' && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {editingCodingQuestion
                ? 'Edit the coding question details below. Changes will be saved immediately.'
                : 'Create coding challenges for your exams. Students will write and execute code to solve these problems.'
              }
            </Typography>
            <AddCodingQuestionForm 
              onSuccess={handleBackToList}
              editingQuestion={editingCodingQuestion}
              selectedExamId={selectedExamId}
            />
          </>
        )}
      </DashboardCard>
    </PageContainer>
  );
};

export default AddQuestions;
