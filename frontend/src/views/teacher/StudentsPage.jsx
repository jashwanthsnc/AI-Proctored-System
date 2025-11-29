import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Card,
  Grid,
  Tooltip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  MoreVert,
  PersonAdd,
  Email,
  Block,
  CheckCircle,
  PendingActions,
  School,
  TrendingUp,
  Close,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useGetStudentsQuery, useAddStudentMutation } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';

const StudentsPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Fetch students data from API
  const { data: studentsData, isLoading, error, refetch } = useGetStudentsQuery();
  const [addStudent, { isLoading: isAdding }] = useAddStudentMutation();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, student) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStudent(null);
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setNewStudent({ name: '', email: '', password: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async () => {
    // Validation
    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newStudent.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await addStudent(newStudent).unwrap();
      if (response.success) {
        toast.success('✅ Student added successfully!');
        handleCloseAddDialog();
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add student');
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <PageContainer title="Students Management" description="Manage and monitor all students">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Students Management" description="Manage and monitor all students">
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="h6">Error loading students</Typography>
          <Typography variant="body2">{error?.data?.message || 'Failed to fetch students data'}</Typography>
          <Button onClick={refetch} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Alert>
      </PageContainer>
    );
  }

  const students = studentsData?.data || [];

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === 'active').length,
    averageScore: students.length > 0
      ? (students.reduce((sum, s) => sum + s.averageScore, 0) / students.length).toFixed(1)
      : 0,
    totalExams: students.reduce((sum, s) => sum + s.examsAttempted, 0),
  };

  return (
    <PageContainer title="Students Management" description="Manage and monitor all students">
      <Box>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h3" fontWeight={600}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Students
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
                Active Students
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <TrendingUp color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h3" fontWeight={600}>
                {stats.averageScore}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <PendingActions color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h3" fontWeight={600}>
                {stats.totalExams}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Exam Attempts
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Main Table Card */}
        <DashboardCard title="All Students">
          <Box>
            {/* Search and Actions */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <TextField
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: { xs: '100%', sm: 300 } }}
              />
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={handleOpenAddDialog}
              >
                Add Student
              </Button>
            </Stack>

            {/* No students message */}
            {students.length === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                No students found. Students will appear here once they register.
              </Alert>
            )}

            {/* Students Table */}
            {students.length > 0 && (
              <>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell>Student</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="center">Exams</TableCell>
                        <TableCell align="center">Completed</TableCell>
                        <TableCell align="center">Avg Score</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Last Active</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((student) => (
                          <TableRow
                            key={student.id}
                            hover
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  {student.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {student.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Enrolled: {formatDate(student.enrollmentDate)}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{student.email}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={student.examsAttempted}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={student.examsCompleted}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${student.averageScore}%`}
                                size="small"
                                color={getScoreColor(student.averageScore)}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={student.status}
                                size="small"
                                color={getStatusColor(student.status)}
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(student.lastActive)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="More actions">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, student)}
                                >
                                  <MoreVert />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                <TablePagination
                  component="div"
                  count={filteredStudents.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </>
            )}
          </Box>
        </DashboardCard>

        {/* Action Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleMenuClose}>
            <Email sx={{ mr: 1 }} fontSize="small" />
            Send Email
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <School sx={{ mr: 1 }} fontSize="small" />
            View Results
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Block sx={{ mr: 1 }} fontSize="small" color="error" />
            Suspend Student
          </MenuItem>
        </Menu>

        {/* Add Student Dialog */}
        <Dialog
          open={openAddDialog}
          onClose={handleCloseAddDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAdd color="primary" />
                <Typography variant="h5" fontWeight={600}>
                  Add New Student
                </Typography>
              </Box>
              <IconButton onClick={handleCloseAddDialog} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={newStudent.name}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                  required
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={newStudent.email}
                  onChange={handleInputChange}
                  placeholder="e.g., john.doe@university.edu"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={newStudent.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  helperText="Student will use this password to log in"
                  required
                />
                <Alert severity="info" icon={<School />}>
                  The student account will be created with role "student" and can access exams
                  immediately after creation.
                </Alert>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={handleCloseAddDialog} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddStudent}
              disabled={isAdding}
              startIcon={isAdding ? <CircularProgress size={20} /> : <PersonAdd />}
            >
              {isAdding ? 'Adding...' : 'Add Student'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default StudentsPage;
