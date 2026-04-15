import React, { useMemo } from 'react';
import { Box, Grid, Typography, Stack, LinearProgress, CircularProgress } from '@mui/material';
import {
  IconChartBar, IconUsers, IconClipboardList, IconShieldCheck,
  IconTrendingUp, IconAward, IconAlertTriangle, IconEye,
  IconDeviceMobile, IconUserOff, IconLayoutColumns, IconMicrophone,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import ReactApexChart from 'react-apexcharts';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { useGetStudentsQuery } from 'src/slices/usersApiSlice';
import { useGetProctoringStatsQuery, useGetAllCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';

// ── helpers ──────────────────────────────────────────────────────────────────
const examStatus = (exam) => {
  const now = new Date();
  if (now < new Date(exam.liveDate)) return 'upcoming';
  if (now > new Date(exam.deadDate)) return 'ended';
  return 'live';
};

const StatCard = ({ icon: Icon, value, label, color, sub, loading }) => (
  <Box sx={{
    backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px',
    p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative', overflow: 'hidden',
    transition: 'transform 0.15s ease, border-color 0.15s ease',
    '&:hover': { transform: 'translateY(-2px)', borderColor: `${color}40` },
  }}>
    <Box sx={{ position: 'absolute', top: -10, right: -10, width: 70, height: 70, borderRadius: '50%', background: `${color}12`, pointerEvents: 'none' }} />
    <Box sx={{ width: 40, height: 40, borderRadius: '11px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} color={color} stroke={1.75} />
    </Box>
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', height: 38 }}><CircularProgress size={20} sx={{ color }} /></Box>
      ) : (
        <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: '#FFFFFF', letterSpacing: '-0.06em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{value}</Typography>
      )}
      <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.45)', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>{label}</Typography>
      {sub && <Typography sx={{ fontSize: '0.6875rem', color, mt: 0.25, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{sub}</Typography>}
    </Box>
  </Box>
);

const SectionHeader = ({ icon: Icon, title, color = '#0A84FF' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
    <Box sx={{ width: 30, height: 30, borderRadius: '8px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={16} color={color} stroke={1.75} />
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>{title}</Typography>
  </Box>
);

// ── main ──────────────────────────────────────────────────────────────────────
const TeacherAnalyticsPage = () => {
  const { data: exams = [], isLoading: examsLoading } = useGetExamsQuery();
  const { data: students = [], isLoading: studentsLoading } = useGetStudentsQuery();
  const { data: stats, isLoading: statsLoading } = useGetProctoringStatsQuery();
  const { data: allLogs = [], isLoading: logsLoading } = useGetAllCheatingLogsQuery();

  // ── compute stats ──────────────────────────────────────────────────────────
  const liveCount     = useMemo(() => exams.filter(e => examStatus(e) === 'live').length, [exams]);
  const upcomingCount = useMemo(() => exams.filter(e => examStatus(e) === 'upcoming').length, [exams]);
  const endedCount    = useMemo(() => exams.filter(e => examStatus(e) === 'ended').length, [exams]);

  const totalViolations = useMemo(() =>
    allLogs.reduce((sum, l) =>
      sum + (l.noFaceCount || 0) + (l.multipleFaceCount || 0) + (l.cellPhoneCount || 0) +
      (l.prohibitedObjectCount || 0) + (l.tabSwitchViolations || 0) + (l.windowBlurViolations || 0) +
      (l.browserLockdownViolations || 0) + (l.gazeViolationCount || 0) + (l.externalDisplayCount || 0) +
      (l.audioViolationCount || 0), 0),
  [allLogs]);

  const highRisk = useMemo(() =>
    allLogs.filter(l => {
      const t = (l.noFaceCount||0)+(l.multipleFaceCount||0)+(l.cellPhoneCount||0)+
        (l.prohibitedObjectCount||0)+(l.tabSwitchViolations||0)+(l.windowBlurViolations||0)+
        (l.browserLockdownViolations||0)+(l.gazeViolationCount||0)+(l.externalDisplayCount||0)+
        (l.audioViolationCount||0);
      return t >= 5;
    }).length,
  [allLogs]);

  // Per-violation type totals
  const violByType = useMemo(() => ({
    noFace:          allLogs.reduce((s, l) => s + (l.noFaceCount || 0), 0),
    multiFace:       allLogs.reduce((s, l) => s + (l.multipleFaceCount || 0), 0),
    phone:           allLogs.reduce((s, l) => s + (l.cellPhoneCount || 0), 0),
    prohibited:      allLogs.reduce((s, l) => s + (l.prohibitedObjectCount || 0), 0),
    tabSwitch:       allLogs.reduce((s, l) => s + (l.tabSwitchViolations || 0), 0),
    windowBlur:      allLogs.reduce((s, l) => s + (l.windowBlurViolations || 0), 0),
    lockdown:        allLogs.reduce((s, l) => s + (l.browserLockdownViolations || 0), 0),
    gaze:            allLogs.reduce((s, l) => s + (l.gazeViolationCount || 0), 0),
    extDisplay:      allLogs.reduce((s, l) => s + (l.externalDisplayCount || 0), 0),
    audio:           allLogs.reduce((s, l) => s + (l.audioViolationCount || 0), 0),
  }), [allLogs]);

  // Exam status donut chart
  const donutChart = {
    series: [liveCount, upcomingCount, endedCount],
    options: {
      chart: { type: 'donut', background: 'transparent' },
      theme: { mode: 'dark' },
      labels: ['Live', 'Upcoming', 'Ended'],
      colors: ['#30D158', '#FF9F0A', 'rgba(235,235,245,0.25)'],
      dataLabels: { enabled: false },
      legend: { position: 'bottom', fontFamily: 'Inter, sans-serif', fontSize: '13px', labels: { colors: ['#FFFFFF'] } },
      plotOptions: { pie: { donut: { size: '72%', labels: { show: true, total: { show: true, label: 'Total', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', formatter: () => exams.length } } } } },
      stroke: { colors: ['#1C1C1E'] },
      tooltip: { theme: 'dark', style: { fontFamily: 'Inter, sans-serif' } },
    },
  };

  // Violation type breakdown horizontal bar
  const violTypes = [
    { label: 'Eye Gaze',    val: violByType.gaze,     color: '#30D158' },
    { label: 'Tab Switch',  val: violByType.tabSwitch, color: '#BF5AF2' },
    { label: 'Win Blur',    val: violByType.windowBlur,color: '#BF5AF2' },
    { label: 'No Face',     val: violByType.noFace,    color: '#FF6B00' },
    { label: 'Multi-Face',  val: violByType.multiFace, color: '#FF9F0A' },
    { label: 'Phone',       val: violByType.phone,     color: '#FF453A' },
    { label: 'Prohibited',  val: violByType.prohibited,color: '#FF453A' },
    { label: 'Lockdown',    val: violByType.lockdown,  color: '#0A84FF' },
    { label: 'Ext. Display',val: violByType.extDisplay,color: '#FFD60A' },
    { label: 'Audio',       val: violByType.audio,     color: '#64D2FF' },
  ].sort((a, b) => b.val - a.val);

  const maxViol = Math.max(...violTypes.map(v => v.val), 1);

  // Monthly exam creation timeline (from exam liveDate)
  const monthlyExams = useMemo(() => {
    const counts = {};
    exams.forEach(e => {
      const m = new Date(e.liveDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      counts[m] = (counts[m] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => new Date('1 ' + a[0]) - new Date('1 ' + b[0]));
    return { cats: sorted.map(([k]) => k), vals: sorted.map(([, v]) => v) };
  }, [exams]);

  const areaChart = {
    series: [{ name: 'Exams', data: monthlyExams.vals }],
    options: {
      chart: { type: 'area', background: 'transparent', toolbar: { show: false }, sparkline: { enabled: false } },
      theme: { mode: 'dark' },
      stroke: { curve: 'smooth', width: 2, colors: ['#0A84FF'] },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100], colorStops: [{ offset: 0, color: '#0A84FF', opacity: 0.35 }, { offset: 100, color: '#0A84FF', opacity: 0.0 }] } },
      xaxis: { categories: monthlyExams.cats, labels: { style: { colors: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' } }, min: 0 },
      grid: { borderColor: 'rgba(255,255,255,0.06)' },
      dataLabels: { enabled: false },
      markers: { size: 4, colors: ['#0A84FF'], strokeColors: '#000', strokeWidth: 2, hover: { size: 6 } },
      tooltip: { theme: 'dark', style: { fontFamily: 'Inter, sans-serif' } },
    },
  };

  // Students per exam bar chart (top 8)
  const perExam = useMemo(() => {
    const top = exams
      .filter(e => e.eligibleStudents?.length > 0)
      .map(e => ({ name: e.examName.length > 18 ? e.examName.slice(0, 18) + '…' : e.examName, count: e.eligibleStudents?.length || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    return { names: top.map(t => t.name), counts: top.map(t => t.count) };
  }, [exams]);

  const studentsBarChart = {
    series: [{ name: 'Students', data: perExam.counts }],
    options: {
      chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
      theme: { mode: 'dark' },
      plotOptions: { bar: { borderRadius: 5, horizontal: true, barHeight: '60%' } },
      colors: ['#0A84FF'],
      dataLabels: { enabled: true, style: { fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', colors: ['#FFFFFF'] } },
      xaxis: { categories: perExam.names, labels: { style: { colors: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: 'rgba(235,235,245,0.55)', fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem' } } },
      grid: { borderColor: 'rgba(255,255,255,0.06)' },
      tooltip: { theme: 'dark', style: { fontFamily: 'Inter, sans-serif' } },
    },
  };

  return (
    <PageContainer title="Analytics" description="Teacher analytics dashboard">
      <Box sx={{ pb: 4 }}>
        {/* ── Header ── */}
        <Box sx={{ mb: 3.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
            Analytics
          </Typography>
          <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.45)', mt: 0.75, fontFamily: 'Inter, sans-serif' }}>
            Comprehensive overview of exams, students, and proctoring data
          </Typography>
        </Box>

        {/* ── Stat Cards ── */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={4} md={2}><StatCard icon={IconClipboardList} value={exams.length}    label="Total Exams"     color="#0A84FF" loading={examsLoading} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard icon={IconEye}           value={liveCount}       label="Live Now"        color="#30D158" loading={examsLoading} sub={liveCount > 0 ? `${liveCount} active` : undefined} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard icon={IconClipboardList} value={upcomingCount}   label="Upcoming"        color="#FF9F0A" loading={examsLoading} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard icon={IconUsers}         value={students.length} label="Total Students"  color="#BF5AF2" loading={studentsLoading} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard icon={IconAlertTriangle} value={totalViolations} label="Total Violations" color="#FF453A" loading={logsLoading} /></Grid>
          <Grid item xs={6} sm={4} md={2}><StatCard icon={IconShieldCheck}   value={highRisk}        label="High-Risk Students" color="#FF6B00" loading={logsLoading} sub={allLogs.length > 0 ? `of ${allLogs.length} monitored` : undefined} /></Grid>
        </Grid>

        {/* ── Row 2: Donut + Area + Violation Breakdown ── */}
        <Grid container spacing={2.5} mb={2.5}>
          {/* Exam Status Donut */}
          <Grid item xs={12} md={4}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5, height: '100%' }}>
              <SectionHeader icon={IconClipboardList} title="Exam Status Distribution" />
              {examsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}><CircularProgress sx={{ color: '#0A84FF' }} /></Box>
              ) : exams.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif' }}>No exams yet</Typography>
                </Box>
              ) : (
                <ReactApexChart options={donutChart.options} series={donutChart.series} type="donut" height={220} />
              )}
              <Grid container spacing={1.5} mt={0.5}>
                {[['Live', '#30D158', liveCount], ['Upcoming', '#FF9F0A', upcomingCount], ['Ended', 'rgba(235,235,245,0.3)', endedCount]].map(([label, color, count]) => (
                  <Grid item xs={4} key={label}>
                    <Box sx={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', p: 1.25 }}>
                      <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>{count}</Typography>
                      <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', mt: 0.25 }}>{label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>

          {/* Exam Timeline */}
          <Grid item xs={12} md={8}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5, height: '100%' }}>
              <SectionHeader icon={IconTrendingUp} title="Exam Activity Timeline" />
              {examsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}><CircularProgress sx={{ color: '#0A84FF' }} /></Box>
              ) : monthlyExams.cats.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif' }}>No timeline data</Typography>
                </Box>
              ) : (
                <ReactApexChart options={areaChart.options} series={areaChart.series} type="area" height={220} />
              )}
            </Box>
          </Grid>
        </Grid>

        {/* ── Row 3: Violation Breakdown + Students per Exam ── */}
        <Grid container spacing={2.5}>
          {/* Violation type breakdown */}
          <Grid item xs={12} md={6}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5 }}>
              <SectionHeader icon={IconAlertTriangle} title="Violation Type Breakdown" color="#FF9F0A" />
              {logsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}><CircularProgress sx={{ color: '#FF9F0A' }} /></Box>
              ) : totalViolations === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={200} gap={1}>
                  <IconShieldCheck size={40} color="rgba(48,209,88,0.4)" />
                  <Typography sx={{ color: '#30D158', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem' }}>No violations recorded</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} mt={0.5}>
                  {violTypes.map(({ label, val, color }) => (
                    <Box key={label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.7)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.8125rem', color, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{val}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={maxViol > 0 ? (val / maxViol) * 100 : 0}
                        sx={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3 } }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>

          {/* Students per Exam */}
          <Grid item xs={12} md={6}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5 }}>
              <SectionHeader icon={IconUsers} title="Students per Exam (Top 8)" color="#BF5AF2" />
              {examsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}><CircularProgress sx={{ color: '#BF5AF2' }} /></Box>
              ) : perExam.names.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif' }}>No data</Typography>
                </Box>
              ) : (
                <ReactApexChart options={studentsBarChart.options} series={studentsBarChart.series} type="bar" height={280} />
              )}
            </Box>
          </Grid>

          {/* Summary table */}
          <Grid item xs={12}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '18px', p: 2.5 }}>
              <SectionHeader icon={IconAward} title="Exam Overview" color="#FFD60A" />
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Exam Name', 'Status', 'Questions', 'Duration', 'Starts', 'Ends'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.6875rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '0.5px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((e, i) => {
                      const st = examStatus(e);
                      const stColor = st === 'live' ? '#30D158' : st === 'upcoming' ? '#FF9F0A' : 'rgba(235,235,245,0.3)';
                      const stBg = st === 'live' ? 'rgba(48,209,88,0.1)' : st === 'upcoming' ? 'rgba(255,159,10,0.1)' : 'rgba(255,255,255,0.05)';
                      return (
                        <tr key={i} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '9px 12px', fontSize: '0.8125rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{e.examName}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: stColor, backgroundColor: stBg, borderRadius: '20px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }}>
                              {st === 'live' ? '⬤ ' : ''}{st}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: '0.8125rem', color: 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif' }}>{e.totalQuestions || '—'}</td>
                          <td style={{ padding: '9px 12px', fontSize: '0.8125rem', color: 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif' }}>{e.duration} min</td>
                          <td style={{ padding: '9px 12px', fontSize: '0.75rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                            {new Date(e.liveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: '0.75rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                            {new Date(e.deadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default TeacherAnalyticsPage;
