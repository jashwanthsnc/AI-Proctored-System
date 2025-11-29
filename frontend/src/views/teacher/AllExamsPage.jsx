import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Card,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  PersonAdd,
  Close,
  Groups,
  Assessment,
  Schedule,
  CalendarToday,
  CheckCircle,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import {
  useGetExamsQuery,
  useAssignStudentsToExamMutation,
  useDeleteExamMutation,
} from '../../slices/examApiSlice';
import { useGetStudentsQuery } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AllExamsPage = () => {
  const navigate = useNavigate();
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  // Fetch exams and students
  const { data: examsData, isLoading: examsLoading, error: examsError } = useGetExamsQuery();
  const { data: studentsData, isLoading: studentsLoading } = useGetStudentsQuery();
  const [assignStudents, { isLoading: isAssigning }] = useAssignStudentsToExamMutation();
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExamMutation();

  const handleOpenAssignDialog = (exam) => {
    setSelectedExam(exam);
    // Pre-select already assigned students
    const assignedIds = exam.eligibleStudents?.map((s) => s._id) || [];
    setSelectedStudentIds(assignedIds);
    setOpenAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedExam(null);
    setSelectedStudentIds([]);
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssignStudents = async () => {
    if (selectedStudentIds.length === 0) {
      toast.warning('Please select at least one student');
      return;
    }

    try {
      const response = await assignStudents({
        examId: selectedExam.examId,
        studentIds: selectedStudentIds,
      }).unwrap();

      if (response.success) {
        toast.success('✅ Students assigned successfully!');
        handleCloseAssignDialog();
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to assign students');
    }
  };

  const handleDeleteClick = (exam) => {
    setExamToDelete(exam);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteExam(examToDelete.examId).unwrap();
      toast.success('Exam deleted successfully!');
      setDeleteDialogOpen(false);
      setExamToDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete exam');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setExamToDelete(null);
  };

  const handleViewQuestions = (examId) => {
    // Navigate to Question Bank with this exam selected
    navigate('/add-questions');
    // Set the exam in localStorage so it's pre-selected
    localStorage.setItem('selectedExamId', examId);
  };

  const handleEditExam = (exam) => {
    // Navigate to edit exam page
    navigate(`/edit-exam/${exam.examId}`, { state: { exam } });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const liveDate = new Date(exam.liveDate);
    const deadDate = new Date(exam.deadDate);

    if (now < liveDate) return { label: 'Upcoming', color: 'info' };
    if (now > deadDate) return { label: 'Ended', color: 'default' };
    return { label: 'Active', color: 'success' };
  };

  // Handle loading and error states
  if (examsLoading) {
    return (
      <PageContainer title="All Exams" description="Manage exams and student assignments">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      </PageContainer>
    );
  }

  if (examsError) {
    return (
      <PageContainer title="All Exams" description="Manage exams and student assignments">
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="h6">Error loading exams</Typography>
          <Typography variant="body2">{examsError?.data?.message || 'Failed to fetch exams'}</Typography>
        </Alert>
      </PageContainer>
    );
  }

  const exams = examsData || [];
  const students = studentsData?.data || [];

  // Calculate statistics
  const stats = {
    total: exams.length,
    active: exams.filter((e) => getExamStatus(e).label === 'Active').length,
    upcoming: exams.filter((e) => getExamStatus(e).label === 'Upcoming').length,
    ended: exams.filter((e) => getExamStatus(e).label === 'Ended').length,
  };

  return (
    <PageContainer title="All Exams" description="Manage exams and student assignments">
      <Box>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Assessment color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h3" fontWeight={600}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Exams
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h3" fontWeight={600}>
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Exams
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <CalendarToday color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h3" fontWeight={600}>
                {stats.upcoming}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming Exams
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Schedule color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h3" fontWeight={600}>
                {stats.ended}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ended Exams
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Exams Table */}
        <DashboardCard title="All Exams">
          <Box>
            {exams.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No exams found. Create an exam to get started.
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell>Exam Name</TableCell>
                      <TableCell align="center">Questions</TableCell>
                      <TableCell align="center">Duration</TableCell>
                      <TableCell>Live Date</TableCell>
                      <TableCell>Deadline</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Eligible Students</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exams.map((exam) => {
                      const status = getExamStatus(exam);
                      return (
                        <TableRow
                          key={exam.examId}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {exam.examName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={exam.totalQuestions} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={`${exam.duration} min`} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDate(exam.liveDate)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDate(exam.deadDate)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={status.label} size="small" color={status.color} />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={`${exam.eligibleStudents?.length || 0} students assigned`}>
                              <Chip
                                icon={<Groups />}
                                label={exam.eligibleStudents?.length || 0}
                                size="small"
                                color={exam.eligibleStudents?.length > 0 ? 'success' : 'default'}
                                variant="outlined"
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PersonAdd />}
                              onClick={() => handleOpenAssignDialog(exam)}
                              sx={{ mr: 1 }}
                            >
                              Assign
                            </Button>
                            <Tooltip title="View Questions">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewQuestions(exam.examId)}
                                sx={{ mr: 0.5 }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Exam">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleEditExam(exam)}
                                sx={{ mr: 0.5 }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Exam">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(exam)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DashboardCard>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Confirm Delete</Typography>
              <IconButton onClick={handleDeleteCancel} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone. All questions and student assignments for this exam will be affected.
            </Alert>
            {examToDelete && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Are you sure you want to delete the exam:
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  {examToDelete.examName}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Total Questions: {examToDelete.totalQuestions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Duration: {examToDelete.duration} minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Assigned Students: {examToDelete.eligibleStudents?.length || 0}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleDeleteCancel} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : <Delete />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Exam'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Students Dialog */}
        <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Groups color="primary" />
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    Assign Students
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedExam?.examName}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleCloseAssignDialog} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {studentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : students.length === 0 ? (
              <Alert severity="info">No students available. Add students first.</Alert>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select students who can take this exam:
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {students.map((student) => (
                    <ListItem key={student.id} disablePadding>
                      <ListItemButton onClick={() => handleToggleStudent(student.id)} dense>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={selectedStudentIds.includes(student.id)}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={student.name}
                          secondary={student.email}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Selected: <strong>{selectedStudentIds.length}</strong> student(s)
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={handleCloseAssignDialog} disabled={isAssigning}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAssignStudents}
              disabled={isAssigning || students.length === 0}
              startIcon={isAssigning ? <CircularProgress size={20} /> : <PersonAdd />}
            >
              {isAssigning ? 'Assigning...' : 'Assign Students'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default AllExamsPage;
