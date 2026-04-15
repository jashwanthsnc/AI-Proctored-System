import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
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
  Grid,
  Tooltip,
  Avatar,
  Stack,
} from '@mui/material';
import {
  IconUserPlus,
  IconX,
  IconUsers,
  IconClipboardList,
  IconCalendarEvent,
  IconShieldCheck,
  IconEye,
  IconEdit,
  IconTrash,
  IconPlus,
  IconAlertTriangle,
  IconSearch,
  IconLayoutGrid,
  IconTable,
  IconClock,
  IconHash,
  IconPercentage,
  IconCopy,
  IconBook,
  IconPlayerPlay,
  IconCalendarPlus,
  IconCheck,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import {
  useGetExamsQuery,
  useAssignStudentsToExamMutation,
  useDeleteExamMutation,
  useCreateExamMutation,
  useUpdateExamMutation,
} from '../../slices/examApiSlice';
import { useGetStudentsQuery } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────────────────── */
const T = {
  bg: '#000000',
  card: '#1C1C1E',
  blue: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  amber: '#FF9F0A',
  purple: '#BF5AF2',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(235,235,245,0.6)',
  textTertiary: 'rgba(235,235,245,0.35)',
  border: 'rgba(84,84,88,0.65)',
  borderSubtle: 'rgba(255,255,255,0.08)',
  font: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

/* ─────────────────────────────────────────────────────────────
   Keyframe injection (pulse animation for Live badge)
───────────────────────────────────────────────────────────── */
const PULSE_STYLE = `
@keyframes apPulse {
  0%   { box-shadow: 0 0 0 0 rgba(48,209,88,0.7); }
  70%  { box-shadow: 0 0 0 6px rgba(48,209,88,0); }
  100% { box-shadow: 0 0 0 0 rgba(48,209,88,0); }
}
`;

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const getExamStatus = (exam) => {
  const now = new Date();
  if (now < new Date(exam.liveDate)) return { label: 'Upcoming', color: T.amber };
  if (now > new Date(exam.deadDate)) return { label: 'Ended', color: T.textTertiary };
  return { label: 'Live', color: T.green };
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

/** Apple-style stat card */
const StatCard = ({ icon: Icon, value, label, accent }) => (
  <Box
    sx={{
      backgroundColor: T.card,
      border: `0.5px solid ${T.borderSubtle}`,
      borderRadius: '16px',
      p: 2.5,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: 'rgba(255,255,255,0.15)' },
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
          color: T.textPrimary,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          fontFamily: T.font,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.8125rem',
          color: T.textTertiary,
          mt: 0.5,
          letterSpacing: '-0.005em',
          fontFamily: T.font,
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);

/** Status badge with pulsing dot for Live */
const StatusBadge = ({ status }) => {
  const isLive = status.label === 'Live';
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        backgroundColor: `${status.color}18`,
        border: `0.5px solid ${status.color}40`,
        borderRadius: '980px',
        px: 1.25,
        py: 0.4,
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: status.color,
          flexShrink: 0,
          animation: isLive ? 'apPulse 1.6s ease-in-out infinite' : 'none',
        }}
      />
      <Typography
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: status.color,
          fontFamily: T.font,
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        {status.label}
      </Typography>
    </Box>
  );
};

/** Tags row — up to 3 chips, then "+N more" */
const TagsRow = ({ tags = [] }) => {
  if (!tags || tags.length === 0) return null;
  const visible = tags.slice(0, 3);
  const overflow = tags.length - 3;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {visible.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          sx={{
            backgroundColor: `${T.blue}18`,
            color: T.blue,
            border: `0.5px solid ${T.blue}30`,
            borderRadius: '6px',
            fontSize: '0.6875rem',
            fontWeight: 500,
            fontFamily: T.font,
            height: 20,
            '& .MuiChip-label': { px: 1 },
          }}
        />
      ))}
      {overflow > 0 && (
        <Chip
          label={`+${overflow} more`}
          size="small"
          sx={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: T.textSecondary,
            border: `0.5px solid ${T.borderSubtle}`,
            borderRadius: '6px',
            fontSize: '0.6875rem',
            fontWeight: 500,
            fontFamily: T.font,
            height: 20,
            '& .MuiChip-label': { px: 1 },
          }}
        />
      )}
    </Box>
  );
};

/** Meta pill (icon + text) used inside exam cards */
const MetaPill = ({ icon: Icon, value, color = T.textTertiary, title }) => (
  <Tooltip title={title || ''} placement="top">
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Icon size={13} color={color} stroke={1.5} />
      <Typography sx={{ fontSize: '0.75rem', color, fontFamily: T.font, fontWeight: 500, lineHeight: 1 }}>
        {value}
      </Typography>
    </Box>
  </Tooltip>
);

/** Rich exam card for card view */
const ExamCard = ({ exam, onAssign, onViewQuestions, onEdit, onDuplicate, onDelete, onReactivate, isDuplicating }) => {
  const status = getExamStatus(exam);
  const tags = exam.tags || [];

  return (
    <Box
      sx={{
        backgroundColor: T.card,
        border: `0.5px solid ${T.borderSubtle}`,
        borderRadius: '18px',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        transition: 'border-color 0.2s, transform 0.15s',
        '&:hover': {
          borderColor: 'rgba(255,255,255,0.15)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Top row: status badge */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <StatusBadge status={status} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontSize: '0.75rem', color: T.textTertiary, fontFamily: T.font }}>
            {exam.eligibleStudents?.length || 0} enrolled
          </Typography>
        </Box>
      </Box>

      {/* Exam name */}
      <Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1rem',
            color: T.textPrimary,
            fontFamily: T.font,
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {exam.examName}
        </Typography>

        {/* Subject */}
        {exam.subject && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
            <IconBook size={13} color={T.textTertiary} stroke={1.5} />
            <Typography sx={{ fontSize: '0.8125rem', color: T.textSecondary, fontFamily: T.font }}>
              {exam.subject}
            </Typography>
          </Box>
        )}

        {/* Description */}
        {exam.description && (
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: T.textTertiary,
              fontFamily: T.font,
              mt: 0.75,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {exam.description}
          </Typography>
        )}
      </Box>

      {/* Tags */}
      {tags.length > 0 && <TagsRow tags={tags} />}

      {/* Divider */}
      <Box sx={{ borderTop: `0.5px solid ${T.border}`, mx: -2.5 }} />

      {/* Meta row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <MetaPill icon={IconClock} value={`${exam.duration}m`} title="Duration" color={T.textSecondary} />
        <MetaPill icon={IconHash} value={exam.totalQuestions} title="Questions" color={T.textSecondary} />
        <MetaPill
          icon={IconPercentage}
          value={exam.passingScore != null ? `${exam.passingScore}%` : '—'}
          title="Pass score"
          color={T.textSecondary}
        />
        <MetaPill
          icon={IconUsers}
          value={exam.eligibleStudents?.length || 0}
          title="Enrolled students"
          color={T.textSecondary}
        />
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 'auto' }}>
        <Tooltip title="Assign Students">
          <IconButton
            size="small"
            onClick={() => onAssign(exam)}
            sx={{
              color: T.blue,
              borderRadius: '8px',
              width: 32,
              height: 32,
              '&:hover': { backgroundColor: `${T.blue}18` },
            }}
          >
            <IconUserPlus size={15} />
          </IconButton>
        </Tooltip>

        <Tooltip title="View / Edit Questions">
          <IconButton
            size="small"
            onClick={() => onViewQuestions(exam.examId)}
            sx={{
              color: T.textSecondary,
              borderRadius: '8px',
              width: 32,
              height: 32,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' },
            }}
          >
            <IconEye size={15} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Edit Exam">
          <IconButton
            size="small"
            onClick={() => onEdit(exam)}
            sx={{
              color: T.textSecondary,
              borderRadius: '8px',
              width: 32,
              height: 32,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' },
            }}
          >
            <IconEdit size={15} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Duplicate Exam">
          <IconButton
            size="small"
            onClick={() => onDuplicate(exam)}
            disabled={isDuplicating}
            sx={{
              color: T.purple,
              borderRadius: '8px',
              width: 32,
              height: 32,
              '&:hover': { backgroundColor: `${T.purple}18` },
              '&:disabled': { opacity: 0.4 },
            }}
          >
            {isDuplicating ? <CircularProgress size={13} sx={{ color: T.purple }} /> : <IconCopy size={15} />}
          </IconButton>
        </Tooltip>

        {/* Reactivate — only for ended exams */}
        {status.label === 'Ended' && (
          <Tooltip title="Reactivate Exam">
            <IconButton
              size="small"
              onClick={() => onReactivate(exam)}
              sx={{
                color: T.green,
                borderRadius: '8px',
                width: 32,
                height: 32,
                '&:hover': { backgroundColor: `${T.green}18` },
              }}
            >
              <IconPlayerPlay size={15} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Delete Exam">
          <IconButton
            size="small"
            onClick={() => onDelete(exam)}
            sx={{
              color: T.red,
              borderRadius: '8px',
              width: 32,
              height: 32,
              ml: 'auto',
              '&:hover': { backgroundColor: `${T.red}18` },
            }}
          >
            <IconTrash size={15} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

/* ─────────────────────────────────────────────────────────────
   Dialog shared styles
───────────────────────────────────────────────────────────── */
const dialogSx = {
  '& .MuiDialog-paper': {
    backgroundColor: T.card,
    border: `0.5px solid rgba(255,255,255,0.12)`,
    borderRadius: '20px',
  },
};

const tableCellSx = {
  borderColor: T.border,
  color: T.textSecondary,
  fontSize: '0.8125rem',
  fontFamily: T.font,
  py: 1.5,
};

const tableHeadCellSx = {
  ...tableCellSx,
  color: T.textTertiary,
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  backgroundColor: 'rgba(255,255,255,0.02)',
};

/* ─────────────────────────────────────────────────────────────
   Reactivate Exam Dialog
───────────────────────────────────────────────────────────── */
const PRESETS = [
  { label: '1 Hour',  hours: 1 },
  { label: '6 Hours', hours: 6 },
  { label: '1 Day',   hours: 24, isDefault: true },
  { label: '3 Days',  hours: 72 },
  { label: '7 Days',  hours: 168 },
  { label: 'Custom',  hours: null },
];

const ReactivateDialog = ({ open, exam, onClose, onConfirm, isLoading }) => {
  const [selected, setSelected] = React.useState(PRESETS[2]); // default: 1 Day
  const [customHours, setCustomHours] = React.useState('');
  const [customError, setCustomError] = React.useState('');

  // Reset state on open
  React.useEffect(() => {
    if (open) { setSelected(PRESETS[2]); setCustomHours(''); setCustomError(''); }
  }, [open]);

  const handleConfirm = () => {
    let hours;
    if (selected.hours === null) {
      const parsed = parseFloat(customHours);
      if (!customHours || isNaN(parsed) || parsed <= 0) {
        setCustomError('Enter a valid number of hours (e.g. 2.5)');
        return;
      }
      hours = parsed;
    } else {
      hours = selected.hours;
    }
    onConfirm(exam, hours);
  };

  if (!exam) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth sx={dialogSx}>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '9px', backgroundColor: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCalendarPlus size={17} color={T.green} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.textPrimary, fontFamily: T.font }}>Reactivate Exam</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: T.textTertiary, fontFamily: T.font, mt: 0.1 }}>{exam.examName}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: T.textTertiary, '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' } }}>
            <IconX size={16} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 0 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: T.textTertiary, fontFamily: T.font, mb: 2 }}>
          Choose how long to make this exam active again. Students assigned to this exam will be able to take it during this window.
        </Typography>

        {/* Preset buttons */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {PRESETS.map((preset) => {
            const isActive = selected === preset;
            return (
              <Box
                key={preset.label}
                onClick={() => { setSelected(preset); setCustomError(''); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1.5, py: 0.875, borderRadius: '10px', cursor: 'pointer',
                  backgroundColor: isActive ? `${T.green}18` : 'rgba(255,255,255,0.05)',
                  border: `0.5px solid ${isActive ? T.green : T.borderSubtle}`,
                  transition: 'all 0.15s',
                  '&:hover': { backgroundColor: isActive ? `${T.green}20` : 'rgba(255,255,255,0.08)' },
                }}
              >
                {isActive && <IconCheck size={12} color={T.green} />}
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: isActive ? 700 : 500, color: isActive ? T.green : T.textSecondary, fontFamily: T.font }}>
                  {preset.label}
                  {preset.isDefault && !isActive && (
                    <span style={{ fontSize: '0.625rem', color: T.textTertiary, marginLeft: 4 }}>(default)</span>
                  )}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Custom input */}
        {selected.hours === null && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: T.textTertiary, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.75, fontFamily: T.font }}>
              Duration (hours)
            </Typography>
            <Box sx={{ position: 'relative' }}>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={customHours}
                onChange={(e) => { setCustomHours(e.target.value); setCustomError(''); }}
                placeholder="e.g. 2, 12, 48"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: `0.5px solid ${customError ? T.red : T.borderSubtle}`,
                  borderRadius: '10px', padding: '10px 13px',
                  color: T.textPrimary, fontSize: '0.875rem',
                  fontFamily: T.font, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = `${T.green}80`)}
                onBlur={(e) => (e.target.style.borderColor = customError ? T.red : T.borderSubtle)}
              />
            </Box>
            {customError && (
              <Typography sx={{ fontSize: '0.75rem', color: T.red, fontFamily: T.font, mt: 0.5 }}>{customError}</Typography>
            )}
          </Box>
        )}

        {/* Preview */}
        {(selected.hours !== null || customHours) && !(selected.hours === null && !customHours) && (
          <Box sx={{ backgroundColor: `${T.green}08`, border: `0.5px solid ${T.green}25`, borderRadius: '10px', px: 1.75, py: 1.25, mb: 2 }}>
            <Typography sx={{ fontSize: '0.8125rem', color: T.textSecondary, fontFamily: T.font }}>
              Exam will be active from{' '}
              <strong style={{ color: T.textPrimary }}>Now</strong>
              {' '}until{' '}
              <strong style={{ color: T.green }}>
                {(() => {
                  const h = selected.hours !== null ? selected.hours : parseFloat(customHours);
                  if (!h || isNaN(h)) return '—';
                  return new Date(Date.now() + h * 3600000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                })()}
              </strong>
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ flex: 1, color: T.textSecondary, borderRadius: '980px', textTransform: 'none', fontFamily: T.font, border: `0.5px solid ${T.borderSubtle}`, '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <IconPlayerPlay size={14} />}
          sx={{ flex: 2, backgroundColor: T.green, color: '#000', borderRadius: '980px', textTransform: 'none', fontFamily: T.font, fontWeight: 700, fontSize: '0.875rem', '&:hover': { backgroundColor: '#50E88A' }, '&:disabled': { opacity: 0.5 } }}
        >
          {isLoading ? 'Reactivating…' : 'Reactivate Exam'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
const STATUS_FILTERS = ['All', 'Live', 'Upcoming', 'Ended'];

const AllExamsPage = () => {
  const navigate = useNavigate();

  /* UI state */
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  /* Assign dialog state */
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  /* Delete dialog state */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  /* Duplicate in-flight tracking */
  const [duplicatingId, setDuplicatingId] = useState(null);

  /* Reactivate dialog state */
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [examToReactivate, setExamToReactivate] = useState(null);

  /* RTK Query */
  const { data: examsData, isLoading: examsLoading, error: examsError } = useGetExamsQuery();
  const { data: studentsData, isLoading: studentsLoading } = useGetStudentsQuery();
  const [assignStudents, { isLoading: isAssigning }] = useAssignStudentsToExamMutation();
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExamMutation();
  const [createExam] = useCreateExamMutation();
  const [updateExam, { isLoading: isReactivating }] = useUpdateExamMutation();

  /* ── Data derived ────────────────────────────────────────── */
  const exams = examsData || [];
  const students = studentsData?.data || [];

  const stats = useMemo(
    () => ({
      total: exams.length,
      live: exams.filter((e) => getExamStatus(e).label === 'Live').length,
      upcoming: exams.filter((e) => getExamStatus(e).label === 'Upcoming').length,
      ended: exams.filter((e) => getExamStatus(e).label === 'Ended').length,
    }),
    [exams],
  );

  const statusCounts = {
    All: exams.length,
    Live: stats.live,
    Upcoming: stats.upcoming,
    Ended: stats.ended,
  };

  const filteredExams = useMemo(() => {
    let result = exams;

    if (statusFilter !== 'All') {
      result = result.filter((e) => getExamStatus(e).label === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.examName?.toLowerCase().includes(q) ||
          e.subject?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [exams, statusFilter, searchQuery]);

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase()),
  );

  /* ── Handlers ────────────────────────────────────────────── */
  const handleOpenAssignDialog = (exam) => {
    setSelectedExam(exam);
    setSelectedStudentIds(exam.eligibleStudents?.map((s) => s._id) || []);
    setOpenAssignDialog(true);
    setStudentSearch('');
  };

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedExam(null);
    setSelectedStudentIds([]);
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
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
        toast.success('Students assigned successfully');
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

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setExamToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteExam(examToDelete.examId).unwrap();
      toast.success('Exam deleted');
      handleDeleteCancel();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete exam');
    }
  };

  const handleReactivate = (exam) => {
    setExamToReactivate(exam);
    setReactivateDialogOpen(true);
  };

  const handleReactivateConfirm = async (exam, hours) => {
    const now = new Date();
    const deadDate = new Date(now.getTime() + hours * 3600000);
    try {
      await updateExam({
        examId: exam.examId,
        // carry all required fields the backend validates
        examName: exam.examName,
        totalQuestions: exam.totalQuestions,
        duration: exam.duration,
        description: exam.description,
        subject: exam.subject,
        instructions: exam.instructions,
        passingScore: exam.passingScore,
        marksPerQuestion: exam.marksPerQuestion,
        negativeMarking: exam.negativeMarking,
        maxAttempts: exam.maxAttempts,
        shuffleQuestions: exam.shuffleQuestions,
        allowReview: exam.allowReview,
        tags: exam.tags,
        // only these two actually change
        liveDate: now.toISOString(),
        deadDate: deadDate.toISOString(),
      }).unwrap();
      toast.success(`"${exam.examName}" is now active for ${hours < 24 ? `${hours}h` : `${hours / 24}d`}`);
      setReactivateDialogOpen(false);
      setExamToReactivate(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reactivate exam');
    }
  };

  const handleViewQuestions = (examId) => {
    localStorage.setItem('selectedExamId', examId);
    navigate('/add-questions');
  };

  const handleEdit = (exam) => {
    navigate(`/edit-exam/${exam.examId}`, { state: { exam } });
  };

  const handleDuplicate = async (exam) => {
    setDuplicatingId(exam.examId);
    try {
      await createExam({
        examName: `Copy of ${exam.examName}`,
        totalQuestions: exam.totalQuestions,
        duration: exam.duration,
        liveDate: exam.liveDate,
        deadDate: exam.deadDate,
        description: exam.description,
        subject: exam.subject,
        instructions: exam.instructions,
        passingScore: exam.passingScore,
        marksPerQuestion: exam.marksPerQuestion,
        negativeMarking: exam.negativeMarking,
        maxAttempts: exam.maxAttempts,
        shuffleQuestions: exam.shuffleQuestions,
        allowReview: exam.allowReview,
        tags: exam.tags,
      }).unwrap();
      toast.success(`Duplicated "${exam.examName}" successfully`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to duplicate exam');
    } finally {
      setDuplicatingId(null);
    }
  };

  /* ── Loading / error states ──────────────────────────────── */
  if (examsLoading) {
    return (
      <PageContainer title="All Exams">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: T.blue }} />
        </Box>
      </PageContainer>
    );
  }

  if (examsError) {
    return (
      <PageContainer title="All Exams">
        <Box
          sx={{
            backgroundColor: `${T.red}12`,
            border: `0.5px solid ${T.red}40`,
            borderRadius: '12px',
            p: 3,
            mt: 2,
          }}
        >
          <Typography sx={{ color: T.red, fontFamily: T.font }}>
            {examsError?.data?.message || 'Failed to fetch exams'}
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <PageContainer title="All Exams">
      {/* Inject pulse keyframes */}
      <style>{PULSE_STYLE}</style>

      <Box sx={{ pb: 6 }}>
        {/* ── Page header ────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 4,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.75rem',
                color: T.textPrimary,
                letterSpacing: '-0.04em',
                fontFamily: T.font,
                lineHeight: 1,
              }}
            >
              All Exams
            </Typography>
            <Typography
              sx={{
                fontSize: '0.9375rem',
                color: T.textTertiary,
                mt: 0.75,
                letterSpacing: '-0.01em',
                fontFamily: T.font,
              }}
            >
              Manage exams, questions and student assignments
            </Typography>
          </Box>

          <Button
            onClick={() => navigate('/create-exam')}
            startIcon={<IconPlus size={16} />}
            sx={{
              backgroundColor: T.blue,
              color: '#fff',
              borderRadius: '980px',
              px: 2.5,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: T.font,
              textTransform: 'none',
              flexShrink: 0,
              '&:hover': { backgroundColor: '#409CFF' },
            }}
          >
            New Exam
          </Button>
        </Box>

        {/* ── Stats row ──────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 3.5 }}>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard icon={IconClipboardList} value={stats.total} label="Total Exams" accent={T.blue} />
          </Grid>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard icon={IconShieldCheck} value={stats.live} label="Live Now" accent={T.green} />
          </Grid>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard icon={IconCalendarEvent} value={stats.upcoming} label="Upcoming" accent={T.amber} />
          </Grid>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard icon={IconUsers} value={stats.ended} label="Ended" accent="rgba(235,235,245,0.4)" />
          </Grid>
        </Grid>

        {/* ── Exams section ──────────────────────────────────── */}
        <Box
          sx={{
            backgroundColor: T.card,
            border: `0.5px solid ${T.borderSubtle}`,
            borderRadius: '18px',
            overflow: 'hidden',
          }}
        >
          {/* Section toolbar */}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: `0.5px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            {/* Title */}
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: T.textPrimary,
                letterSpacing: '-0.02em',
                fontFamily: T.font,
                mr: 0.5,
              }}
            >
              Exams
            </Typography>

            {/* Status filter tabs */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f;
                return (
                  <Box
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: '980px',
                      cursor: 'pointer',
                      backgroundColor: active ? T.blue : 'transparent',
                      border: active ? `0.5px solid ${T.blue}` : `0.5px solid ${T.borderSubtle}`,
                      transition: 'all 0.15s',
                      '&:hover': {
                        backgroundColor: active ? T.blue : 'rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: active ? '#fff' : T.textSecondary,
                        fontFamily: T.font,
                        lineHeight: 1,
                      }}
                    >
                      {f}
                    </Typography>
                    <Box
                      sx={{
                        backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                        borderRadius: '980px',
                        px: 0.75,
                        py: 0.15,
                        minWidth: 18,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: active ? '#fff' : T.textTertiary,
                          fontFamily: T.font,
                          lineHeight: 1,
                        }}
                      >
                        {statusCounts[f]}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Search bar */}
            <Box
              sx={{
                position: 'relative',
                flex: 1,
                minWidth: 160,
                maxWidth: 320,
                ml: 'auto',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: T.textTertiary,
                  pointerEvents: 'none',
                  display: 'flex',
                }}
              >
                <IconSearch size={14} />
              </Box>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or subject…"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: `0.5px solid ${T.borderSubtle}`,
                  borderRadius: '10px',
                  padding: '8px 12px 8px 32px',
                  color: T.textPrimary,
                  fontSize: '0.8125rem',
                  fontFamily: T.font,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = `${T.blue}80`)}
                onBlur={(e) => (e.target.style.borderColor = T.borderSubtle)}
              />
            </Box>

            {/* View toggle */}
            <Box
              sx={{
                display: 'flex',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                p: 0.375,
                gap: 0.25,
                border: `0.5px solid ${T.borderSubtle}`,
              }}
            >
              {[
                { mode: 'card', Icon: IconLayoutGrid, title: 'Card view' },
                { mode: 'table', Icon: IconTable, title: 'Table view' },
              ].map(({ mode, Icon, title }) => {
                const active = viewMode === mode;
                return (
                  <Tooltip key={mode} title={title} placement="top">
                    <IconButton
                      size="small"
                      onClick={() => setViewMode(mode)}
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '7px',
                        backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: active ? T.textPrimary : T.textTertiary,
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.09)' },
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={15} />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          {/* ── Empty state ──────────────────────────────────── */}
          {filteredExams.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center', px: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <IconClipboardList size={24} color={T.textTertiary} stroke={1.25} />
              </Box>
              <Typography
                sx={{
                  color: T.textSecondary,
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: T.font,
                  mb: 0.5,
                }}
              >
                {searchQuery || statusFilter !== 'All'
                  ? `No ${statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} exams found`
                  : 'No exams yet'}
              </Typography>
              <Typography
                sx={{
                  color: T.textTertiary,
                  fontSize: '0.875rem',
                  fontFamily: T.font,
                  mb: 2.5,
                }}
              >
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : statusFilter !== 'All'
                  ? `You have no ${statusFilter.toLowerCase()} exams at the moment.`
                  : 'Create your first exam to get started.'}
              </Typography>
              {!searchQuery && statusFilter === 'All' && (
                <Button
                  onClick={() => navigate('/create-exam')}
                  startIcon={<IconPlus size={15} />}
                  sx={{
                    backgroundColor: T.blue,
                    color: '#fff',
                    borderRadius: '980px',
                    px: 2.5,
                    fontSize: '0.875rem',
                    fontFamily: T.font,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#409CFF' },
                  }}
                >
                  Create Exam
                </Button>
              )}
              {(searchQuery || statusFilter !== 'All') && (
                <Button
                  onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                  sx={{
                    color: T.blue,
                    fontSize: '0.875rem',
                    fontFamily: T.font,
                    textTransform: 'none',
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
          ) : viewMode === 'card' ? (
            /* ── Card view ───────────────────────────────────── */
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2}>
                {filteredExams.map((exam) => (
                  <Grid item xs={12} md={6} lg={4} key={exam.examId}>
                    <ExamCard
                      exam={exam}
                      onAssign={handleOpenAssignDialog}
                      onViewQuestions={handleViewQuestions}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDeleteClick}
                      onReactivate={handleReactivate}
                      isDuplicating={duplicatingId === exam.examId}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            /* ── Table view ──────────────────────────────────── */
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    {[
                      'Exam',
                      'Subject',
                      'Tags',
                      'Questions',
                      'Duration',
                      'Live Date',
                      'Deadline',
                      'Status',
                      'Students',
                      'Actions',
                    ].map((col) => (
                      <TableCell
                        key={col}
                        align={['Questions', 'Duration', 'Status', 'Students', 'Actions'].includes(col) ? 'center' : 'left'}
                        sx={tableHeadCellSx}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExams.map((exam) => {
                    const status = getExamStatus(exam);
                    return (
                      <TableRow
                        key={exam.examId}
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' },
                          '&:last-child td': { borderBottom: 0 },
                        }}
                      >
                        {/* Exam name */}
                        <TableCell sx={tableCellSx}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              color: T.textPrimary,
                              letterSpacing: '-0.01em',
                              fontFamily: T.font,
                              maxWidth: 200,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {exam.examName}
                          </Typography>
                        </TableCell>

                        {/* Subject */}
                        <TableCell sx={tableCellSx}>
                          {exam.subject ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconBook size={13} color={T.textTertiary} stroke={1.5} />
                              <Typography sx={{ fontSize: '0.8125rem', color: T.textSecondary, fontFamily: T.font }}>
                                {exam.subject}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '0.8125rem', color: T.textTertiary, fontFamily: T.font }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Tags */}
                        <TableCell sx={{ ...tableCellSx, maxWidth: 160 }}>
                          <TagsRow tags={exam.tags || []} />
                          {(!exam.tags || exam.tags.length === 0) && (
                            <Typography sx={{ fontSize: '0.8125rem', color: T.textTertiary, fontFamily: T.font }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Questions */}
                        <TableCell align="center" sx={tableCellSx}>
                          <Chip
                            label={exam.totalQuestions}
                            size="small"
                            sx={{
                              backgroundColor: `${T.blue}18`,
                              color: T.blue,
                              border: `0.5px solid ${T.blue}30`,
                              fontFamily: T.font,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 22,
                            }}
                          />
                        </TableCell>

                        {/* Duration */}
                        <TableCell align="center" sx={tableCellSx}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <IconClock size={13} color={T.textTertiary} stroke={1.5} />
                            <Typography sx={{ fontSize: '0.8125rem', color: T.textSecondary, fontFamily: T.font }}>
                              {exam.duration}m
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Live date */}
                        <TableCell sx={tableCellSx}>
                          <Typography sx={{ fontSize: '0.8125rem', color: T.textTertiary, fontFamily: T.font, whiteSpace: 'nowrap' }}>
                            {formatDate(exam.liveDate)}
                          </Typography>
                        </TableCell>

                        {/* Deadline */}
                        <TableCell sx={tableCellSx}>
                          <Typography sx={{ fontSize: '0.8125rem', color: T.textTertiary, fontFamily: T.font, whiteSpace: 'nowrap' }}>
                            {formatDate(exam.deadDate)}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell align="center" sx={tableCellSx}>
                          <StatusBadge status={status} />
                        </TableCell>

                        {/* Students */}
                        <TableCell align="center" sx={tableCellSx}>
                          <Chip
                            label={exam.eligibleStudents?.length || 0}
                            size="small"
                            sx={{
                              backgroundColor:
                                (exam.eligibleStudents?.length || 0) > 0
                                  ? `${T.green}18`
                                  : 'rgba(255,255,255,0.05)',
                              color: (exam.eligibleStudents?.length || 0) > 0 ? T.green : T.textTertiary,
                              border: `0.5px solid ${(exam.eligibleStudents?.length || 0) > 0 ? T.green + '30' : T.borderSubtle}`,
                              fontFamily: T.font,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 22,
                            }}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center" sx={tableCellSx}>
                          <Stack direction="row" spacing={0.25} justifyContent="center">
                            <Tooltip title="Assign Students">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenAssignDialog(exam)}
                                sx={{ color: T.blue, width: 30, height: 30, '&:hover': { backgroundColor: `${T.blue}18` } }}
                              >
                                <IconUserPlus size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Questions">
                              <IconButton
                                size="small"
                                onClick={() => handleViewQuestions(exam.examId)}
                                sx={{ color: T.textSecondary, width: 30, height: 30, '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' } }}
                              >
                                <IconEye size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Exam">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(exam)}
                                sx={{ color: T.textSecondary, width: 30, height: 30, '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' } }}
                              >
                                <IconEdit size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Duplicate Exam">
                              <IconButton
                                size="small"
                                onClick={() => handleDuplicate(exam)}
                                disabled={duplicatingId === exam.examId}
                                sx={{ color: T.purple, width: 30, height: 30, '&:hover': { backgroundColor: `${T.purple}18` }, '&:disabled': { opacity: 0.4 } }}
                              >
                                {duplicatingId === exam.examId ? (
                                  <CircularProgress size={12} sx={{ color: T.purple }} />
                                ) : (
                                  <IconCopy size={15} />
                                )}
                              </IconButton>
                            </Tooltip>
                            {status.label === 'Ended' && (
                              <Tooltip title="Reactivate Exam">
                                <IconButton
                                  size="small"
                                  onClick={() => handleReactivate(exam)}
                                  sx={{ color: T.green, width: 30, height: 30, '&:hover': { backgroundColor: `${T.green}18` } }}
                                >
                                  <IconPlayerPlay size={15} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Exam">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(exam)}
                                sx={{ color: T.red, width: 30, height: 30, '&:hover': { backgroundColor: `${T.red}18` } }}
                              >
                                <IconTrash size={15} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>

        {/* ── Delete confirmation dialog ──────────────────────── */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth sx={dialogSx}>
          <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: `${T.red}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconAlertTriangle size={18} color={T.red} />
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: '1.0625rem', color: T.textPrimary, fontFamily: T.font }}>
                  Delete Exam
                </Typography>
              </Box>
              <IconButton onClick={handleDeleteCancel} size="small" sx={{ color: T.textTertiary }}>
                <IconX size={18} />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {examToDelete && (
              <Box>
                <Typography sx={{ fontSize: '0.9375rem', color: T.textSecondary, fontFamily: T.font, mb: 2 }}>
                  Are you sure you want to delete{' '}
                  <span style={{ color: T.textPrimary, fontWeight: 600 }}>{examToDelete.examName}</span>? This action
                  cannot be undone.
                </Typography>
                <Box
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                  }}
                >
                  {[
                    ['Questions', examToDelete.totalQuestions],
                    ['Duration', `${examToDelete.duration} minutes`],
                    ['Assigned Students', examToDelete.eligibleStudents?.length || 0],
                  ].map(([k, v]) => (
                    <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '0.8125rem', color: T.textTertiary, fontFamily: T.font }}>{k}</Typography>
                      <Typography sx={{ fontSize: '0.8125rem', color: T.textSecondary, fontFamily: T.font }}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
            <Button
              onClick={handleDeleteCancel}
              sx={{
                color: T.textSecondary,
                borderRadius: '980px',
                px: 2.5,
                textTransform: 'none',
                fontFamily: T.font,
                fontWeight: 500,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={15} color="inherit" /> : <IconTrash size={15} />}
              sx={{
                backgroundColor: T.red,
                color: '#fff',
                borderRadius: '980px',
                px: 2.5,
                textTransform: 'none',
                fontFamily: T.font,
                fontWeight: 600,
                '&:hover': { backgroundColor: '#FF6B61' },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete Exam'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Reactivate Exam dialog ─────────────────────────── */}
        <ReactivateDialog
          open={reactivateDialogOpen}
          exam={examToReactivate}
          onClose={() => { setReactivateDialogOpen(false); setExamToReactivate(null); }}
          onConfirm={handleReactivateConfirm}
          isLoading={isReactivating}
        />

        {/* ── Assign students dialog ──────────────────────────── */}
        <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth sx={dialogSx}>
          <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '1.0625rem', color: T.textPrimary, fontFamily: T.font }}>
                  Assign Students
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: T.textTertiary, fontFamily: T.font, mt: 0.25 }}>
                  {selectedExam?.examName}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseAssignDialog} size="small" sx={{ color: T.textTertiary }}>
                <IconX size={18} />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
            {studentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: T.blue }} />
              </Box>
            ) : students.length === 0 ? (
              <Typography sx={{ color: T.textTertiary, fontFamily: T.font, textAlign: 'center', py: 3 }}>
                No students available.
              </Typography>
            ) : (
              <Box>
                {/* Student search */}
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: T.textTertiary,
                      pointerEvents: 'none',
                      display: 'flex',
                    }}
                  >
                    <IconSearch size={14} />
                  </Box>
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students…"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: `0.5px solid ${T.borderSubtle}`,
                      borderRadius: '10px',
                      padding: '10px 12px 10px 36px',
                      color: T.textPrimary,
                      fontSize: '0.875rem',
                      fontFamily: T.font,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </Box>

                <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: T.textTertiary,
                      fontFamily: T.font,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {filteredStudents.length} students
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: T.blue, fontFamily: T.font, fontWeight: 500 }}>
                    {selectedStudentIds.length} selected
                  </Typography>
                </Box>

                <List sx={{ maxHeight: 320, overflow: 'auto', mx: -1 }}>
                  {filteredStudents.map((student) => {
                    const checked = selectedStudentIds.includes(student.id);
                    return (
                      <ListItem key={student.id} disablePadding>
                        <ListItemButton
                          onClick={() => handleToggleStudent(student.id)}
                          dense
                          sx={{
                            borderRadius: '10px',
                            mx: 1,
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Checkbox
                              edge="start"
                              checked={checked}
                              tabIndex={-1}
                              disableRipple
                              sx={{
                                color: 'rgba(255,255,255,0.2)',
                                '&.Mui-checked': { color: T.blue },
                                p: 0.5,
                              }}
                            />
                          </ListItemIcon>
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              backgroundColor: T.blue,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              mr: 1.5,
                            }}
                          >
                            {student.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <ListItemText
                            primary={
                              <Typography
                                sx={{
                                  fontSize: '0.875rem',
                                  color: T.textPrimary,
                                  fontFamily: T.font,
                                  fontWeight: 500,
                                }}
                              >
                                {student.name}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                sx={{ fontSize: '0.75rem', color: T.textTertiary, fontFamily: T.font }}
                              >
                                {student.email}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
            <Button
              onClick={handleCloseAssignDialog}
              disabled={isAssigning}
              sx={{
                color: T.textSecondary,
                borderRadius: '980px',
                px: 2.5,
                textTransform: 'none',
                fontFamily: T.font,
                fontWeight: 500,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignStudents}
              disabled={isAssigning || students.length === 0}
              startIcon={
                isAssigning ? <CircularProgress size={15} color="inherit" /> : <IconUserPlus size={15} />
              }
              sx={{
                backgroundColor: T.blue,
                color: '#fff',
                borderRadius: '980px',
                px: 2.5,
                textTransform: 'none',
                fontFamily: T.font,
                fontWeight: 600,
                '&:hover': { backgroundColor: '#409CFF' },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              {isAssigning ? 'Assigning…' : 'Assign Students'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default AllExamsPage;
