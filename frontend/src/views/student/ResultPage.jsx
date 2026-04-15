import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import { IconCode, IconEye, IconEyeOff, IconSearch, IconX, IconDownload, IconChartBar, IconSend, IconClipboardList, IconAward, IconTarget, IconTrendingUp } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import axiosInstance from '../../axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const StatCard = ({ value, label, accent }) => (
  <Box sx={{
    backgroundColor: '#1C1C1E',
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    p: 2.5,
  }}>
    <Typography sx={{ fontWeight: 700, fontSize: '2rem', color: accent || '#FFFFFF', letterSpacing: '-0.05em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
      {value}
    </Typography>
    <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.5)', mt: 0.75, fontFamily: 'Inter, sans-serif' }}>
      {label}
    </Typography>
  </Box>
);

const dialogSx = {
  '& .MuiDialog-paper': {
    backgroundColor: '#1C1C1E',
    border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
  },
};

const ResultPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const examsResponse = await axiosInstance.get('/api/users/exam', { withCredentials: true });
        setExams(examsResponse.data);
        const endpoint = userInfo?.role === 'teacher' ? '/api/users/results/all' : '/api/users/results/user';
        const resultsResponse = await axiosInstance.get(endpoint, { withCredentials: true });
        setResults(resultsResponse.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userInfo]);

  const handleBulkRelease = async () => {
    try {
      const examId = selectedExam !== 'all' ? selectedExam : undefined;
      await axiosInstance.post('/api/users/results/bulk-release', examId ? { examId } : {}, { withCredentials: true });
      toast.success('Results released to students');
      const endpoint = selectedExam !== 'all' ? `/api/users/results/exam/${selectedExam}` : '/api/users/results/all';
      const response = await axiosInstance.get(endpoint, { withCredentials: true });
      setResults(response.data.data);
    } catch {
      toast.error('Failed to release results');
    }
  };

  const handleToggleVisibility = async (resultId) => {
    try {
      await axiosInstance.put(`/api/users/results/${resultId}/toggle-visibility`, {}, { withCredentials: true });
      toast.success('Visibility updated');
      const response = await axiosInstance.get('/api/users/results/all', { withCredentials: true });
      setResults(response.data.data);
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const handleExamChange = async (examId) => {
    setSelectedExam(examId);
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/users/results/exam/${examId}`, { withCredentials: true });
      setResults(response.data.data);
    } catch {
      toast.error('Failed to fetch exam results');
    } finally {
      setLoading(false);
    }
  };

  const handleExportResults = async () => {
    try {
      const examId = selectedExam !== 'all' ? selectedExam : '';
      const url = `/api/users/results/export${examId ? `?examId=${examId}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `results_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Results exported successfully');
    } catch {
      toast.error('Failed to export results');
    }
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = selectedExam === 'all' || result.examId === selectedExam;
    return matchesSearch && matchesExam;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0A84FF' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ backgroundColor: 'rgba(255,69,58,0.1)', border: '0.5px solid rgba(255,69,58,0.3)', borderRadius: '12px', p: 3, m: 3 }}>
        <Typography sx={{ color: '#FF453A', fontFamily: 'Inter, sans-serif' }}>{error}</Typography>
      </Box>
    );
  }

  const avgScore = (arr) =>
    arr.length > 0 ? `${(arr.reduce((a, c) => a + c.percentage, 0) / arr.length).toFixed(1)}%` : '0%';

  const CodeDialog = ({ title }) => (
    <Dialog open={codeDialogOpen} onClose={() => setCodeDialogOpen(false)} maxWidth="md" fullWidth sx={dialogSx}>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1.0625rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
            {title}
          </Typography>
          <IconButton onClick={() => setCodeDialogOpen(false)} size="small" sx={{ color: 'rgba(235,235,245,0.4)' }}>
            <IconX size={18} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
        {selectedResult?.codingSubmissions?.map((submission, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
                Question {index + 1}
              </Typography>
              <Chip label={submission.language} size="small" sx={{ backgroundColor: 'rgba(10,132,255,0.15)', color: '#0A84FF', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 500 }} />
              {submission.executionTime && (
                <Chip label={`${submission.executionTime}ms`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }} />
              )}
            </Box>
            <Box sx={{ borderRadius: '10px', overflow: 'hidden' }}>
              <SyntaxHighlighter language={submission.language} style={atomOneDark} customStyle={{ borderRadius: 10, margin: 0, fontSize: '0.8125rem' }}>
                {submission.code}
              </SyntaxHighlighter>
            </Box>
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button onClick={() => setCodeDialogOpen(false)} sx={{ color: 'rgba(235,235,245,0.6)', borderRadius: '980px', px: 2.5, textTransform: 'none', fontFamily: 'Inter, sans-serif', '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  // --- STUDENT VIEW ---
  if (userInfo?.role === 'student') {
    const totalExams = results.length;
    const avgPct = totalExams > 0 ? results.reduce((a, c) => a + c.percentage, 0) / totalExams : 0;
    const passCount = results.filter(r => r.percentage >= (r.examId?.passingScore || 60)).length;
    const bestScore = totalExams > 0 ? Math.max(...results.map(r => r.percentage)) : 0;

    const kpiCards = [
      { icon: IconClipboardList, value: totalExams, label: 'Exams Taken', color: '#0A84FF', sub: 'Total attempts' },
      { icon: IconTrendingUp, value: `${avgPct.toFixed(1)}%`, label: 'Average Score', color: '#30D158', sub: avgPct >= 60 ? 'Above pass line' : 'Below pass line' },
      { icon: IconAward, value: passCount, label: 'Passed', color: '#30D158', sub: totalExams > 0 ? `${((passCount / totalExams) * 100).toFixed(0)}% pass rate` : '—' },
      { icon: IconTarget, value: totalExams > 0 ? `${bestScore.toFixed(1)}%` : '—', label: 'Best Score', color: '#FF9F0A', sub: 'Personal best' },
    ];

    return (
      <PageContainer title="My Results">
        <Box sx={{ pb: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
              My Results
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.45)', mt: 0.75, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
              View your exam performance and history
            </Typography>
          </Box>

          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {kpiCards.map(({ icon: Icon, value, label, color, sub }) => (
              <Grid item xs={6} sm={3} key={label}>
                <Box sx={{
                  backgroundColor: '#1C1C1E',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', p: 2.25,
                  display: 'flex', flexDirection: 'column', gap: 1.5,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <Box sx={{ position: 'absolute', top: -12, right: -12, width: 72, height: 72, borderRadius: '50%', background: `${color}10`, pointerEvents: 'none' }} />
                  <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={19} color={color} stroke={1.75} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.05em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{value}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.45)', mt: 0.4, fontFamily: 'Inter, sans-serif' }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.625rem', color, fontWeight: 600, mt: 0.25, fontFamily: 'Inter, sans-serif' }}>{sub}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Score Trend Chart */}
          {results.length > 1 && (() => {
            const sorted = [...results].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const chartOpts = {
              chart: { background: 'transparent', toolbar: { show: false }, type: 'area' },
              stroke: { curve: 'smooth', width: 2, colors: ['#0A84FF'] },
              fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02, stops: [0, 100], colorStops: [{ offset: 0, color: '#0A84FF', opacity: 0.25 }, { offset: 100, color: '#0A84FF', opacity: 0 }] } },
              xaxis: { categories: sorted.map(r => r.examId?.examName?.slice(0, 14) || 'Exam'), labels: { style: { colors: Array(sorted.length).fill('rgba(235,235,245,0.35)'), fontFamily: 'Inter,sans-serif', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
              yaxis: { min: 0, max: 100, labels: { formatter: v => `${v}%`, style: { colors: ['rgba(235,235,245,0.35)'], fontFamily: 'Inter,sans-serif', fontSize: '11px' } } },
              grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
              markers: { size: 5, colors: ['#0A84FF'], strokeColors: '#1C1C1E', strokeWidth: 2 },
              tooltip: { theme: 'dark', y: { formatter: v => `${v.toFixed(1)}%` } },
              annotations: { yaxis: [{ y: 60, borderColor: '#FF9F0A', borderWidth: 1, strokeDashArray: 4, label: { text: 'Pass Line', style: { color: '#FF9F0A', background: 'transparent', fontFamily: 'Inter,sans-serif', fontSize: '11px' } } }] },
            };
            return (
              <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', p: 2.5, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: 'rgba(10,132,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconTrendingUp size={14} color="#0A84FF" stroke={1.75} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter,sans-serif' }}>Score Trend</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif', mb: 1.5, ml: 4.5 }}>Your performance across exams</Typography>
                <ReactApexChart options={chartOpts} series={[{ name: 'Score', data: sorted.map(r => parseFloat(r.percentage.toFixed(1))) }]} type="area" height={180} />
              </Box>
            );
          })()}

          {/* Results Table */}
          <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '0.5px solid rgba(84,84,88,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: 'rgba(10,132,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconClipboardList size={14} color="#0A84FF" stroke={1.75} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Exam History</Typography>
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(10,132,255,0.1)', borderRadius: '980px', px: 1.25, py: 0.4 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#0A84FF', fontFamily: 'Inter, sans-serif' }}>
                  {totalExams} result{totalExams !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>

            {results.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem' }}>
                  No results yet. Complete an exam to see your score.
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', py: 1.25, px: 2.5, fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell>Exam</TableCell>
                    <TableCell align="center" sx={{ minWidth: 110 }}>Score</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Marks</TableCell>
                    <TableCell align="center">Date</TableCell>
                    <TableCell align="center">Code</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result) => {
                    const passing = result.examId?.passingScore || 60;
                    const passed = result.percentage >= passing;
                    const pct = result.percentage;
                    const barColor = pct >= 80 ? '#30D158' : pct >= passing ? '#FF9F0A' : '#FF453A';
                    return (
                      <TableRow
                        key={result._id}
                        sx={{
                          '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.04)', py: 1.75, px: 2.5, fontFamily: 'Inter, sans-serif' },
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.025)' },
                          '&:last-child .MuiTableCell-root': { borderBottom: 0 },
                        }}
                      >
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
                            {result.examId?.examName || 'Exam'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', mt: 0.25 }}>
                            {result.examId?.subject || 'General'} · Pass: {passing}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', color: barColor, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', lineHeight: 1 }}>
                              {pct.toFixed(1)}%
                            </Typography>
                            <Box sx={{ width: 80, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                              <Box sx={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: barColor, borderRadius: '2px' }} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, backgroundColor: passed ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)', borderRadius: '980px', px: 1.25, py: 0.5 }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: passed ? '#30D158' : '#FF453A', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: passed ? '#30D158' : '#FF453A', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
                              {passed ? 'PASSED' : 'FAILED'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(235,235,245,0.7)', fontFamily: 'Inter, sans-serif' }}>
                            {result.totalMarks}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.45)', fontFamily: 'Inter, sans-serif' }}>
                            {new Date(result.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {result.codingSubmissions?.length > 0 && (
                            <IconButton size="small" onClick={() => { setSelectedResult(result); setCodeDialogOpen(true); }} sx={{ color: '#0A84FF', '&:hover': { backgroundColor: 'rgba(10,132,255,0.1)' } }}>
                              <IconCode size={16} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
          <CodeDialog title="My Code Submissions" />
        </Box>
      </PageContainer>
    );
  }

  // --- TEACHER VIEW ---
  const selectSx = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: '10px',
    color: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.875rem',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0A84FF' },
    '& .MuiSelect-icon': { color: 'rgba(235,235,245,0.4)' },
  };

  return (
    <PageContainer title="Results">
      <Box sx={{ pb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
            Results
          </Typography>
          <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.45)', mt: 0.75, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
            View and manage student exam results
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}><StatCard value={filteredResults.length} label="Submissions" accent="#0A84FF" /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={avgScore(filteredResults)} label="Average Score" accent="#30D158" /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={filteredResults.filter((r) => r.percentage >= 60).length} label="Passed" accent="#30D158" /></Grid>
          <Grid item xs={6} sm={3}><StatCard value={filteredResults.reduce((a, c) => a + (c.codingSubmissions?.length || 0), 0)} label="Code Submissions" accent="#BF5AF2" /></Grid>
        </Grid>

        {/* Filters + Export */}
        <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', p: 2.5, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1, fontFamily: 'Inter, sans-serif' }}>Exam</Typography>
            <Select value={selectedExam} onChange={(e) => handleExamChange(e.target.value)} fullWidth size="small" sx={selectSx}>
              <MenuItem value="all" sx={{ fontFamily: 'Inter, sans-serif' }}>All Exams</MenuItem>
              {exams.map((exam) => <MenuItem key={exam._id} value={exam._id} sx={{ fontFamily: 'Inter, sans-serif' }}>{exam.examName}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1, fontFamily: 'Inter, sans-serif' }}>Search</Typography>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(235,235,245,0.3)', pointerEvents: 'none' }}><IconSearch size={15} /></Box>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or email…" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px 8px 36px', color: '#FFFFFF', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </Box>
          </Box>
          <Button
            onClick={handleExportResults}
            startIcon={<IconDownload size={15} />}
            sx={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(235,235,245,0.8)', borderRadius: '980px', px: 2.25, py: 1, fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', textTransform: 'none', border: '0.5px solid rgba(255,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.11)' }, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
          >
            Export CSV
          </Button>
          <Button
            onClick={handleBulkRelease}
            startIcon={<IconSend size={15} />}
            sx={{ backgroundColor: '#0A84FF', color: '#fff', borderRadius: '980px', px: 2.25, py: 1, fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', textTransform: 'none', '&:hover': { backgroundColor: '#409CFF' }, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
          >
            Release All
          </Button>
        </Box>

        {/* Score Distribution Chart */}
        {filteredResults.length > 0 && (() => {
          const brackets = ['0-10','11-20','21-30','31-40','41-50','51-60','61-70','71-80','81-90','91-100'];
          const counts = brackets.map((_, i) => filteredResults.filter((r) => {
            const p = r.percentage;
            return p >= i * 10 && (i === 9 ? p <= 100 : p < (i + 1) * 10);
          }).length);
          const passIdx = 6; // 61-70 and above = pass (60%+)
          const chartColors = counts.map((_, i) => i >= passIdx ? '#30D158' : '#FF453A');
          const distOptions = {
            chart: { background: 'transparent', toolbar: { show: false }, type: 'bar' },
            plotOptions: { bar: { columnWidth: '60%', borderRadius: 4, distributed: true } },
            colors: chartColors,
            xaxis: { categories: brackets, labels: { style: { colors: Array(10).fill('rgba(235,235,245,0.4)'), fontFamily: 'Inter,sans-serif', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
            yaxis: { labels: { style: { colors: ['rgba(235,235,245,0.4)'], fontFamily: 'Inter,sans-serif' } }, allowDecimals: false },
            grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
            legend: { show: false },
            tooltip: { theme: 'dark', y: { formatter: (v) => `${v} student${v !== 1 ? 's' : ''}` } },
            annotations: { xaxis: [{ x: '61-70', borderColor: '#FF9F0A', strokeDashArray: 4, label: { text: 'Pass threshold', style: { color: '#FF9F0A', background: 'transparent', fontFamily: 'Inter,sans-serif', fontSize: '11px' } } }] },
          };
          return (
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', p: 2.5, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconChartBar size={16} color="#0A84FF" />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter,sans-serif' }}>Score Distribution</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#30D158' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter,sans-serif' }}>Pass</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF453A' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter,sans-serif' }}>Fail</Typography>
                  </Box>
                </Box>
              </Box>
              <ReactApexChart options={distOptions} series={[{ name: 'Students', data: counts }]} type="bar" height={160} />
            </Box>
          );
        })()}

        {/* Table */}
        <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, borderBottom: '0.5px solid rgba(84,84,88,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ '& .MuiTab-root': { color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', textTransform: 'none', fontWeight: 500, minHeight: 48 }, '& .Mui-selected': { color: '#FFFFFF' }, '& .MuiTabs-indicator': { backgroundColor: '#0A84FF', height: 2 } }}>
              <Tab label="All Results" />
              <Tab label="MCQ" />
              <Tab label="Coding" />
            </Tabs>
            <Button
              size="small"
              startIcon={<IconSend size={14} />}
              onClick={handleBulkRelease}
              sx={{ color: '#0A84FF', fontSize: '0.8125rem', fontFamily: 'Inter,sans-serif', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 1.5, mr: 1, '&:hover': { backgroundColor: 'rgba(10,132,255,0.08)' } }}
            >
              Release All
            </Button>
            <Button
              size="small"
              startIcon={<IconDownload size={14} />}
              onClick={() => {
                const headers = ['Student','Email','Exam','Score (%)','Total Marks','Pass/Fail','Date'];
                const rows = filteredResults.map((r) => [
                  r.userId?.name || '',
                  r.userId?.email || '',
                  exams.find((e) => e._id === r.examId)?.examName || r.examId,
                  r.percentage.toFixed(1),
                  r.totalMarks,
                  r.percentage >= 60 ? 'Pass' : 'Fail',
                  new Date(r.createdAt).toLocaleDateString(),
                ].map((v) => `"${v}"`).join(','));
                const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `results_${new Date().toISOString().slice(0,10)}.csv`; a.click();
              }}
              sx={{ color: '#30D158', fontSize: '0.8125rem', fontFamily: 'Inter,sans-serif', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 1.5, '&:hover': { backgroundColor: 'rgba(48,209,88,0.08)' } }}
            >
              Export CSV
            </Button>
          </Box>

          {filteredResults.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem' }}>No results found.</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Exam</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="center">Total Marks</TableCell>
                  <TableCell align="center">Date</TableCell>
                  <TableCell align="center">Visible</TableCell>
                  <TableCell align="center">Code</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#0A84FF', fontSize: '0.75rem', fontWeight: 700 }}>
                          {result.userId?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>{result.userId?.name}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>{result.userId?.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.7)', fontFamily: 'Inter, sans-serif' }}>
                        {exams.find((e) => e._id === result.examId)?.examName || result.examId}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${result.percentage.toFixed(1)}%`} size="small" color={result.percentage >= 70 ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif' }}>{result.totalMarks}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif' }}>{new Date(result.createdAt).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleToggleVisibility(result._id)} sx={{ color: result.showToStudent ? '#30D158' : 'rgba(235,235,245,0.3)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>
                        {result.showToStudent ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      {result.codingSubmissions?.length > 0 && (
                        <IconButton size="small" onClick={() => { setSelectedResult(result); setCodeDialogOpen(true); }} sx={{ color: '#0A84FF', '&:hover': { backgroundColor: 'rgba(10,132,255,0.1)' } }}>
                          <IconCode size={16} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
        <CodeDialog title="Student Code Submissions" />
      </Box>
    </PageContainer>
  );
};

export default ResultPage;
