import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Stack,
  Grid,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  IconUserPlus,
  IconX,
  IconUsers,
  IconTrendingUp,
  IconClipboardCheck,
  IconSearch,
  IconSchool,
  IconShield,
  IconSortAscending,
  IconSortDescending,
  IconSelector,
  IconBuilding,
  IconBook2,
  IconId,
  IconPhone,
  IconNotes,
  IconMail,
  IconCopy,
  IconDownload,
  IconCheck,
  IconTrash,
  IconAlertTriangle,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useGetStudentsQuery, useAddStudentMutation, useDeleteStudentMutation } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';

// ─── Design Tokens ──────────────────────────────────────────────────────────

const BLUE   = '#0A84FF';
const GREEN  = '#30D158';
const RED    = '#FF453A';
const AMBER  = '#FF9F0A';
const PURPLE = '#BF5AF2';

// Gradient palettes keyed by first-letter char-code mod 8
const AVATAR_GRADIENTS = [
  ['#0A84FF', '#5E5CE6'],
  ['#30D158', '#0A84FF'],
  ['#FF9F0A', '#FF6B00'],
  ['#FF453A', '#FF9F0A'],
  ['#BF5AF2', '#5E5CE6'],
  ['#30D158', '#5AC8FA'],
  ['#FF6B00', '#FF453A'],
  ['#5AC8FA', '#0A84FF'],
];

const getAvatarGradient = (name = '') => {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  const [a, b] = AVATAR_GRADIENTS[idx];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

const getScoreColor = (score) => {
  if (score >= 80) return GREEN;
  if (score >= 60) return AMBER;
  return RED;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ─── Shared Styles ───────────────────────────────────────────────────────────

const dialogSx = {
  '& .MuiDialog-paper': {
    backgroundColor: '#1C1C1E',
    border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    backgroundImage: 'none',
  },
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused fieldset': { borderColor: BLUE },
    color: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.9375rem',
  },
  '& .MuiInputLabel-root': { color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' },
  '& .MuiInputLabel-root.Mui-focused': { color: BLUE },
  '& .MuiFormHelperText-root': { color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' },
};

const tableCellHeadSx = {
  backgroundColor: 'transparent',
  color: 'rgba(235,235,245,0.4)',
  fontSize: '0.75rem',
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  borderBottom: '0.5px solid rgba(84,84,88,0.65)',
  py: 1.5,
  whiteSpace: 'nowrap',
};

const tableCellBodySx = {
  borderBottom: '0.5px solid rgba(84,84,88,0.3)',
  py: 1.5,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, value, label, accent }) => (
  <Box
    sx={{
      backgroundColor: '#1C1C1E',
      border: '0.5px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      p: 2.5,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '10px',
        backgroundColor: `${accent}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={20} color={accent} stroke={1.5} />
    </Box>
    <Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '2rem',
          color: '#FFFFFF',
          letterSpacing: '-0.05em',
          lineHeight: 1,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.8125rem',
          color: 'rgba(235,235,245,0.5)',
          mt: 0.5,
          letterSpacing: '-0.005em',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);

const ScoreDot = ({ score }) => {
  const color = getScoreColor(score || 0);
  return (
    <Tooltip title={`${score || 0}% — ${score >= 80 ? 'High' : score >= 60 ? 'Mid' : 'Low'}`} arrow>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}90`,
          flexShrink: 0,
          cursor: 'default',
        }}
      />
    </Tooltip>
  );
};

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return <IconSelector size={13} style={{ opacity: 0.3, marginLeft: 4 }} />;
  }
  return sortConfig.direction === 'asc'
    ? <IconSortAscending size={13} style={{ color: BLUE, marginLeft: 4 }} />
    : <IconSortDescending size={13} style={{ color: BLUE, marginLeft: 4 }} />;
};

const ProfileField = ({ icon: Icon, label, value }) => {
  if (!value || value === '—') return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '7px',
          backgroundColor: 'rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.1,
        }}
      >
        <Icon size={14} color="rgba(235,235,245,0.5)" stroke={1.5} />
      </Box>
      <Box>
        <Typography
          sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 600 }}
        >
          {label}
        </Typography>
        <Typography
          sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.85)', fontFamily: 'Inter, sans-serif', mt: 0.1, lineHeight: 1.4 }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

// ─── Student Detail Dialog ────────────────────────────────────────────────────

const StudentDetailDialog = ({ student, open, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(student.email);
      setCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy email');
    }
  }, [student?.email]);

  if (!student) return null;

  const passRate =
    student.examsAttempted > 0
      ? Math.round((student.examsCompleted / student.examsAttempted) * 100)
      : 0;

  const scoreColor = getScoreColor(student.averageScore || 0);
  const isActive = student.status === 'active';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={dialogSx}>
      {/* Header gradient strip */}
      <Box
        sx={{
          height: 6,
          background: `linear-gradient(90deg, ${BLUE} 0%, ${PURPLE} 100%)`,
          borderRadius: '20px 20px 0 0',
        }}
      />

      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(235,235,245,0.4)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' } }}>
            <IconX size={18} />
          </IconButton>
        </Box>

        {/* Avatar + name */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -1, mb: 2 }}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              background: getAvatarGradient(student.name),
              fontSize: '1.75rem',
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              border: '3px solid rgba(255,255,255,0.08)',
              mb: 1.5,
            }}
          >
            {student.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            sx={{ fontWeight: 700, fontSize: '1.1875rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em', textAlign: 'center' }}
          >
            {student.name}
          </Typography>
          <Typography
            sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.45)', fontFamily: 'Inter, sans-serif', mt: 0.25, mb: 1 }}
          >
            {student.email}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label="Student"
              size="small"
              sx={{
                backgroundColor: `${BLUE}20`,
                color: BLUE,
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                height: 22,
                '& .MuiChip-label': { px: 1.25 },
              }}
            />
            <Chip
              label={isActive ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                backgroundColor: isActive ? `${GREEN}18` : 'rgba(255,255,255,0.08)',
                color: isActive ? GREEN : 'rgba(235,235,245,0.4)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                height: 22,
                '& .MuiChip-label': { px: 1.25 },
              }}
            />
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        {/* Stats row */}
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {[
            { label: 'Attempted', value: student.examsAttempted || 0, color: BLUE },
            { label: 'Completed', value: student.examsCompleted || 0, color: GREEN },
            { label: 'Avg Score', value: `${student.averageScore || 0}%`, color: scoreColor },
          ].map(({ label, value, color }) => (
            <Grid item xs={4} key={label}>
              <Box
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  p: 1.5,
                  textAlign: 'center',
                }}
              >
                <Typography
                  sx={{ fontWeight: 700, fontSize: '1.375rem', color, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                  {value}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', mt: 0.4, letterSpacing: '0.02em', textTransform: 'uppercase', fontWeight: 600 }}
                >
                  {label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Pass rate bar */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.45)', fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Pass Rate
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: GREEN, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
              {passRate}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={passRate}
            sx={{
              height: 5,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: `linear-gradient(90deg, ${GREEN} 0%, #5AC8FA 100%)`,
              },
            }}
          />
        </Box>

        {/* Profile fields */}
        <Box
          sx={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            p: 2,
            mb: 2,
          }}
        >
          <Stack spacing={1.5}>
            <ProfileField icon={IconBuilding} label="Institution" value={student.institution || '—'} />
            <ProfileField icon={IconBook2}    label="Department"  value={student.department  || '—'} />
            <ProfileField icon={IconId}       label="Student ID"  value={student.studentId   || '—'} />
            <ProfileField icon={IconPhone}    label="Phone"       value={student.phone       || '—'} />
            <ProfileField icon={IconNotes}    label="Bio"         value={student.bio         || '—'} />
            {/* Always-show fields */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconClipboardCheck size={14} color="rgba(235,235,245,0.5)" stroke={1.5} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Last Active
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.85)', fontFamily: 'Inter, sans-serif', mt: 0.1 }}>
                  {formatDate(student.lastActive) !== '—' ? formatDate(student.lastActive) : 'No activity recorded'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconSchool size={14} color="rgba(235,235,245,0.5)" stroke={1.5} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Enrolled
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.85)', fontFamily: 'Inter, sans-serif', mt: 0.1 }}>
                  {formatDate(student.enrollmentDate || student.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={handleCopyEmail}
          startIcon={copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
          sx={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.07)',
            color: copied ? GREEN : 'rgba(235,235,245,0.8)',
            borderRadius: '980px',
            textTransform: 'none',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: '0.5px solid rgba(255,255,255,0.1)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.11)' },
            transition: 'color 0.2s',
          }}
        >
          {copied ? 'Copied!' : 'Copy Email'}
        </Button>
        <Button
          component="a"
          href={`mailto:${student.email}`}
          startIcon={<IconMail size={15} />}
          sx={{
            flex: 1,
            backgroundColor: BLUE,
            color: '#fff',
            borderRadius: '980px',
            textTransform: 'none',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            '&:hover': { backgroundColor: '#409CFF' },
          }}
        >
          Send Email
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const StudentsPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });

  const { data: studentsData, isLoading, error, refetch } = useGetStudentsQuery();
  const [addStudent, { isLoading: isAdding }] = useAddStudentMutation();
  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async () => {
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
        toast.success('Student added successfully');
        setOpenAddDialog(false);
        setNewStudent({ name: '', email: '', password: '' });
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add student');
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStudent(deleteTarget.id).unwrap();
      toast.success(`${deleteTarget.name} has been deactivated`);
      setDeleteTarget(null);
      setSelectedStudent(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to deactivate student');
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
    setPage(0);
  };

  const handleExportCSV = useCallback(() => {
    if (!students.length) {
      toast.error('No student data to export');
      return;
    }
    const headers = ['Name', 'Email', 'Institution', 'Department', 'Student ID', 'Exams Attempted', 'Exams Completed', 'Avg Score', 'Status', 'Joined'];
    const rows = students.map((s) => [
      s.name || '',
      s.email || '',
      s.institution || '',
      s.department || '',
      s.studentId || '',
      s.examsAttempted || 0,
      s.examsCompleted || 0,
      s.averageScore || 0,
      s.status || 'active',
      formatDate(s.enrollmentDate || s.createdAt),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }, [studentsData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data derivation ──────────────────────────────────────────────────────

  const students = useMemo(() => studentsData?.data || [], [studentsData]);

  const filteredStudents = useMemo(() => {
    let result = students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'   && s.status === 'active') ||
        (statusFilter === 'inactive' && s.status !== 'active');
      return matchSearch && matchStatus;
    });

    result = [...result].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'averageScore':
          aVal = a.averageScore || 0;
          bVal = b.averageScore || 0;
          break;
        case 'examsAttempted':
          aVal = a.examsAttempted || 0;
          bVal = b.examsAttempted || 0;
          break;
        case 'joined':
          aVal = new Date(a.enrollmentDate || a.createdAt || 0).getTime();
          bVal = new Date(b.enrollmentDate || b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, searchQuery, statusFilter, sortConfig]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter((s) => s.status === 'active').length,
    averageScore:
      students.length > 0
        ? (students.reduce((sum, s) => sum + (s.averageScore || 0), 0) / students.length).toFixed(1)
        : 0,
    totalExams: students.reduce((sum, s) => sum + (s.examsAttempted || 0), 0),
  }), [students]);

  const paginatedStudents = useMemo(
    () => filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredStudents, page, rowsPerPage]
  );

  // ── Sort-able header cell ────────────────────────────────────────────────

  const SortableHeader = ({ columnKey, label, align = 'left' }) => (
    <TableCell
      align={align}
      onClick={() => handleSort(columnKey)}
      sx={{
        ...tableCellHeadSx,
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': { color: 'rgba(235,235,245,0.75)' },
        color: sortConfig.key === columnKey ? BLUE : 'rgba(235,235,245,0.4)',
      }}
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
        {label}
        <SortIcon column={columnKey} sortConfig={sortConfig} />
      </Box>
    </TableCell>
  );

  // ── Render guards ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageContainer title="Students">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: BLUE }} />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Students">
        <Box
          sx={{
            backgroundColor: 'rgba(255,69,58,0.1)',
            border: '0.5px solid rgba(255,69,58,0.3)',
            borderRadius: '12px',
            p: 3,
            mt: 2,
          }}
        >
          <Typography sx={{ color: RED, fontFamily: 'Inter, sans-serif', mb: 1 }}>
            {error?.data?.message || 'Failed to fetch students'}
          </Typography>
          <Button
            onClick={refetch}
            sx={{ color: BLUE, textTransform: 'none', fontFamily: 'Inter, sans-serif', p: 0 }}
          >
            Retry
          </Button>
        </Box>
      </PageContainer>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <PageContainer title="Students">
      <Box sx={{ pb: 4 }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.75rem',
                color: '#FFFFFF',
                letterSpacing: '-0.04em',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1,
              }}
            >
              Students
            </Typography>
            <Typography
              sx={{
                fontSize: '0.9375rem',
                color: 'rgba(235,235,245,0.45)',
                mt: 0.75,
                letterSpacing: '-0.01em',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Manage and monitor enrolled students
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25}>
            <Button
              onClick={handleExportCSV}
              startIcon={<IconDownload size={15} />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                color: 'rgba(235,235,245,0.8)',
                borderRadius: '980px',
                px: 2.25,
                py: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                textTransform: 'none',
                border: '0.5px solid rgba(255,255,255,0.1)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.11)' },
              }}
            >
              Export CSV
            </Button>
            <Button
              onClick={() => setOpenAddDialog(true)}
              startIcon={<IconUserPlus size={15} />}
              sx={{
                backgroundColor: BLUE,
                color: '#fff',
                borderRadius: '980px',
                px: 2.5,
                py: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#409CFF' },
              }}
            >
              Add Student
            </Button>
          </Stack>
        </Box>

        {/* ── Stat Cards ──────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard icon={IconUsers}         value={stats.total}              label="Total Students"  accent={BLUE}   />
          </Grid>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard icon={IconShield}        value={stats.active}             label="Active"          accent={GREEN}  />
          </Grid>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard icon={IconTrendingUp}    value={`${stats.averageScore}%`} label="Avg Score"       accent={AMBER}  />
          </Grid>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard icon={IconClipboardCheck} value={stats.totalExams}        label="Exam Attempts"   accent={PURPLE} />
          </Grid>
        </Grid>

        {/* ── Table Card ──────────────────────────────────────────────── */}
        <Box
          sx={{
            backgroundColor: '#1C1C1E',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {/* Search + filter row */}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: '0.5px solid rgba(84,84,88,0.65)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            {/* Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1, minWidth: 180 }}>
              <Box sx={{ color: 'rgba(235,235,245,0.3)', flexShrink: 0 }}>
                <IconSearch size={15} />
              </Box>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                placeholder="Search by name or email…"
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  fontFamily: 'Inter, sans-serif',
                  width: '100%',
                }}
              />
            </Box>

            {/* Status filter pills */}
            <Stack direction="row" spacing={0.75}>
              {[
                { key: 'all',      label: 'All' },
                { key: 'active',   label: 'Active' },
                { key: 'inactive', label: 'Inactive' },
              ].map(({ key, label }) => {
                const isSelected = statusFilter === key;
                return (
                  <Button
                    key={key}
                    onClick={() => { setStatusFilter(key); setPage(0); }}
                    size="small"
                    sx={{
                      borderRadius: '980px',
                      px: 1.75,
                      py: 0.5,
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 600 : 500,
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'none',
                      minWidth: 0,
                      backgroundColor: isSelected ? `${BLUE}22` : 'transparent',
                      color: isSelected ? BLUE : 'rgba(235,235,245,0.45)',
                      border: `0.5px solid ${isSelected ? `${BLUE}55` : 'rgba(255,255,255,0.08)'}`,
                      '&:hover': {
                        backgroundColor: isSelected ? `${BLUE}30` : 'rgba(255,255,255,0.06)',
                      },
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Stack>

            {/* Result count */}
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: 'rgba(235,235,245,0.3)',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Empty states */}
          {students.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <IconUsers size={22} color="rgba(235,235,245,0.25)" stroke={1.5} />
              </Box>
              <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif' }}>
                No students yet. Add a student to get started.
              </Typography>
            </Box>
          ) : filteredStudents.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif' }}>
                No students match your search or filter.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      <SortableHeader columnKey="name"           label="Student"   />
                      <TableCell sx={tableCellHeadSx}>Email</TableCell>
                      <SortableHeader columnKey="examsAttempted" label="Exams"     align="center" />
                      <TableCell align="center" sx={tableCellHeadSx}>Completed</TableCell>
                      <SortableHeader columnKey="averageScore"   label="Avg Score" align="center" />
                      <TableCell align="center" sx={tableCellHeadSx}>Status</TableCell>
                      <SortableHeader columnKey="joined"         label="Joined"    align="center" />
                      <TableCell align="center" sx={tableCellHeadSx}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedStudents.map((student) => {
                      const score = student.averageScore || 0;
                      const scoreColor = getScoreColor(score);
                      const isActive = student.status === 'active';

                      return (
                        <TableRow
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.035)' },
                            '&:last-child td': { borderBottom: 'none' },
                            transition: 'background-color 0.12s',
                          }}
                        >
                          {/* Student */}
                          <TableCell sx={tableCellBodySx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 34,
                                  height: 34,
                                  background: getAvatarGradient(student.name),
                                  fontSize: '0.8125rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                  border: '1.5px solid rgba(255,255,255,0.06)',
                                }}
                              >
                                {student.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  color: '#FFFFFF',
                                  fontFamily: 'Inter, sans-serif',
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {student.name}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Email */}
                          <TableCell sx={tableCellBodySx}>
                            <Typography
                              sx={{
                                fontSize: '0.8125rem',
                                color: 'rgba(235,235,245,0.5)',
                                fontFamily: 'Inter, sans-serif',
                              }}
                            >
                              {student.email}
                            </Typography>
                          </TableCell>

                          {/* Exams Attempted */}
                          <TableCell align="center" sx={tableCellBodySx}>
                            <Chip
                              label={student.examsAttempted || 0}
                              size="small"
                              sx={{
                                backgroundColor: `${BLUE}18`,
                                color: BLUE,
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 22,
                                '& .MuiChip-label': { px: 1.25 },
                              }}
                            />
                          </TableCell>

                          {/* Completed */}
                          <TableCell align="center" sx={tableCellBodySx}>
                            <Chip
                              label={student.examsCompleted || 0}
                              size="small"
                              sx={{
                                backgroundColor: `${GREEN}18`,
                                color: GREEN,
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 22,
                                '& .MuiChip-label': { px: 1.25 },
                              }}
                            />
                          </TableCell>

                          {/* Avg Score + sparkline dot */}
                          <TableCell align="center" sx={tableCellBodySx}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                              <ScoreDot score={score} />
                              <Chip
                                label={`${score}%`}
                                size="small"
                                sx={{
                                  backgroundColor: `${scoreColor}18`,
                                  color: scoreColor,
                                  fontFamily: 'Inter, sans-serif',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 22,
                                  '& .MuiChip-label': { px: 1.25 },
                                }}
                              />
                            </Box>
                          </TableCell>

                          {/* Status */}
                          <TableCell align="center" sx={tableCellBodySx}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: isActive ? GREEN : 'rgba(235,235,245,0.25)',
                                  boxShadow: isActive ? `0 0 5px ${GREEN}80` : 'none',
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: '0.8125rem',
                                  fontFamily: 'Inter, sans-serif',
                                  fontWeight: 500,
                                  color: isActive ? GREEN : 'rgba(235,235,245,0.4)',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {student.status || 'active'}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Joined */}
                          <TableCell align="center" sx={tableCellBodySx}>
                            <Typography
                              sx={{
                                fontSize: '0.8125rem',
                                color: 'rgba(235,235,245,0.45)',
                                fontFamily: 'Inter, sans-serif',
                              }}
                            >
                              {formatDate(student.enrollmentDate || student.createdAt)}
                            </Typography>
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="center" sx={tableCellBodySx} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Deactivate student" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setDeleteTarget(student)}
                                sx={{
                                  color: 'rgba(255,69,58,0.6)',
                                  '&:hover': { color: RED, backgroundColor: 'rgba(255,69,58,0.1)' },
                                  borderRadius: '8px',
                                  width: 30,
                                  height: 30,
                                }}
                              >
                                <IconTrash size={15} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>

              <TablePagination
                component="div"
                count={filteredStudents.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
                sx={{
                  color: 'rgba(235,235,245,0.5)',
                  fontFamily: 'Inter, sans-serif',
                  borderTop: '0.5px solid rgba(84,84,88,0.65)',
                  '& .MuiSelect-icon': { color: 'rgba(235,235,245,0.4)' },
                  '& .MuiIconButton-root': {
                    color: 'rgba(235,235,245,0.4)',
                    '&:disabled': { color: 'rgba(235,235,245,0.15)' },
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.8125rem',
                  },
                }}
              />
            </>
          )}
        </Box>

        {/* ── Add Student Dialog ───────────────────────────────────────── */}
        <Dialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          maxWidth="sm"
          fullWidth
          sx={dialogSx}
        >
          <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(10,132,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconUserPlus size={18} color={BLUE} />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.0625rem',
                    color: '#FFFFFF',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Add New Student
                </Typography>
              </Box>
              <IconButton
                onClick={() => setOpenAddDialog(false)}
                size="small"
                sx={{ color: 'rgba(235,235,245,0.4)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' } }}
              >
                <IconX size={18} />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={newStudent.name}
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
                sx={inputSx}
              />
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={newStudent.email}
                onChange={handleInputChange}
                placeholder="e.g., john@university.edu"
                sx={inputSx}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={newStudent.password}
                onChange={handleInputChange}
                placeholder="Minimum 6 characters"
                helperText="Student will use this to log in"
                sx={inputSx}
              />
              <Box
                sx={{
                  backgroundColor: 'rgba(10,132,255,0.08)',
                  border: '0.5px solid rgba(10,132,255,0.2)',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'flex-start',
                }}
              >
                <IconSchool size={16} color={BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    color: 'rgba(235,235,245,0.6)',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.5,
                  }}
                >
                  The student account will be created with the student role and can access exams immediately.
                </Typography>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
            <Button
              onClick={() => setOpenAddDialog(false)}
              disabled={isAdding}
              sx={{
                color: 'rgba(235,235,245,0.6)',
                borderRadius: '980px',
                px: 2.5,
                textTransform: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={isAdding}
              startIcon={
                isAdding
                  ? <CircularProgress size={15} color="inherit" />
                  : <IconUserPlus size={15} />
              }
              sx={{
                backgroundColor: BLUE,
                color: '#fff',
                borderRadius: '980px',
                px: 2.5,
                textTransform: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#409CFF' },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              {isAdding ? 'Adding…' : 'Add Student'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Student Detail Dialog ────────────────────────────────────── */}
        <StudentDetailDialog
          student={selectedStudent}
          open={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
        />

        {/* ── Delete Confirmation Dialog ───────────────────────────────── */}
        <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth sx={dialogSx}>
          <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'rgba(255,69,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconAlertTriangle size={18} color={RED} />
              </Box>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
                Deactivate Student
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.65)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              Are you sure you want to deactivate <strong style={{ color: '#FFFFFF' }}>{deleteTarget?.name}</strong>?
              They will no longer be able to log in or access exams. This can be reversed by an admin.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
            <Button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              sx={{ color: 'rgba(235,235,245,0.6)', borderRadius: '980px', px: 2.5, textTransform: 'none', fontFamily: 'Inter, sans-serif', '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={14} color="inherit" /> : <IconTrash size={14} />}
              sx={{ backgroundColor: RED, color: '#fff', borderRadius: '980px', px: 2.5, textTransform: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 600, '&:hover': { backgroundColor: '#FF6B6B' }, '&:disabled': { opacity: 0.5 } }}
            >
              {isDeleting ? 'Deactivating…' : 'Deactivate'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default StudentsPage;
