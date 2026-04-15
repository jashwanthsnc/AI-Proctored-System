import React from 'react';
import { Box, Grid, Typography, Button, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Avatar } from '@mui/material';
import { IconPlus, IconClipboardList, IconArrowRight, IconUsers, IconChartBar, IconCalendarEvent, IconShieldCheck, IconBolt, IconTrendingUp, IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import PageContainer from 'src/components/container/PageContainer';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { useGetStudentsQuery } from 'src/slices/usersApiSlice';
import { useSelector } from 'react-redux';
import _ from 'lodash';

const StatCard = ({ icon: Icon, value, label, accent, sub }) => (
  <Box sx={{
    backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px',
    p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative', overflow: 'hidden',
    transition: 'transform 0.15s ease, border-color 0.15s ease',
    '&:hover': { transform: 'translateY(-2px)', borderColor: `${accent}50` },
  }}>
    <Box sx={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, borderRadius: '50%', background: `${accent}12`, pointerEvents: 'none' }} />
    <Box sx={{ width: 40, height: 40, borderRadius: '11px', backgroundColor: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} color={accent} stroke={1.75} />
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: '#FFFFFF', letterSpacing: '-0.06em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.45)', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>{label}</Typography>
      {sub && <Typography sx={{ fontSize: '0.6875rem', color: accent, mt: 0.25, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{sub}</Typography>}
    </Box>
  </Box>
);

const QuickAction = ({ icon: Icon, label, description, onClick, primary }) => (
  <Box onClick={onClick} sx={{
    backgroundColor: primary ? '#0A84FF' : '#1C1C1E', border: primary ? 'none' : '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '14px', p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
    transition: 'all 0.15s ease',
    '&:hover': { backgroundColor: primary ? '#409CFF' : '#2C2C2E', transform: 'translateY(-1px)' },
    '&:active': { transform: 'scale(0.98)' },
  }}>
    <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: primary ? 'rgba(255,255,255,0.15)' : 'rgba(10,132,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} color={primary ? '#FFFFFF' : '#0A84FF'} stroke={1.75} />
    </Box>
    <Box>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.75rem', color: primary ? 'rgba(255,255,255,0.55)' : 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', mt: 0.25 }}>{description}</Typography>
    </Box>
  </Box>
);

const getStatus = (exam) => {
  const now = new Date();
  if (now < new Date(exam.liveDate)) return { label: 'Upcoming', color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)' };
  if (now > new Date(exam.deadDate)) return { label: 'Ended', color: 'rgba(235,235,245,0.3)', bg: 'rgba(255,255,255,0.06)' };
  return { label: 'Live', color: '#30D158', bg: 'rgba(48,209,88,0.12)' };
};

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery();
  const { data: studentsData, isLoading: studentsLoading } = useGetStudentsQuery();

  const exams = examsData || [];
  const students = studentsData?.data || [];

  const live = exams.filter((e) => getStatus(e).label === 'Live');
  const upcoming = exams.filter((e) => getStatus(e).label === 'Upcoming');
  const ended = exams.filter((e) => getStatus(e).label === 'Ended');
  const recentExams = [...exams].sort((a, b) => new Date(b.liveDate) - new Date(a.liveDate)).slice(0, 5);
  const topExams = [...exams].sort((a, b) => (b.eligibleStudents?.length || 0) - (a.eligibleStudents?.length || 0)).slice(0, 6);

  const donutOptions = {
    chart: { background: 'transparent', toolbar: { show: false }, type: 'donut' },
    labels: ['Live', 'Upcoming', 'Ended'],
    colors: ['#30D158', '#FF9F0A', 'rgba(255,255,255,0.12)'],
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Exams', color: 'rgba(235,235,245,0.4)', fontSize: '12px', fontFamily: 'Inter,sans-serif', formatter: () => exams.length } } } } },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: { labels: { colors: 'rgba(235,235,245,0.5)' }, fontFamily: 'Inter, sans-serif', fontSize: '12px' },
    tooltip: { theme: 'dark' },
  };

  const barOptions = {
    chart: { background: 'transparent', toolbar: { show: false }, type: 'bar' },
    plotOptions: { bar: { borderRadius: 7, columnWidth: '52%', distributed: true } },
    colors: ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF453A', '#64D2FF'],
    xaxis: {
      categories: topExams.map((e) => e.examName?.length > 14 ? e.examName.slice(0, 14) + '…' : (e.examName || 'Exam')),
      labels: { style: { colors: Array(6).fill('rgba(235,235,245,0.35)'), fontFamily: 'Inter,sans-serif', fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: ['rgba(235,235,245,0.35)'], fontFamily: 'Inter,sans-serif', fontSize: '11px' } } },
    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { theme: 'dark' },
  };

  if (examsLoading || studentsLoading) {
    return (
      <PageContainer title="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#0A84FF' }} />
        </Box>
      </PageContainer>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <PageContainer title="Dashboard">
      <Box sx={{ pb: 5 }}>

        {/* ── Header ── */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0A84FF 0%,#BF5AF2 100%)', fontWeight: 700, fontSize: '1.125rem', fontFamily: 'Inter,sans-serif' }}>
              {userInfo?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.625rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter,sans-serif', lineHeight: 1 }}>
                {greeting}, {_.startCase(userInfo?.name?.split(' ')[0])} 👋
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter,sans-serif', mt: 0.25 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          <Button onClick={() => navigate('/create-exam')} startIcon={<IconPlus size={15} />} variant="contained"
            sx={{ borderRadius: '980px', backgroundColor: '#0A84FF', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.875rem', px: 2.5, py: 1, textTransform: 'none', boxShadow: '0 4px 18px rgba(10,132,255,0.4)', '&:hover': { backgroundColor: '#409CFF' } }}>
            New Exam
          </Button>
        </Box>

        {/* ── Stats ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { icon: IconClipboardList, value: exams.length, label: 'Total Exams', accent: '#0A84FF', sub: 'All time' },
            { icon: IconShieldCheck, value: live.length, label: 'Live Now', accent: '#30D158', sub: 'Active proctoring' },
            { icon: IconCalendarEvent, value: upcoming.length, label: 'Upcoming', accent: '#FF9F0A', sub: 'Scheduled' },
            { icon: IconUsers, value: students.length, label: 'Students', accent: '#BF5AF2', sub: 'Enrolled' },
            { icon: IconBolt, value: exams.reduce((s, e) => s + (e.eligibleStudents?.length || 0), 0), label: 'Assignments', accent: '#FF453A', sub: 'Total assigned' },
            { icon: IconTrendingUp, value: ended.length, label: 'Completed', accent: '#64D2FF', sub: 'Exams done' },
          ].map((s, i) => <Grid item xs={6} sm={4} lg={2} key={i}><StatCard {...s} /></Grid>)}
        </Grid>

        {/* ── Charts ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5, height: '100%' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter,sans-serif', mb: 0.25 }}>Exam Status</Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif', mb: 1.5 }}>Live · Upcoming · Ended</Typography>
              {exams.length > 0
                ? <ReactApexChart options={donutOptions} series={[live.length || 0, upcoming.length || 0, ended.length || 0]} type="donut" height={230} />
                : <Box sx={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ color: 'rgba(235,235,245,0.2)', fontFamily: 'Inter,sans-serif' }}>No exams yet</Typography></Box>}
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5, height: '100%' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter,sans-serif', mb: 0.25 }}>Students per Exam</Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif', mb: 1.5 }}>Top exams by enrollment</Typography>
              {topExams.length > 0
                ? <ReactApexChart options={barOptions} series={[{ name: 'Students', data: topExams.map((e) => e.eligibleStudents?.length || 0) }]} type="bar" height={230} />
                : <Box sx={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ color: 'rgba(235,235,245,0.2)', fontFamily: 'Inter,sans-serif' }}>No data yet</Typography></Box>}
            </Box>
          </Grid>
        </Grid>

        {/* ── Quick Actions ── */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(235,235,245,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, fontFamily: 'Inter,sans-serif' }}>Quick Actions</Typography>
          <Grid container spacing={1.5}>
            {[
              { icon: IconPlus, label: 'Create Exam', description: 'Set up a new proctored exam', onClick: () => navigate('/create-exam'), primary: true },
              { icon: IconClipboardList, label: 'Question Bank', description: 'Add & manage questions', onClick: () => navigate('/add-questions') },
              { icon: IconChartBar, label: 'All Exams', description: 'View & edit all exams', onClick: () => navigate('/all-exams') },
              { icon: IconShieldCheck, label: 'Live Proctoring', description: 'Monitor active students', onClick: () => navigate('/live-proctoring') },
              { icon: IconAlertTriangle, label: 'Violation Logs', description: 'Review AI proctoring logs', onClick: () => navigate('/exam-log') },
              { icon: IconUsers, label: 'Students', description: 'Manage student access', onClick: () => navigate('/students') },
              { icon: IconTrendingUp, label: 'Results', description: 'View exam scores', onClick: () => navigate('/result') },
              { icon: IconBolt, label: 'Analytics', description: 'Insights & reports', onClick: () => navigate('/analytics') },
            ].map((a, i) => <Grid item xs={12} sm={6} md={3} key={i}><QuickAction {...a} /></Grid>)}
          </Grid>
        </Box>

        {/* ── Recent Exams ── */}
        <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 2, borderBottom: '0.5px solid rgba(84,84,88,0.4)' }}>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter,sans-serif' }}>Recent Exams</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif', mt: 0.2 }}>Latest {recentExams.length} exams</Typography>
            </Box>
            <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/all-exams')}
              sx={{ color: '#0A84FF', fontSize: '0.8125rem', fontWeight: 500, px: 1.5, py: 0.5, borderRadius: '8px', fontFamily: 'Inter,sans-serif', textTransform: 'none', '&:hover': { backgroundColor: 'rgba(10,132,255,0.08)' } }}>
              View all
            </Button>
          </Box>

          {recentExams.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '14px', backgroundColor: 'rgba(10,132,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IconClipboardList size={24} color="#0A84FF" />
              </Box>
              <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif', fontSize: '0.9375rem' }}>No exams yet</Typography>
              <Button onClick={() => navigate('/create-exam')} sx={{ mt: 1.5, color: '#0A84FF', fontFamily: 'Inter,sans-serif', textTransform: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Create your first exam →</Button>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(84,84,88,0.25)', py: 1.25, px: 2.5, fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(235,235,245,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif', backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell>Exam</TableCell>
                  <TableCell align="center">Qs</TableCell>
                  <TableCell align="center">Duration</TableCell>
                  <TableCell align="center">Pass %</TableCell>
                  <TableCell>Live Date</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Students</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentExams.map((exam) => {
                  const st = getStatus(exam);
                  return (
                    <TableRow key={exam.examId} sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(84,84,88,0.15)', py: 1.5, px: 2.5 }, '&:hover': { backgroundColor: 'rgba(255,255,255,0.015)' }, '&:last-child .MuiTableCell-root': { borderBottom: 'none' } }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFFFFF', fontFamily: 'Inter,sans-serif', letterSpacing: '-0.01em' }}>{exam.examName}</Typography>
                        {exam.description && <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif', mt: 0.2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.description}</Typography>}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'inline-flex', backgroundColor: 'rgba(10,132,255,0.1)', borderRadius: '6px', px: 1, py: 0.2 }}>
                          <Typography sx={{ fontSize: '0.8125rem', color: '#0A84FF', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>{exam.totalQuestions}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center"><Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.45)', fontFamily: 'Inter,sans-serif' }}>{exam.duration}m</Typography></TableCell>
                      <TableCell align="center"><Typography sx={{ fontSize: '0.8125rem', color: '#FF9F0A', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>{exam.passingScore || 60}%</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter,sans-serif' }}>{fmt(exam.liveDate)}</Typography></TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, backgroundColor: st.bg, borderRadius: '20px', px: 1.25, py: 0.35 }}>
                          {st.label === 'Live' && <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#30D158', boxShadow: '0 0 5px #30D158' }} />}
                          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: st.color, fontFamily: 'Inter,sans-serif', letterSpacing: '0.02em' }}>{st.label}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center"><Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.45)', fontFamily: 'Inter,sans-serif' }}>{exam.eligibleStudents?.length || 0}</Typography></TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Box onClick={() => navigate(`/edit-exam/${exam.examId}`)} sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: 'rgba(10,132,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(10,132,255,0.2)' } }}>
                            <IconChartBar size={13} color="#0A84FF" />
                          </Box>
                          <Box onClick={() => navigate('/exam-log')} sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: 'rgba(255,159,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,159,10,0.2)' } }}>
                            <IconAlertTriangle size={13} color="#FF9F0A" />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
};

export default TeacherDashboard;
