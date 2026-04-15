import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Grid, Typography, Stack, CircularProgress, LinearProgress,
  Avatar, Button, Chip, Tooltip, Divider, IconButton,
} from '@mui/material';
import {
  IconClipboardList, IconArrowRight, IconAward, IconTrendingUp,
  IconClock, IconCalendar, IconShieldCheck, IconChartBar,
  IconHourglass, IconCheckbox, IconFlame, IconStar, IconTarget,
  IconBolt, IconBook, IconMedal, IconConfetti, IconBrain,
  IconEdit, IconUser, IconMail, IconBuilding, IconId, IconPhone,
  IconNotes, IconDeviceFloppy, IconX, IconCheck, IconLock,
  IconPercentage, IconHash,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import ReactApexChart from 'react-apexcharts';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { useUpdateUserMutation } from '../../slices/usersApiSlice';
import { setCredentials, logout } from '../../slices/authSlice';
import axiosInstance from '../../axios';
import { toast } from 'react-toastify';

// ── Constants ────────────────────────────────────────────────────────────────
const C = {
  blue: '#0A84FF', green: '#30D158', red: '#FF453A', amber: '#FF9F0A',
  purple: '#BF5AF2', gold: '#FFD60A', teal: '#5AC8FA', orange: '#FF6B00',
  card: '#1C1C1E', border: 'rgba(255,255,255,0.08)', borderActive: 'rgba(84,84,88,0.65)',
  text: '#FFFFFF', textSub: 'rgba(235,235,245,0.45)', textMuted: 'rgba(235,235,245,0.25)',
  font: 'Inter, -apple-system, sans-serif',
};

const AVATAR_GRADIENTS = [
  ['#0A84FF', '#5E5CE6'], ['#30D158', '#0A84FF'], ['#FF9F0A', '#FF6B00'],
  ['#FF453A', '#FF9F0A'], ['#BF5AF2', '#5E5CE6'], ['#30D158', '#5AC8FA'],
];
const avatarGradient = (name = '') => {
  const [a, b] = AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

const pad = (n) => String(n).padStart(2, '0');
const formatCountdown = (ms) => {
  if (ms <= 0) return 'Starting soon';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
};
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
const getStatus = (l, d) => {
  const now = new Date();
  if (now < new Date(l)) return 'upcoming';
  if (now > new Date(d)) return 'ended';
  return 'live';
};
const scoreColor = (s) => s >= 80 ? C.green : s >= 60 ? C.amber : C.red;
const scoreLabel = (s) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';

// ── Sub-components ────────────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, value, label, color, sub, loading, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      backgroundColor: C.card, border: `0.5px solid ${C.border}`,
      borderRadius: '16px', p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5,
      position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s, border-color 0.15s',
      '&:hover': onClick ? { transform: 'translateY(-2px)', borderColor: `${color}40` } : {},
    }}
  >
    <Box sx={{ position: 'absolute', top: -12, right: -12, width: 72, height: 72, borderRadius: '50%', background: `${color}10`, pointerEvents: 'none' }} />
    <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={19} color={color} stroke={1.75} />
    </Box>
    <Box>
      {loading
        ? <Box sx={{ height: 32, display: 'flex', alignItems: 'center' }}><CircularProgress size={16} sx={{ color }} /></Box>
        : <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', color: C.text, letterSpacing: '-0.05em', lineHeight: 1, fontFamily: C.font }}>{value}</Typography>
      }
      <Typography sx={{ fontSize: '0.75rem', color: C.textSub, mt: 0.4, fontFamily: C.font }}>{label}</Typography>
      {sub && <Typography sx={{ fontSize: '0.625rem', color, fontWeight: 600, mt: 0.2, fontFamily: C.font }}>{sub}</Typography>}
    </Box>
  </Box>
);

const SectionHeader = ({ icon: Icon, title, color = C.blue, action, onAction }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={color} stroke={1.75} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: C.text, fontFamily: C.font }}>{title}</Typography>
    </Box>
    {action && (
      <Box onClick={onAction} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, cursor: 'pointer', '&:hover': { opacity: 0.75 } }}>
        <Typography sx={{ fontSize: '0.75rem', color: C.blue, fontFamily: C.font }}>{action}</Typography>
        <IconArrowRight size={12} color={C.blue} />
      </Box>
    )}
  </Box>
);

const AchievementBadge = ({ icon: Icon, label, desc, color, earned }) => (
  <Tooltip title={desc} arrow placement="top">
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, p: 1.25,
      borderRadius: '12px', border: `0.5px solid ${earned ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
      backgroundColor: earned ? `${color}08` : 'rgba(255,255,255,0.02)',
      transition: 'transform 0.15s', cursor: 'default',
      '&:hover': earned ? { transform: 'translateY(-2px)' } : {},
      opacity: earned ? 1 : 0.4, position: 'relative',
    }}>
      <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: earned ? `${color}20` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={earned ? color : 'rgba(235,235,245,0.2)'} stroke={1.75} />
      </Box>
      <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: earned ? color : C.textMuted, fontFamily: C.font, textAlign: 'center', lineHeight: 1.2 }}>
        {label}
      </Typography>
      {!earned && <Box sx={{ position: 'absolute', top: 4, right: 4 }}><IconLock size={8} color="rgba(235,235,245,0.2)" /></Box>}
    </Box>
  </Tooltip>
);

const ProfileField = ({ icon: Icon, label, value, placeholder }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
    <Box sx={{ width: 26, height: 26, borderRadius: '7px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
      <Icon size={13} color="rgba(235,235,245,0.4)" stroke={1.5} />
    </Box>
    <Box>
      <Typography sx={{ fontSize: '0.6875rem', color: C.textMuted, fontFamily: C.font, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: value ? 'rgba(235,235,245,0.85)' : C.textMuted, fontFamily: C.font, mt: 0.1, fontStyle: value ? 'normal' : 'italic' }}>
        {value || placeholder || 'Not set'}
      </Typography>
    </Box>
  </Box>
);

// ── Edit Profile Dialog ───────────────────────────────────────────────────────
const inputStyle = (err) => ({
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: `0.5px solid ${err ? 'rgba(255,69,58,0.6)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '10px', padding: '10px 13px', color: C.text,
  fontSize: '0.875rem', fontFamily: C.font, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
});

const EditProfileDialog = ({ open, onClose, userInfo, onSave }) => {
  const [values, setValues] = useState({
    name: userInfo?.name || '', phone: userInfo?.phone || '',
    institution: userInfo?.institution || '', department: userInfo?.department || '',
    studentId: userInfo?.studentId || '', bio: userInfo?.bio || '',
    password: '', confirm: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (k) => (e) => setValues((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!values.name.trim()) { toast.error('Name is required'); return; }
    if (values.password && values.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (values.password && values.password !== values.confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await onSave({ ...values });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const fields = [
    { key: 'name', label: 'Full Name', icon: IconUser, placeholder: 'Your full name' },
    { key: 'phone', label: 'Phone', icon: IconPhone, placeholder: '+1 234 567 8900' },
    { key: 'institution', label: 'Institution', icon: IconBuilding, placeholder: 'University / School' },
    { key: 'department', label: 'Department', icon: IconBook, placeholder: 'e.g. Computer Science' },
    { key: 'studentId', label: 'Student ID', icon: IconId, placeholder: 'e.g. STU-2024-001' },
    { key: 'bio', label: 'Bio', icon: IconNotes, placeholder: 'A short bio about yourself', multiline: true },
  ];

  return (
    <Box sx={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '20px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: `0.5px solid ${C.borderActive}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '9px', backgroundColor: `${C.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconEdit size={16} color={C.blue} />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: C.text, fontFamily: C.font }}>Edit Profile</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: C.textSub, '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' } }}>
            <IconX size={17} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
          <Stack spacing={2}>
            {fields.map(({ key, label, icon: Icon, placeholder, multiline }) => (
              <Box key={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                  <Icon size={13} color="rgba(235,235,245,0.4)" />
                  <Typography sx={{ fontSize: '0.8125rem', color: C.textSub, fontFamily: C.font, fontWeight: 500 }}>{label}</Typography>
                </Box>
                {multiline ? (
                  <textarea value={values[key]} onChange={handleChange(key)} placeholder={placeholder}
                    rows={3} style={{ ...inputStyle(false), resize: 'none' }} />
                ) : (
                  <input value={values[key]} onChange={handleChange(key)} placeholder={placeholder}
                    style={inputStyle(false)} />
                )}
              </Box>
            ))}

            <Divider sx={{ borderColor: C.borderActive, my: 0.5 }} />
            <Typography sx={{ fontSize: '0.8125rem', color: C.textSub, fontFamily: C.font, fontWeight: 600 }}>Change Password <span style={{ fontWeight: 400, opacity: 0.6 }}>(leave blank to keep current)</span></Typography>

            {[{ key: 'password', label: 'New Password', placeholder: 'Min. 6 characters' }, { key: 'confirm', label: 'Confirm Password', placeholder: 'Repeat new password' }].map(({ key, label, placeholder }) => (
              <Box key={key}>
                <Typography sx={{ fontSize: '0.8125rem', color: C.textSub, fontFamily: C.font, fontWeight: 500, mb: 0.75 }}>{label}</Typography>
                <input type="password" value={values[key]} onChange={handleChange(key)} placeholder={placeholder} style={inputStyle(false)} />
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2.5, borderTop: `0.5px solid ${C.borderActive}`, display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={saving} sx={{ flex: 1, color: C.textSub, borderRadius: '980px', textTransform: 'none', fontFamily: C.font, '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <IconDeviceFloppy size={15} />}
            sx={{ flex: 2, backgroundColor: C.blue, color: '#fff', borderRadius: '980px', textTransform: 'none', fontFamily: C.font, fontWeight: 600, '&:hover': { backgroundColor: '#409CFF' }, '&:disabled': { opacity: 0.5 } }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((s) => s.auth);
  const { data: exams = [], isLoading: examsLoading } = useGetExamsQuery(undefined, { skip: !userInfo });
  const [updateProfile] = useUpdateUserMutation();
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

  // Fetch results
  useEffect(() => {
    axiosInstance.get('/api/users/results/user', { withCredentials: true })
      .then(r => setResults(r.data.data || []))
      .catch((err) => { if (err?.response?.status === 401) dispatch(logout()); })
      .finally(() => setResultsLoading(false));
  }, []);

  // Exam categories
  const liveExams     = useMemo(() => exams.filter(e => getStatus(e.liveDate, e.deadDate) === 'live'), [exams]);
  const upcomingExams = useMemo(() => exams.filter(e => getStatus(e.liveDate, e.deadDate) === 'upcoming'), [exams]);
  const endedExams    = useMemo(() => exams.filter(e => getStatus(e.liveDate, e.deadDate) === 'ended'), [exams]);
  const nextExam      = useMemo(() => [...upcomingExams].sort((a, b) => new Date(a.liveDate) - new Date(b.liveDate))[0] || null, [upcomingExams]);

  // Result stats
  const sortedResults = useMemo(() => [...results].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [results]);
  const avgScore      = useMemo(() => results.length > 0 ? (results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0, [results]);
  const bestScore     = useMemo(() => results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0, [results]);
  const passCount     = useMemo(() => results.filter(r => r.percentage >= 60).length, [results]);
  const passRate      = useMemo(() => results.length > 0 ? (passCount / results.length) * 100 : 0, [results, passCount]);

  // Streak calculation (consecutive passed exams from most recent)
  const currentStreak = useMemo(() => {
    let s = 0;
    for (const r of sortedResults) { if (r.percentage >= 60) s++; else break; }
    return s;
  }, [sortedResults]);

  // Profile completion
  const profileCompletion = useMemo(() => {
    const fields = [userInfo?.name, userInfo?.email, userInfo?.phone, userInfo?.institution, userInfo?.department, userInfo?.studentId, userInfo?.bio];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [userInfo]);

  // Achievements
  const achievements = useMemo(() => [
    { icon: IconBook,     label: 'First Exam',     desc: 'Completed your first exam',         color: C.blue,   earned: results.length >= 1 },
    { icon: IconAward,    label: 'First Pass',     desc: 'Passed your first exam',            color: C.green,  earned: passCount >= 1 },
    { icon: IconFlame,    label: '3-Streak',       desc: '3 consecutive passed exams',        color: C.orange, earned: currentStreak >= 3 },
    { icon: IconStar,     label: 'High Scorer',    desc: 'Scored 90% or above',               color: C.gold,   earned: bestScore >= 90 },
    { icon: IconTarget,   label: 'Perfect',        desc: 'Scored 100% on an exam',            color: C.purple, earned: bestScore >= 100 },
    { icon: IconBrain,    label: 'Consistent',     desc: 'Average score above 75%',           color: C.teal,   earned: avgScore >= 75 },
    { icon: IconMedal,    label: '5 Exams',        desc: 'Completed 5 exams',                 color: C.amber,  earned: results.length >= 5 },
    { icon: IconConfetti, label: 'Scholar',        desc: 'Completed 10 exams with 70%+ avg',  color: C.purple, earned: results.length >= 10 && avgScore >= 70 },
  ], [results.length, passCount, currentStreak, bestScore, avgScore]);

  const earnedCount = achievements.filter(a => a.earned).length;

  // Countdown
  useEffect(() => {
    if (!nextExam) return;
    const upd = () => setCountdown(formatCountdown(new Date(nextExam.liveDate) - new Date()));
    upd();
    const id = setInterval(upd, 1000);
    return () => clearInterval(id);
  }, [nextExam]);

  // Charts
  const scoreTrend = useMemo(() => {
    const s = [...results].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(-10);
    return { cats: s.map((_, i) => `#${i + 1}`), vals: s.map(r => parseFloat(r.percentage.toFixed(1))), names: s.map(r => r.examId?.examName || `Exam`) };
  }, [results]);

  const trendOptions = useMemo(() => ({
    chart: { background: 'transparent', toolbar: { show: false }, type: 'area', animations: { enabled: true, speed: 600 } },
    theme: { mode: 'dark' },
    stroke: { curve: 'smooth', width: 2.5, colors: [C.blue] },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0, stops: [0, 100] } },
    colors: [C.blue],
    xaxis: { categories: scoreTrend.cats, labels: { style: { colors: C.textSub, fontFamily: C.font, fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: 0, max: 100, labels: { formatter: v => `${v}%`, style: { colors: [C.textSub], fontFamily: C.font, fontSize: '11px' } } },
    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
    markers: { size: 5, colors: [C.blue], strokeColors: '#1C1C1E', strokeWidth: 2, hover: { size: 7 } },
    dataLabels: { enabled: false },
    annotations: { yaxis: [{ y: 60, borderColor: C.amber, strokeDashArray: 5, label: { text: 'Pass line', style: { color: C.amber, background: 'transparent', fontFamily: C.font, fontSize: '10px', padding: { left: 4, right: 4 } } } }] },
    tooltip: {
      theme: 'dark', style: { fontFamily: C.font },
      y: { formatter: v => `${v.toFixed(1)}%` },
      custom: ({ dataPointIndex }) => {
        const name = scoreTrend.names[dataPointIndex] || '';
        const val = scoreTrend.vals[dataPointIndex] || 0;
        return `<div style="background:#2C2C2E;border:0.5px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;font-family:Inter,sans-serif;font-size:12px;"><div style="color:rgba(235,235,245,0.5);margin-bottom:3px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div><div style="color:#FFFFFF;font-weight:700;font-size:14px">${val}%</div></div>`;
      },
    },
  }), [scoreTrend]);

  const donutOptions = useMemo(() => ({
    chart: { background: 'transparent', toolbar: { show: false } },
    theme: { mode: 'dark' },
    labels: ['Passed', 'Failed'],
    colors: [C.green, 'rgba(255,255,255,0.1)'],
    plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Pass Rate', color: C.textSub, fontFamily: C.font, fontSize: '0.75rem', formatter: () => `${passRate.toFixed(0)}%` }, value: { color: C.text, fontFamily: C.font, fontWeight: 700 } } } } },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: { show: false },
    tooltip: { theme: 'dark', style: { fontFamily: C.font }, y: { formatter: v => `${v} exam${v !== 1 ? 's' : ''}` } },
  }), [passRate]);

  // Radial score chart
  const radialOptions = useMemo(() => ({
    chart: { background: 'transparent', toolbar: { show: false }, type: 'radialBar' },
    plotOptions: {
      radialBar: {
        startAngle: -130, endAngle: 130,
        hollow: { size: '64%' },
        track: { background: 'rgba(255,255,255,0.06)', strokeWidth: '100%' },
        dataLabels: {
          name: { offsetY: 18, color: C.textSub, fontFamily: C.font, fontSize: '12px' },
          value: { offsetY: -16, color: C.text, fontFamily: C.font, fontSize: '2rem', fontWeight: 800, formatter: v => `${v}%` },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: { shade: 'dark', type: 'horizontal', gradientToColors: [C.purple], stops: [0, 100], colorStops: [[{ offset: 0, color: C.blue }, { offset: 100, color: C.purple }]] },
    },
    stroke: { lineCap: 'round' },
    labels: ['Avg Score'],
    colors: [C.blue],
  }), []);

  // Save profile handler
  const handleSaveProfile = useCallback(async (vals) => {
    try {
      const payload = { name: vals.name, email: userInfo.email, role: userInfo.role, phone: vals.phone, institution: vals.institution, department: vals.department, studentId: vals.studentId, bio: vals.bio };
      if (vals.password) payload.password = vals.password;
      const res = await updateProfile(payload).unwrap();
      dispatch(setCredentials(res));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile');
      throw err;
    }
  }, [userInfo, updateProfile, dispatch]);

  const initials = userInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S';
  const firstName = userInfo?.name?.split(' ')[0] || 'Student';

  return (
    <PageContainer title="My Dashboard">
      <Box sx={{ pb: 5 }}>

        {/* ── Live Exam Alert Banner ── */}
        {liveExams.length > 0 && (
          <Box sx={{ mb: 3, backgroundColor: 'rgba(48,209,88,0.08)', border: '0.5px solid rgba(48,209,88,0.3)', borderRadius: '14px', p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.green, boxShadow: `0 0 8px ${C.green}`, flexShrink: 0, animation: 'blink 1.2s infinite' }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: C.green, fontFamily: C.font }}>
                {liveExams.length} Exam{liveExams.length > 1 ? 's' : ''} Live Now
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: C.textSub, fontFamily: C.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                — {liveExams.map(e => e.examName).join(', ')}
              </Typography>
            </Box>
            <Button onClick={() => navigate('/exam')} endIcon={<IconArrowRight size={14} />}
              sx={{ backgroundColor: C.green, color: '#000', borderRadius: '980px', px: 2.25, py: 0.75, fontFamily: C.font, fontWeight: 700, fontSize: '0.8125rem', textTransform: 'none', '&:hover': { backgroundColor: '#50E88A' }, flexShrink: 0 }}>
              Start Exam
            </Button>
          </Box>
        )}

        <Grid container spacing={3}>

          {/* ═══════════════ LEFT COLUMN ═══════════════ */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={2.5}>

              {/* ── Profile Card ── */}
              <Box sx={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                {/* Gradient banner */}
                <Box sx={{ height: 90, background: `linear-gradient(135deg, ${C.blue}40 0%, ${C.purple}35 100%)`, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(10,132,255,0.35) 0%, transparent 55%), radial-gradient(circle at 75% 50%, rgba(191,90,242,0.25) 0%, transparent 55%)' }} />
                </Box>

                {/* Avatar + name section */}
                <Box sx={{ px: 2.5, pt: 0, pb: 2.5 }}>
                  {/* Avatar + Edit row */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mt: -4.5 }}>
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar sx={{ width: 76, height: 76, background: avatarGradient(userInfo?.name), fontSize: '1.75rem', fontWeight: 800, fontFamily: C.font, border: '3.5px solid #1C1C1E', boxShadow: '0 6px 24px rgba(0,0,0,0.6)' }}>
                        {initials}
                      </Avatar>
                      <Box sx={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', backgroundColor: C.green, border: '2.5px solid #1C1C1E', boxShadow: `0 0 8px ${C.green}` }} />
                    </Box>
                    <Button onClick={() => setEditOpen(true)} startIcon={<IconEdit size={12} />} size="small"
                      sx={{ mt: 5.5, backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(235,235,245,0.7)', borderRadius: '980px', px: 1.75, py: 0.6, fontFamily: C.font, fontWeight: 600, fontSize: '0.8125rem', textTransform: 'none', border: `0.5px solid ${C.border}`, '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' }, flexShrink: 0 }}>
                      Edit Profile
                    </Button>
                  </Box>

                  {/* Name + role chips */}
                  <Box sx={{ mt: 1.5, mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.3125rem', color: C.text, fontFamily: C.font, letterSpacing: '-0.035em', lineHeight: 1.15 }}>
                      {userInfo?.name || 'Student'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: C.textSub, fontFamily: C.font, mt: 0.25, mb: 1 }}>
                      {userInfo?.email}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip label="Student" size="small" sx={{ backgroundColor: `${C.blue}18`, color: C.blue, fontFamily: C.font, fontSize: '0.6875rem', fontWeight: 700, height: 20, '& .MuiChip-label': { px: 1 } }} />
                      {userInfo?.institution && (
                        <Chip label={userInfo.institution.length > 22 ? userInfo.institution.slice(0, 22) + '…' : userInfo.institution} size="small"
                          sx={{ backgroundColor: 'rgba(255,255,255,0.06)', color: C.textSub, fontFamily: C.font, fontSize: '0.6875rem', height: 20, '& .MuiChip-label': { px: 1 } }} />
                      )}
                      {userInfo?.department && (
                        <Chip label={userInfo.department.length > 18 ? userInfo.department.slice(0, 18) + '…' : userInfo.department} size="small"
                          sx={{ backgroundColor: `${C.purple}12`, color: C.purple, fontFamily: C.font, fontSize: '0.6875rem', height: 20, '& .MuiChip-label': { px: 1 } }} />
                      )}
                    </Stack>
                  </Box>

                  {/* Profile Completion */}
                  <Box sx={{ mb: 2.5, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: C.textSub, fontFamily: C.font, fontWeight: 500 }}>Profile completion</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: profileCompletion >= 80 ? C.green : C.amber, fontFamily: C.font, fontWeight: 700 }}>{profileCompletion}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={profileCompletion}
                      sx={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { borderRadius: 3, background: profileCompletion >= 80 ? `linear-gradient(90deg, ${C.green}, #50E88A)` : `linear-gradient(90deg, ${C.amber}, #FFD60A)` } }} />
                    {profileCompletion < 100 && (
                      <Typography sx={{ fontSize: '0.6875rem', color: C.textMuted, fontFamily: C.font, mt: 0.5 }}>
                        Add more details to complete your profile
                      </Typography>
                    )}
                  </Box>

                  {/* Profile fields */}
                  <Box sx={{ backgroundColor: 'rgba(255,255,255,0.025)', borderRadius: '12px', p: 1.75 }}>
                    <Stack spacing={1.5} divider={<Box sx={{ height: '0.5px', backgroundColor: 'rgba(255,255,255,0.05)' }} />}>
                      <ProfileField icon={IconPhone}    label="Phone"       value={userInfo?.phone} placeholder="Add phone number" />
                      <ProfileField icon={IconBuilding} label="Institution" value={userInfo?.institution} placeholder="Add institution" />
                      <ProfileField icon={IconBook}     label="Department"  value={userInfo?.department} placeholder="Add department" />
                      <ProfileField icon={IconId}       label="Student ID"  value={userInfo?.studentId} placeholder="Add student ID" />
                      {userInfo?.bio && <ProfileField icon={IconNotes} label="Bio" value={userInfo.bio} />}
                    </Stack>
                  </Box>
                </Box>
              </Box>

              {/* ── Achievements ── */}
              <Box sx={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: '18px', p: 2.5 }}>
                <SectionHeader icon={IconMedal} title="Achievements" color={C.gold} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, backgroundColor: 'rgba(255,214,10,0.06)', borderRadius: '10px', p: 1.25 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: `${C.gold}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconAward size={14} color={C.gold} />
                  </Box>
                  <Typography sx={{ fontSize: '0.8125rem', color: C.textSub, fontFamily: C.font }}>
                    <strong style={{ color: C.gold }}>{earnedCount}</strong> of {achievements.length} earned
                  </Typography>
                </Box>
                <Grid container spacing={1}>
                  {achievements.map((a) => (
                    <Grid item xs={3} key={a.label}>
                      <AchievementBadge {...a} />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* ── Quick Stats ── */}
              <Box sx={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: '18px', p: 2.5 }}>
                <SectionHeader icon={IconBolt} title="Quick Stats" color={C.amber} />
                <Stack spacing={1.5}>
                  {[
                    { label: 'Exams Assigned',  value: exams.length,                                    icon: IconClipboardList, color: C.blue   },
                    { label: 'Exams Completed', value: results.length,                                   icon: IconCheckbox,      color: C.green  },
                    { label: 'Exams Pending',   value: Math.max(0, endedExams.length - results.length), icon: IconHourglass,     color: C.amber  },
                    { label: 'Current Streak',  value: `${currentStreak} 🔥`,                           icon: IconFlame,         color: C.orange },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, borderBottom: `0.5px solid rgba(255,255,255,0.04)`, '&:last-child': { borderBottom: 'none' } }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={13} color={color} stroke={1.75} />
                      </Box>
                      <Typography sx={{ flex: 1, fontSize: '0.8125rem', color: C.textSub, fontFamily: C.font }}>{label}</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: C.text, fontFamily: C.font }}>{value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Grid>

          {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={2.5}>

              {/* ── Greeting + KPI Row ── */}
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.625rem', color: C.text, letterSpacing: '-0.04em', fontFamily: C.font, lineHeight: 1, mb: 0.5 }}>
                  {greeting()}, {firstName} 👋
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: C.textSub, fontFamily: C.font }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {[
                  { icon: IconClipboardList, value: exams.length,                       label: 'Total Exams',    color: C.blue,   sub: `${liveExams.length} live now`, loading: examsLoading, onClick: () => navigate('/exam') },
                  { icon: IconTrendingUp,    value: `${avgScore.toFixed(1)}%`,           label: 'Avg Score',     color: C.purple, sub: scoreLabel(avgScore),       loading: resultsLoading },
                  { icon: IconAward,         value: `${bestScore.toFixed(0)}%`,          label: 'Best Score',    color: C.gold,   sub: results.length ? 'Personal best' : '—', loading: resultsLoading },
                  { icon: IconPercentage,    value: `${passRate.toFixed(0)}%`,           label: 'Pass Rate',     color: C.green,  sub: `${passCount}/${results.length} passed`, loading: resultsLoading, onClick: () => navigate('/result') },
                ].map((card, i) => (
                  <Grid item xs={6} sm={3} key={i}>
                    <KPICard {...card} />
                  </Grid>
                ))}
              </Grid>

              {/* ── Performance Overview ── */}
              <Grid container spacing={2}>
                {/* Score Trend */}
                <Grid item xs={12} md={8}>
                  <Box sx={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: '18px', p: 2.5, height: '100%' }}>
                    <SectionHeader icon={IconTrendingUp} title="Score Trend" action="View results" onAction={() => navigate('/result')} />
                    {resultsLoading ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height={180}><CircularProgress size={22} sx={{ color: C.blue }} /></Box>
                    ) : scoreTrend.vals.length < 2 ? (
                      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={180} gap={1.5}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconChartBar size={22} color="rgba(235,235,245,0.15)" />
                        </Box>
                        <Typography sx={{ color: C.textMuted, fontFamily: C.font, fontSize: '0.875rem' }}>Complete at least 2 exams to see your trend</Typography>
                      </Box>
                    ) : (
                      <ReactApexChart options={trendOptions} series={[{ name: 'Score', data: scoreTrend.vals }]} type="area" height={190} />
                    )}
                  </Box>
                </Grid>

                {/* Average Score Radial + Donut */}
                <Grid item xs={12} md={4}>
                  <Stack spacing={2} sx={{ height: '100%' }}>
                    {/* Avg Score Radial */}
                    <Box sx={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: '18px', p: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {resultsLoading ? (
                        <CircularProgress size={22} sx={{ color: C.purple }} />
                      ) : results.length === 0 ? (
                        <Box textAlign="center">
                          <Typography sx={{ color: C.textMuted, fontFamily: C.font, fontSize: '0.8125rem' }}>No data yet</Typography>
                        </Box>
                      ) : (
                        <ReactApexChart options={radialOptions} series={[parseFloat(avgScore.toFixed(1))]} type="radialBar" height={160} />
                      )}
                    </Box>

                    {/* Pass/Fail Donut */}
                    {results.length > 0 && (
                      <Box sx={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: '18px', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text, fontFamily: C.font, mb: 0.5 }}>Pass / Fail</Typography>
                        <ReactApexChart options={donutOptions} series={[passCount, results.length - passCount]} type="donut" height={120} />
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          {[{ c: C.green, l: 'Passed', v: passCount }, { c: 'rgba(255,255,255,0.2)', l: 'Failed', v: results.length - passCount }].map(({ c, l, v }) => (
                            <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c }} />
                              <Typography sx={{ fontSize: '0.6875rem', color: C.textSub, fontFamily: C.font }}>{l}: <strong style={{ color: C.text }}>{v}</strong></Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>

              {/* ── Tabs: Overview / History ── */}
              <Box sx={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: '18px', overflow: 'hidden' }}>
                {/* Tab bar */}
                <Box sx={{ display: 'flex', borderBottom: `0.5px solid ${C.borderActive}` }}>
                  {[{ id: 'overview', label: 'Recent Results', icon: IconAward }, { id: 'history', label: 'All Exams', icon: IconCalendar }].map(({ id, label, icon: Icon }) => (
                    <Box key={id} onClick={() => setActiveTab(id)} sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, py: 1.5, cursor: 'pointer', borderBottom: activeTab === id ? `2px solid ${C.blue}` : '2px solid transparent', backgroundColor: activeTab === id ? 'rgba(10,132,255,0.04)' : 'transparent', transition: 'all 0.15s' }}>
                      <Icon size={14} color={activeTab === id ? C.blue : C.textSub} />
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: activeTab === id ? 700 : 500, color: activeTab === id ? C.blue : C.textSub, fontFamily: C.font }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ p: 2.5 }}>
                  {activeTab === 'overview' && (
                    <>
                      {resultsLoading ? (
                        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={22} sx={{ color: C.blue }} /></Box>
                      ) : results.length === 0 ? (
                        <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={2}>
                          <Box sx={{ width: 56, height: 56, borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconClipboardList size={26} color="rgba(235,235,245,0.15)" />
                          </Box>
                          <Typography sx={{ color: C.textMuted, fontFamily: C.font, fontSize: '0.9375rem' }}>No results yet</Typography>
                          <Button onClick={() => navigate('/exam')} endIcon={<IconArrowRight size={14} />}
                            sx={{ color: C.blue, textTransform: 'none', fontFamily: C.font, fontSize: '0.875rem', fontWeight: 500 }}>
                            Browse Exams
                          </Button>
                        </Box>
                      ) : (
                        <Stack spacing={0}>
                          {sortedResults.slice(0, 8).map((r, i) => {
                            const pct = r.percentage;
                            const passed = pct >= 60;
                            const sc = scoreColor(pct);
                            return (
                              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75, borderBottom: i < Math.min(sortedResults.length, 8) - 1 ? `0.5px solid rgba(255,255,255,0.05)` : 'none' }}>
                                {/* Score badge */}
                                <Box sx={{ width: 46, height: 46, borderRadius: '12px', backgroundColor: `${sc}12`, border: `0.5px solid ${sc}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: sc, fontFamily: C.font, lineHeight: 1 }}>{pct.toFixed(0)}</Typography>
                                  <Typography sx={{ fontSize: '0.5625rem', color: `${sc}90`, fontFamily: C.font }}>%</Typography>
                                </Box>

                                {/* Info */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: C.text, fontFamily: C.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {r.examId?.examName || 'Exam'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                                    <Typography sx={{ fontSize: '0.6875rem', color: C.textSub, fontFamily: C.font }}>
                                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6875rem', color: C.textMuted, fontFamily: C.font }}>
                                      · {r.totalMarks} marks
                                    </Typography>
                                  </Box>
                                  {/* Score bar */}
                                  <Box sx={{ mt: 0.75 }}>
                                    <LinearProgress variant="determinate" value={pct}
                                      sx={{ height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: sc } }} />
                                  </Box>
                                </Box>

                                {/* Pass/Fail badge */}
                                <Box sx={{ flexShrink: 0, backgroundColor: passed ? `${C.green}12` : `${C.red}12`, borderRadius: '20px', px: 1.25, py: 0.4, border: `0.5px solid ${passed ? C.green : C.red}25` }}>
                                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: passed ? C.green : C.red, fontFamily: C.font, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    {passed ? '✓ Pass' : '✗ Fail'}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>
                      )}
                      {results.length > 8 && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Button onClick={() => navigate('/result')} endIcon={<IconArrowRight size={14} />}
                            sx={{ color: C.blue, textTransform: 'none', fontFamily: C.font, fontWeight: 500, fontSize: '0.8125rem' }}>
                            View all {results.length} results
                          </Button>
                        </Box>
                      )}
                    </>
                  )}

                  {activeTab === 'history' && (
                    <>
                      {examsLoading ? (
                        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={22} sx={{ color: C.blue }} /></Box>
                      ) : exams.length === 0 ? (
                        <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={2}>
                          <Typography sx={{ color: C.textMuted, fontFamily: C.font, fontSize: '0.9375rem' }}>No exams assigned yet</Typography>
                        </Box>
                      ) : (
                        <Stack spacing={0}>
                          {[...exams].sort((a, b) => new Date(b.liveDate) - new Date(a.liveDate)).map((exam, i) => {
                            const st = getStatus(exam.liveDate, exam.deadDate);
                            const stColor = st === 'live' ? C.green : st === 'upcoming' ? C.amber : C.textMuted;
                            const result = results.find(r => r.examId === exam.examId || r.examId?._id === exam._id);
                            return (
                              <Box key={exam._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75, borderBottom: i < exams.length - 1 ? `0.5px solid rgba(255,255,255,0.05)` : 'none', cursor: st === 'live' ? 'pointer' : 'default', '&:hover': st === 'live' ? { backgroundColor: 'rgba(48,209,88,0.03)' } : {} }}
                                onClick={() => st === 'live' && navigate(`/exam/${exam.examId}`)}>
                                {/* Status dot */}
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: stColor, boxShadow: st === 'live' ? `0 0 7px ${stColor}` : 'none', flexShrink: 0, animation: st === 'live' ? 'blink 1.2s infinite' : 'none' }} />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: C.text, fontFamily: C.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {exam.examName}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.6875rem', color: C.textSub, fontFamily: C.font, mt: 0.3 }}>
                                    {exam.totalQuestions} Qs · {exam.duration}m
                                    {st === 'upcoming' && ` · Starts ${new Date(exam.liveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                    {st === 'ended' && ` · Ended ${new Date(exam.deadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                  </Typography>
                                </Box>

                                {/* Status chip */}
                                <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {result && (
                                    <Box sx={{ backgroundColor: `${scoreColor(result.percentage)}12`, borderRadius: '20px', px: 1, py: 0.3 }}>
                                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: scoreColor(result.percentage), fontFamily: C.font }}>{result.percentage.toFixed(0)}%</Typography>
                                    </Box>
                                  )}
                                  <Box sx={{ backgroundColor: st === 'live' ? `${C.green}15` : st === 'upcoming' ? `${C.amber}12` : 'rgba(255,255,255,0.06)', borderRadius: '20px', px: 1.25, py: 0.3 }}>
                                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: stColor, fontFamily: C.font, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      {st}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {/* ── Upcoming Exams ── */}
              {upcomingExams.length > 0 && (
                <Box sx={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: '18px', p: 2.5 }}>
                  <SectionHeader icon={IconCalendar} title="Upcoming Exams" color={C.amber} action="All exams" onAction={() => navigate('/exam')} />
                  <Stack spacing={1.25}>
                    {[...upcomingExams].sort((a, b) => new Date(a.liveDate) - new Date(b.liveDate)).slice(0, 3).map((exam, i) => {
                      const isNext = i === 0;
                      const msLeft = new Date(exam.liveDate) - new Date();
                      const hoursLeft = Math.floor(msLeft / 3600000);
                      const urgent = hoursLeft < 24;
                      return (
                        <Box key={exam._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.75, borderRadius: '12px', backgroundColor: isNext ? 'rgba(255,159,10,0.06)' : 'rgba(255,255,255,0.02)', border: `0.5px solid ${isNext ? 'rgba(255,159,10,0.2)' : C.border}` }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: isNext ? `${C.amber}18` : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isNext ? <IconHourglass size={18} color={C.amber} /> : <IconCalendar size={18} color={C.textSub} />}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: C.text, fontFamily: C.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {exam.examName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6875rem', color: C.textSub, fontFamily: C.font, mt: 0.2 }}>
                              {exam.totalQuestions} questions · {exam.duration} min
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            {isNext && countdown ? (
                              <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: C.amber, fontFamily: C.font, fontVariantNumeric: 'tabular-nums' }}>{countdown}</Typography>
                            ) : (
                              <Typography sx={{ fontSize: '0.75rem', color: urgent ? C.amber : C.textSub, fontFamily: C.font, fontWeight: urgent ? 600 : 400 }}>
                                {hoursLeft < 1 ? 'Soon' : hoursLeft < 24 ? `${hoursLeft}h` : `${Math.floor(hoursLeft / 24)}d`}
                              </Typography>
                            )}
                            <Typography sx={{ fontSize: '0.625rem', color: C.textMuted, fontFamily: C.font }}>
                              {new Date(exam.liveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}

            </Stack>
          </Grid>
        </Grid>

        {/* ── Edit Profile Dialog ── */}
        <EditProfileDialog open={editOpen} onClose={() => setEditOpen(false)} userInfo={userInfo} onSave={handleSaveProfile} />
      </Box>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </PageContainer>
  );
};

export default StudentDashboardPage;
