import React from 'react';
import PageContainer from 'src/components/container/PageContainer';
import Exams from './Components/Exams';

const ExamPage = () => {
  return (
    <PageContainer title="My Exams" description="Active Exams">
      <Exams />
    </PageContainer>
  );
};

export default ExamPage;
