import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      // Redirect based on user role
      if (userInfo.role === 'teacher') {
        // Teachers go to their dashboard
        navigate('/teacher-dashboard', { replace: true });
      } else {
        // Students go to their exam listing
        navigate('/exam', { replace: true });
      }
    }
  }, [userInfo, navigate]);

  // Show loading while redirecting
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <CircularProgress size={50} />
      <Typography variant="body1" color="text.secondary">
        Loading dashboard...
      </Typography>
    </Box>
  );
};

export default Dashboard;
