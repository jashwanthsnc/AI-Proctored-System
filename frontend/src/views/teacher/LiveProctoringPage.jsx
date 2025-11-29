import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  IconEye,
  IconAlertTriangle,
  IconUsers,
  IconClipboard,
  IconRefresh,
  IconBell,
  IconDeviceMobile,
  IconUser,
  IconUserOff,
  IconShieldX,
  IconClock,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from 'src/components/shared/DashboardCard';
import {
  useGetActiveStudentsQuery,
  useGetRecentViolationsQuery,
  useGetProctoringStatsQuery,
} from 'src/slices/cheatingLogApiSlice';

const LiveProctoringPage = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastViolationCount, setLastViolationCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Fetch data with auto-refresh every 10 seconds
  const {
    data: activeStudents = [],
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useGetActiveStudentsQuery(undefined, {
    pollingInterval: 10000, // Auto-refresh every 10 seconds
  });

  const {
    data: recentViolations = [],
    isLoading: violationsLoading,
    error: violationsError,
    refetch: refetchViolations,
  } = useGetRecentViolationsQuery(undefined, {
    pollingInterval: 10000, // Auto-refresh every 10 seconds
  });

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetProctoringStatsQuery(undefined, {
    pollingInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Show notification for new violations
  useEffect(() => {
    if (notificationsEnabled && stats && stats.recentViolations > lastViolationCount) {
      const newViolations = stats.recentViolations - lastViolationCount;
      if (lastViolationCount > 0) {
        // Only show notification after initial load
        new Notification('New Violation Detected!', {
          body: `${newViolations} new violation(s) detected in the last 30 minutes`,
          icon: '/favicon.ico',
        });
      }
      setLastViolationCount(stats.recentViolations);
    }
  }, [stats, notificationsEnabled, lastViolationCount]);

  const handleRefresh = () => {
    refetchStudents();
    refetchViolations();
    refetchStats();
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
  };

  const getViolationColor = (count) => {
    if (count === 0) return 'success';
    if (count < 3) return 'warning';
    return 'error';
  };

  const getViolationIcon = (type) => {
    switch (type) {
      case 'noFace':
        return <IconUserOff size={16} />;
      case 'multipleFace':
        return <IconUsers size={16} />;
      case 'cellPhone':
        return <IconDeviceMobile size={16} />;
      case 'prohibitedObject':
        return <IconShieldX size={16} />;
      default:
        return <IconAlertTriangle size={16} />;
    }
  };

  return (
    <PageContainer title="Live Proctoring" description="Monitor exams in real-time">
      <DashboardCard title="Live Proctoring Dashboard">
        {/* Header with Refresh and Notifications */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconEye size={24} />
            <Typography variant="h5">Real-Time Monitoring</Typography>
            <Chip
              label="Live"
              color="error"
              size="small"
              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white', animation: 'pulse 1.5s infinite' }} />}
            />
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title={notificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}>
              <IconButton color={notificationsEnabled ? 'success' : 'default'}>
                <IconBell />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<IconRefresh />}
              onClick={handleRefresh}
              size="small"
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" fontWeight="600">
                      {statsLoading ? '...' : stats?.activeExams || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Exams
                    </Typography>
                  </Box>
                  <IconClipboard size={40} style={{ opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" fontWeight="600">
                      {studentsLoading ? '...' : activeStudents.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Students
                    </Typography>
                  </Box>
                  <IconUsers size={40} style={{ opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" fontWeight="600">
                      {statsLoading ? '...' : stats?.recentViolations || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Recent Violations (30m)
                    </Typography>
                  </Box>
                  <Badge badgeContent={stats?.recentViolations || 0} color="error">
                    <IconAlertTriangle size={40} style={{ opacity: 0.8 }} />
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" fontWeight="600">
                      {statsLoading ? '...' : stats?.todayViolations?.total || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Today
                    </Typography>
                  </Box>
                  <IconAlertTriangle size={40} style={{ opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Students Section */}
        <Box mb={4}>
          <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
            <IconUsers size={20} />
            Active Students ({activeStudents.length})
          </Typography>

          {studentsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : studentsError ? (
            <Alert severity="error">Failed to load active students</Alert>
          ) : activeStudents.length === 0 ? (
            <Alert severity="info">No students are currently taking exams</Alert>
          ) : (
            <Grid container spacing={2}>
              {activeStudents.map((student, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined" sx={{ '&:hover': { boxShadow: 3 } }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {student.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {student.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.email}
                          </Typography>
                        </Box>
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                          icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white' }} />}
                        />
                      </Box>

                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Exam:
                          </Typography>
                          <Typography variant="body2" fontWeight="500">
                            {student.examName}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Time Left:
                          </Typography>
                          <Typography variant="body2" fontWeight="500" color="primary">
                            <IconClock size={14} style={{ verticalAlign: 'middle' }} /> {student.timeRemaining}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Last Activity:
                          </Typography>
                          <Typography variant="body2" fontWeight="500">
                            {new Date(student.lastActivity).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => handleViewStudent(student)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Recent Violations Section */}
        <Box>
          <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
            <IconAlertTriangle size={20} />
            Recent Violations (Last 30 Minutes)
          </Typography>

          {violationsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : violationsError ? (
            <Alert severity="error">Failed to load violations</Alert>
          ) : recentViolations.length === 0 ? (
            <Alert severity="success">No violations detected in the last 30 minutes! 🎉</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Exam</TableCell>
                    <TableCell align="center">No Face</TableCell>
                    <TableCell align="center">Multiple Faces</TableCell>
                    <TableCell align="center">Cell Phone</TableCell>
                    <TableCell align="center">Prohibited</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell>Last Violation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentViolations.map((violation, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {violation.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {violation.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{violation.examName}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={violation.noFaceCount}
                          color={getViolationColor(violation.noFaceCount)}
                          size="small"
                          icon={getViolationIcon('noFace')}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={violation.multipleFaceCount}
                          color={getViolationColor(violation.multipleFaceCount)}
                          size="small"
                          icon={getViolationIcon('multipleFace')}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={violation.cellPhoneCount}
                          color={getViolationColor(violation.cellPhoneCount)}
                          size="small"
                          icon={getViolationIcon('cellPhone')}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={violation.prohibitedObjectCount}
                          color={getViolationColor(violation.prohibitedObjectCount)}
                          size="small"
                          icon={getViolationIcon('prohibitedObject')}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={violation.totalViolations}
                          color={getViolationColor(violation.totalViolations)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(violation.lastViolation).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Student Details Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Student Details</DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    {selectedStudent.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedStudent.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStudent.email}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Current Exam
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedStudent.examName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Exam ID
                    </Typography>
                    <Typography variant="body2">{selectedStudent.examId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Time Remaining
                    </Typography>
                    <Typography variant="body1" fontWeight="500" color="primary">
                      {selectedStudent.timeRemaining}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Activity
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedStudent.lastActivity).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Chip label="Active" color="success" size="small" sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </DashboardCard>

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </PageContainer>
  );
};

export default LiveProctoringPage;
