import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Grid, Typography, Button, Avatar, Stack, IconButton, Tooltip,
  LinearProgress, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment,
} from '@mui/material';
import {
  IconEye, IconAlertTriangle, IconUsers, IconRefresh, IconBell, IconBellOff,
  IconShieldCheck, IconShieldX, IconClock, IconCellSignal4, IconCellSignalOff,
  IconDeviceMobile, IconUserOff, IconLayoutColumns, IconFocusCentered,
  IconBrowserCheck, IconDeviceDesktop, IconSearch, IconMicrophone,
  IconActivity, IconX, IconWifi, IconUsb, IconBluetooth,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import ReactApexChart from 'react-apexcharts';
import {
  useGetActiveStudentsQuery,
  useGetRecentViolationsQuery,
  useGetProctoringStatsQuery,
} from 'src/slices/cheatingLogApiSlice';
import { apiSlice } from 'src/slices/apiSlice';
import useSocket from 'src/hooks/useSocket';
import { useDispatch } from 'react-redux';

// ── helpers ──────────────────────────────────────────────────────────────────
const riskLevel = (total) => {
  if (total === 0) return { label: 'Clear', color: '#30D158', bg: 'rgba(48,209,88,0.12)' };
  if (total < 3)  return { label: 'Low',   color: '#30D158', bg: 'rgba(48,209,88,0.1)' };
  if (total < 6)  return { label: 'Medium',color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)' };
  if (total < 10) return { label: 'High',  color: '#FF6B00', bg: 'rgba(255,107,0,0.15)' };
  return           { label: 'Critical', color: '#FF453A', bg: 'rgba(255,69,58,0.15)' };
};

const totalFor = (v) =>
  (v.noFaceCount || 0) + (v.multipleFaceCount || 0) + (v.cellPhoneCount || 0) +
  (v.prohibitedObjectCount || 0) + (v.tabSwitchViolations || 0) +
  (v.windowBlurViolations || 0) + (v.browserLockdownViolations || 0) +
  (v.gazeViolationCount || 0) + (v.externalDisplayCount || 0) + (v.audioViolationCount || 0);

const VIOL_TYPES = [
  { key: 'noFaceCount',              label: 'No Face',    icon: <IconUserOff size={12} />,       color: '#FF6B00' },
  { key: 'multipleFaceCount',        label: 'Multi-Face', icon: <IconUsers size={12} />,          color: '#FF9F0A' },
  { key: 'cellPhoneCount',           label: 'Phone',      icon: <IconDeviceMobile size={12} />,   color: '#FF453A' },
  { key: 'prohibitedObjectCount',    label: 'Prohibited', icon: <IconShieldX size={12} />,        color: '#FF453A' },
  { key: 'tabSwitchViolations',      label: 'Tab Switch', icon: <IconLayoutColumns size={12} />,  color: '#BF5AF2' },
  { key: 'windowBlurViolations',     label: 'Win Blur',   icon: <IconFocusCentered size={12} />,  color: '#BF5AF2' },
  { key: 'browserLockdownViolations',label: 'Lockdown',   icon: <IconBrowserCheck size={12} />,   color: '#0A84FF' },
  { key: 'gazeViolationCount',       label: 'Eye Gaze',   icon: <IconEye size={12} />,            color: '#30D158' },
  { key: 'externalDisplayCount',     label: 'Ext. Display',icon:<IconDeviceDesktop size={12} />,  color: '#FFD60A' },
  { key: 'audioViolationCount',      label: 'Audio',      icon: <IconMicrophone size={12} />,     color: '#64D2FF' },
];

// ── sub-components ────────────────────────────────────────────────────────────
const StatTile = ({ icon: Icon, value, label, color, loading }) => (
  <Box sx={{
    backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '16px', p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5,
    position: 'relative', overflow: 'hidden',
  }}>
    <Box sx={{ position: 'absolute', top: -8, right: -8, width: 60, height: 60, borderRadius: '50%', background: `${color}14`, pointerEvents: 'none' }} />
    <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={19} color={color} stroke={1.75} />
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.875rem', color: '#FFFFFF', letterSpacing: '-0.05em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
        {loading ? '—' : value}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.4)', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>{label}</Typography>
    </Box>
  </Box>
);

const StudentCard = ({ student, onClick }) => {
  const total = student.totalViolations || 0;
  const risk = riskLevel(total);
  return (
    <Box
      onClick={() => onClick(student)}
      sx={{
        backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '14px', p: 2, cursor: 'pointer', transition: 'all 0.15s ease',
        '&:hover': { border: '0.5px solid rgba(10,132,255,0.35)', transform: 'translateY(-1px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, fontSize: '0.875rem', fontWeight: 700, fontFamily: 'Inter, sans-serif', backgroundColor: '#0A84FF22', color: '#0A84FF', border: '1px solid rgba(10,132,255,0.3)' }}>
          {(student.username || '?').charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {student.username}
          </Typography>
          <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {student.email}
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0, backgroundColor: risk.bg, borderRadius: '20px', px: 1, py: 0.25 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: risk.color, fontFamily: 'Inter, sans-serif' }}>{risk.label}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#30D158', boxShadow: '0 0 6px #30D158', flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {student.examName}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#0A84FF', fontFamily: 'Inter, sans-serif', fontWeight: 600, flexShrink: 0 }}>
          <IconClock size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
          {student.timeRemaining || '—'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {total > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, backgroundColor: 'rgba(255,69,58,0.1)', borderRadius: '6px', px: 0.75, py: 0.25 }}>
            <IconAlertTriangle size={10} color="#FF453A" />
            <Typography sx={{ fontSize: '0.6875rem', color: '#FF453A', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{total} violations</Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif', alignSelf: 'center' }}>
          Active {student.lastActivity ? new Date(student.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </Typography>
      </Box>
    </Box>
  );
};

// ── main component ────────────────────────────────────────────────────────────
const LiveProctoringPage = () => {
  const dispatch = useDispatch();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [lastViolCount, setLastViolCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketStudents, setSocketStudents] = useState(null);
  const [search, setSearch] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [displayAlerts, setDisplayAlerts] = useState([]); // real-time external display alerts
  const [dupSessionAlerts, setDupSessionAlerts] = useState([]); // duplicate session alerts
  const activityRef = useRef(activityLog);
  activityRef.current = activityLog;

  const addActivity = useCallback((msg, type = 'info') => {
    setActivityLog(prev => [{ msg, type, time: new Date() }, ...prev].slice(0, 50));
  }, []);

  const handleDisplayAlert = useCallback((data) => {
    const { username, email, examName, screenCount, screens, timestamp } = data;
    // Add to persistent alert list (max 20)
    setDisplayAlerts(prev => [
      { username, email, examName, screenCount, screens: screens || [], timestamp, id: `${email}-${Date.now()}`, dismissed: false },
      ...prev,
    ].slice(0, 20));
    // Add to activity log
    addActivity(`🖥️ DISPLAY ALERT — ${username} has ${screenCount} screens during "${examName}"`, 'error');
    // Browser push notification
    if (notifEnabled) {
      try { new Notification('⚠️ External Display Detected', { body: `${username} connected ${screenCount} screens during ${examName}`, icon: '/favicon.ico' }); } catch {}
    }
  }, [addActivity, notifEnabled]);

  const handleProctoringUpdate = useCallback((data) => {
    dispatch(apiSlice.util.invalidateTags(['ActiveStudents', 'RecentViolations', 'ProctoringStats']));
    if (data?.username) addActivity(`${data.username} — new violation detected`, 'warning');
  }, [dispatch, addActivity]);

  const handleActiveStudentList = useCallback((students) => {
    setSocketStudents(students);
  }, []);

  const handleDuplicateSession = useCallback((data) => {
    const { email, username, examId, examName, timestamp } = data;
    setDupSessionAlerts(prev => [{
      id: Date.now(), email, username, examId, examName,
      timestamp: timestamp || new Date().toISOString(), dismissed: false,
    }, ...prev].slice(0, 20));
    addActivity(`🔴 DUPLICATE SESSION: ${username || email} opened exam on 2nd device`, 'error');
    if (Notification.permission === 'granted') {
      new Notification('⚠️ Duplicate Session Detected', { body: `${username || email} is on 2 devices — ${examName}` });
    }
  }, [addActivity]);

  useSocket({
    'proctoring:update'          : handleProctoringUpdate,
    'student:active-list'        : handleActiveStudentList,
    'teacher:display-alert'      : handleDisplayAlert,
    'teacher:duplicate-session'  : handleDuplicateSession,
    'connect'    : () => { setSocketConnected(true);  addActivity('Connected to real-time stream', 'success'); },
    'disconnect' : () => { setSocketConnected(false); setSocketStudents(null); addActivity('Disconnected — polling fallback active', 'warning'); },
    'student:join-exam': (data) => { if (data?.username) addActivity(`${data.username} joined exam: ${data.examName}`, 'info'); },
  });

  const { data: apiStudents = [], isLoading: studLoading, refetch: refetchStudents } = useGetActiveStudentsQuery(undefined, { pollingInterval: 60000 });
  const { data: recentViolations = [], isLoading: violLoading, refetch: refetchViol } = useGetRecentViolationsQuery(undefined, { pollingInterval: 60000 });
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetProctoringStatsQuery(undefined, { pollingInterval: 60000 });

  const activeStudents = socketConnected && socketStudents !== null ? socketStudents : apiStudents;
  const filtered = activeStudents.filter(s =>
    search === '' || s.username?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Browser notifications
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') setNotifEnabled(true);
      else if (Notification.permission === 'default') Notification.requestPermission().then(p => setNotifEnabled(p === 'granted'));
    }
  }, []);

  useEffect(() => {
    if (notifEnabled && stats?.recentViolations > lastViolCount && lastViolCount > 0) {
      const n = stats.recentViolations - lastViolCount;
      new Notification('Violation Alert', { body: `${n} new violation${n > 1 ? 's' : ''} in the last 30 minutes`, icon: '/favicon.ico' });
    }
    if (stats) setLastViolCount(stats.recentViolations);
  }, [stats, notifEnabled, lastViolCount]);

  const handleRefresh = () => { refetchStudents(); refetchViol(); refetchStats(); addActivity('Manual refresh triggered', 'info'); };

  // Violation type bar chart from recent violations
  const violTotals = VIOL_TYPES.map(({ key }) => recentViolations.reduce((sum, v) => sum + (v[key] || 0), 0));
  const barChart = {
    series: [{ name: 'Violations', data: violTotals }],
    options: {
      chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, animations: { enabled: true } },
      theme: { mode: 'dark' },
      plotOptions: { bar: { borderRadius: 5, distributed: true, horizontal: false, columnWidth: '55%' } },
      colors: VIOL_TYPES.map(t => t.color),
      dataLabels: { enabled: false },
      xaxis: {
        categories: VIOL_TYPES.map(t => t.label),
        labels: { style: { colors: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', fontSize: '0.625rem' }, rotate: -35 },
        axisBorder: { show: false }, axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' } } },
      grid: { borderColor: 'rgba(255,255,255,0.06)' },
      legend: { show: false },
      tooltip: { theme: 'dark', style: { fontFamily: 'Inter, sans-serif' } },
    },
  };

  return (
    <PageContainer title="Live Proctoring" description="Real-time exam monitoring">
      <Box sx={{ pb: 4 }}>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
                Live Proctoring
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: 'rgba(48,209,88,0.12)', borderRadius: '20px', px: 1.25, py: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#30D158', boxShadow: '0 0 8px #30D158', animation: 'pulse 1.5s infinite' }} />
                <Typography sx={{ fontSize: '0.75rem', color: '#30D158', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>LIVE</Typography>
              </Box>
              <Box sx={{ backgroundColor: socketConnected ? 'rgba(48,209,88,0.1)' : 'rgba(255,159,10,0.1)', borderRadius: '20px', px: 1.25, py: 0.5 }}>
                <Typography sx={{ fontSize: '0.6875rem', color: socketConnected ? '#30D158' : '#FF9F0A', fontFamily: 'Inter, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {socketConnected ? <IconCellSignal4 size={11} /> : <IconCellSignalOff size={11} />}
                  {socketConnected ? 'Real-time' : 'Polling'}
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' }}>
              Monitor active students and detect violations in real time
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title={notifEnabled ? 'Notifications on' : 'Enable browser notifications'}>
              <IconButton onClick={() => Notification.requestPermission().then(p => setNotifEnabled(p === 'granted'))}
                sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: notifEnabled ? 'rgba(48,209,88,0.12)' : 'rgba(255,255,255,0.06)', color: notifEnabled ? '#30D158' : 'rgba(235,235,245,0.5)', '&:hover': { backgroundColor: notifEnabled ? 'rgba(48,209,88,0.2)' : 'rgba(255,255,255,0.1)' } }}>
                {notifEnabled ? <IconBell size={17} /> : <IconBellOff size={17} />}
              </IconButton>
            </Tooltip>
            <Button onClick={handleRefresh} startIcon={<IconRefresh size={15} />} variant="outlined" size="small"
              sx={{ borderRadius: '10px', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(235,235,245,0.7)', fontFamily: 'Inter, sans-serif', textTransform: 'none', fontSize: '0.8125rem', '&:hover': { borderColor: '#0A84FF', color: '#0A84FF', backgroundColor: 'rgba(10,132,255,0.08)' } }}>
              Refresh
            </Button>
          </Stack>
        </Box>

        {/* ── Stat Tiles ── */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}><StatTile icon={IconActivity}  value={stats?.activeExams || 0}        label="Active Exams"      color="#0A84FF" loading={statsLoading} /></Grid>
          <Grid item xs={6} sm={3}><StatTile icon={IconUsers}     value={activeStudents.length}          label="Active Students"   color="#30D158" loading={studLoading} /></Grid>
          <Grid item xs={6} sm={3}><StatTile icon={IconAlertTriangle} value={stats?.recentViolations || 0} label="Violations (30m)" color="#FF9F0A" loading={statsLoading} /></Grid>
          <Grid item xs={6} sm={3}><StatTile icon={IconShieldX}   value={stats?.todayViolations?.total || 0} label="Total Today"   color="#FF453A" loading={statsLoading} /></Grid>
        </Grid>

        {/* ── Duplicate Session Alert Banner ── */}
        {dupSessionAlerts.filter(a => !a.dismissed).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ width: 26, height: 26, borderRadius: '7px', backgroundColor: 'rgba(255,69,58,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconDeviceMobile size={13} color="#FF453A" />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#FF453A', fontFamily: 'Inter, sans-serif' }}>
                Duplicate Session Alerts ({dupSessionAlerts.filter(a => !a.dismissed).length})
              </Typography>
              <Button size="small" onClick={() => setDupSessionAlerts(prev => prev.map(a => ({ ...a, dismissed: true })))}
                sx={{ ml: 'auto', color: 'rgba(235,235,245,0.4)', fontSize: '0.75rem', fontFamily: 'Inter,sans-serif', textTransform: 'none', borderRadius: '8px', '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>
                Dismiss all
              </Button>
            </Box>
            <Stack spacing={1}>
              {dupSessionAlerts.filter(a => !a.dismissed).map(alert => (
                <Box key={alert.id} sx={{ backgroundColor: 'rgba(255,69,58,0.08)', border: '0.5px solid rgba(255,69,58,0.35)', borderRadius: '12px', p: 1.75, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: 'rgba(255,69,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconDeviceMobile size={16} color="#FF453A" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFFFFF', fontFamily: 'Inter,sans-serif' }}>
                        {alert.username || alert.email}
                      </Typography>
                      <Box sx={{ backgroundColor: 'rgba(255,69,58,0.2)', borderRadius: '980px', px: 1, py: 0.25 }}>
                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: '#FF453A', fontFamily: 'Inter,sans-serif', letterSpacing: '0.05em' }}>2 DEVICES</Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter,sans-serif' }}>
                      {alert.email} · {alert.examName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif', mt: 0.25 }}>
                      Opened exam from a second device — potential screen sharing
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif' }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </Typography>
                    <IconButton size="small" onClick={() => setDupSessionAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a))}
                      sx={{ color: 'rgba(235,235,245,0.3)', width: 22, height: 22, '&:hover': { color: '#FF453A', backgroundColor: 'rgba(255,69,58,0.1)' } }}>
                      <IconX size={13} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ── External Display Alert Banner ── */}
        {displayAlerts.filter(a => !a.dismissed).length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
              <Box sx={{ width: 26, height: 26, borderRadius: '7px', backgroundColor: 'rgba(255,69,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconDeviceDesktop size={13} color="#FF453A" />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#FF453A', fontFamily: 'Inter, sans-serif' }}>
                External Display Alerts ({displayAlerts.filter(a => !a.dismissed).length})
              </Typography>
              <Button size="small" onClick={() => setDisplayAlerts(prev => prev.map(a => ({ ...a, dismissed: true })))}
                sx={{ ml: 'auto', color: 'rgba(235,235,245,0.4)', fontSize: '0.75rem', fontFamily: 'Inter,sans-serif', textTransform: 'none', borderRadius: '8px', '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>
                Dismiss all
              </Button>
            </Box>
            <Stack spacing={1}>
              {displayAlerts.filter(a => !a.dismissed).map((alert) => (
                <Box key={alert.id} sx={{
                  backgroundColor: 'rgba(255,69,58,0.08)', border: '0.5px solid rgba(255,69,58,0.35)',
                  borderRadius: '12px', p: 1.75, display: 'flex', alignItems: 'center', gap: 2,
                  animation: 'slideIn 0.2s ease',
                }}>
                  {/* Pulsing icon */}
                  <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'rgba(255,69,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconDeviceDesktop size={18} color="#FF453A" />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
                        {alert.username}
                      </Typography>
                      <Box sx={{ backgroundColor: 'rgba(255,69,58,0.2)', borderRadius: '20px', px: 1, py: 0.2 }}>
                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: '#FF453A', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
                          {alert.screenCount} SCREENS DETECTED
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', mt: 0.25 }}>
                      {alert.email} · Exam: <strong style={{ color: 'rgba(235,235,245,0.75)' }}>{alert.examName}</strong>
                    </Typography>
                    {/* Screen labels with connection types */}
                    {alert.screens && alert.screens.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
                        {alert.screens.map((s, i) => {
                          const Icon = s.connectionType === 'Wireless' ? IconWifi
                            : s.connectionType === 'Bluetooth' ? IconBluetooth
                            : s.connectionType === 'USB-C' ? IconUsb
                            : IconDeviceDesktop;
                          return (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '6px', px: 0.75, py: 0.25 }}>
                              <Icon size={10} color={s.isPrimary ? 'rgba(235,235,245,0.5)' : '#FF453A'} />
                              <Typography sx={{ fontSize: '0.625rem', color: s.isPrimary ? 'rgba(235,235,245,0.5)' : '#FF453A', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                                {s.isPrimary ? 'Primary' : s.connectionType}
                                {s.width ? ` ${s.width}×${s.height}` : ''}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Typography>
                    <IconButton size="small" onClick={() => setDisplayAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dismissed: true } : a))}
                      sx={{ mt: 0.5, color: 'rgba(235,235,245,0.3)', '&:hover': { color: '#FF453A', backgroundColor: 'rgba(255,69,58,0.1)' } }}>
                      <IconX size={14} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ── Main grid ── */}
        <Grid container spacing={2.5}>
          {/* Active Students */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconUsers size={17} color="#0A84FF" />
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Active Students</Typography>
                  <Box sx={{ backgroundColor: 'rgba(10,132,255,0.12)', borderRadius: '20px', px: 1, py: 0.25 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#0A84FF', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{activeStudents.length}</Typography>
                  </Box>
                </Box>
                <TextField
                  placeholder="Search student…" size="small" value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><IconSearch size={14} color="rgba(235,235,245,0.4)" /></InputAdornment>,
                    sx: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.1) !important' }, '& input': { color: '#FFFFFF', py: 0.75 } },
                  }}
                  sx={{ width: 220 }}
                />
              </Box>
              {studLoading ? (
                <LinearProgress sx={{ borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { backgroundColor: '#0A84FF' } }} />
              ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <IconUsers size={36} color="rgba(235,235,245,0.15)" />
                  <Typography sx={{ mt: 1.5, color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
                    {activeStudents.length === 0 ? 'No students are currently taking exams' : 'No students match search'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  {filtered.map((s, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <StudentCard student={s} onClick={setSelectedStudent} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Grid>

          {/* Activity Log + Violation Chart */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={2.5}>
              {/* Violation breakdown chart */}
              <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <IconShieldX size={16} color="#FF453A" />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Violations by Type (30m)</Typography>
                </Box>
                {violLoading ? (
                  <LinearProgress sx={{ borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { backgroundColor: '#FF453A' } }} />
                ) : (
                  <ReactApexChart options={barChart.options} series={barChart.series} type="bar" height={180} />
                )}
              </Box>

              {/* Activity log */}
              <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <IconActivity size={16} color="#0A84FF" />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Activity Log</Typography>
                </Box>
                <Box sx={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {activityLog.length === 0 ? (
                    <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif', textAlign: 'center', py: 2 }}>
                      No activity yet — connect to stream
                    </Typography>
                  ) : (
                    activityLog.map((a, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: a.type === 'success' ? '#30D158' : a.type === 'warning' ? '#FF9F0A' : '#0A84FF', mt: 0.6, flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.7)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>{a.msg}</Typography>
                          <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif' }}>
                            {a.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Stack>
          </Grid>

          {/* Recent Violations Table */}
          <Grid item xs={12}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconAlertTriangle size={17} color="#FF9F0A" />
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Recent Violations</Typography>
                <Box sx={{ backgroundColor: 'rgba(255,159,10,0.12)', borderRadius: '20px', px: 1, py: 0.25 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#FF9F0A', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Last 30 min</Typography>
                </Box>
              </Box>
              {violLoading ? (
                <LinearProgress sx={{ borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { backgroundColor: '#FF9F0A' } }} />
              ) : recentViolations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <IconShieldCheck size={36} color="#30D158" />
                  <Typography sx={{ mt: 1.5, color: '#30D158', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600 }}>
                    All clear — no violations in the last 30 minutes
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Student', 'Exam', ...VIOL_TYPES.map(t => t.label), 'Total', 'Last Seen'].map(h => (
                          <TableCell key={h} sx={{ color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '0.5px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap', py: 1, px: 1.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentViolations.map((v, i) => {
                        const tot = totalFor(v);
                        const risk = riskLevel(tot);
                        return (
                          <TableRow key={i} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' }, '& td': { borderBottom: '0.5px solid rgba(255,255,255,0.05)' } }}>
                            <TableCell sx={{ py: 1, px: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.625rem', fontWeight: 700, backgroundColor: '#0A84FF22', color: '#0A84FF' }}>
                                  {(v.username || '?').charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: '0.8125rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>{v.username}</Typography>
                                  <Typography sx={{ fontSize: '0.625rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>{v.email}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 1, px: 1.5 }}><Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>{v.examName || '—'}</Typography></TableCell>
                            {VIOL_TYPES.map(({ key, color }) => {
                              const cnt = v[key] || 0;
                              return (
                                <TableCell key={key} align="center" sx={{ py: 1, px: 1 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: cnt > 0 ? color : 'rgba(235,235,245,0.2)', fontFamily: 'Inter, sans-serif' }}>{cnt}</Typography>
                                </TableCell>
                              );
                            })}
                            <TableCell align="center" sx={{ py: 1, px: 1.5 }}>
                              <Box sx={{ display: 'inline-block', backgroundColor: risk.bg, borderRadius: '8px', px: 1, py: 0.25 }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: risk.color, fontFamily: 'Inter, sans-serif' }}>{tot}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 1, px: 1.5 }}>
                              <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                                {v.lastViolation ? new Date(v.lastViolation).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Student Detail Modal ── */}
      <Dialog
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        sx={{ '& .MuiDialog-paper': { backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '18px', minWidth: 340, maxWidth: 500 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 3, pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Student Details</Typography>
          <IconButton onClick={() => setSelectedStudent(null)} sx={{ color: 'rgba(235,235,245,0.5)', '&:hover': { color: '#FFFFFF' } }}><IconX size={18} /></IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 52, height: 52, fontSize: '1.25rem', fontWeight: 700, backgroundColor: '#0A84FF22', color: '#0A84FF', border: '1.5px solid rgba(10,132,255,0.4)' }}>
                  {selectedStudent.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>{selectedStudent.username}</Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.45)', fontFamily: 'Inter, sans-serif' }}>{selectedStudent.email}</Typography>
                </Box>
              </Box>
              {[
                ['Current Exam', selectedStudent.examName],
                ['Time Remaining', selectedStudent.timeRemaining || '—'],
                ['Last Activity', selectedStudent.lastActivity ? new Date(selectedStudent.lastActivity).toLocaleTimeString() : '—'],
                ['Exam ID', selectedStudent.examId],
              ].map(([label, val]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{val}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, pt: 1 }}>
                <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' }}>Status</Typography>
                <Box sx={{ backgroundColor: 'rgba(48,209,88,0.12)', borderRadius: '20px', px: 1.25, py: 0.4, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#30D158', boxShadow: '0 0 6px #30D158' }} />
                  <Typography sx={{ fontSize: '0.75rem', color: '#30D158', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Active</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSelectedStudent(null)} sx={{ color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', textTransform: 'none', borderRadius: '10px', '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </PageContainer>
  );
};

export default LiveProctoringPage;
