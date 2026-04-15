import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableHead, TableRow, Typography,
  CircularProgress, Dialog, DialogTitle, DialogContent, Grid, Card,
  CardMedia, CardContent, IconButton, Select, MenuItem, Avatar, Stack, Tooltip, LinearProgress,
} from '@mui/material';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { useGetCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';
import {
  IconX, IconPhoto, IconAlertTriangle, IconSearch, IconShieldOff,
  IconDownload, IconEye, IconUser, IconUsers, IconDeviceMobile,
  IconBook, IconRefresh, IconWindowMaximize, IconLock,
  IconDeviceDesktop, IconMicrophone, IconChevronDown, IconChevronUp, IconMapPin,
} from '@tabler/icons-react';
import ReactApexChart from 'react-apexcharts';

const getRisk = (total) => {
  if (total >= 10) return { label: 'Critical', color: '#FF453A', bg: 'rgba(255,69,58,0.12)' };
  if (total >= 5)  return { label: 'High',     color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)' };
  if (total >= 2)  return { label: 'Medium',   color: '#FFD60A', bg: 'rgba(255,214,10,0.12)' };
  if (total >= 1)  return { label: 'Low',      color: '#30D158', bg: 'rgba(48,209,88,0.12)' };
  return                  { label: 'Clear',    color: 'rgba(235,235,245,0.3)', bg: 'rgba(255,255,255,0.04)' };
};

const getTotal = (log) =>
  (log.noFaceCount || 0) + (log.multipleFaceCount || 0) + (log.cellPhoneCount || 0) +
  (log.prohibitedObjectCount || 0) + (log.tabSwitchViolations || 0) +
  (log.windowBlurViolations || 0) + (log.browserLockdownViolations || 0) +
  (log.gazeViolationCount || 0) + (log.externalDisplayCount || 0) + (log.audioViolationCount || 0);

const VCOLS = [
  { key: 'noFaceCount',               label: 'No Face',     icon: IconUser,          color: '#BF5AF2' },
  { key: 'multipleFaceCount',         label: 'Multi-Face',  icon: IconUsers,         color: '#FF9F0A' },
  { key: 'cellPhoneCount',            label: 'Phone',       icon: IconDeviceMobile,  color: '#FF453A' },
  { key: 'prohibitedObjectCount',     label: 'Prohibited',  icon: IconBook,          color: '#FF9F0A' },
  { key: 'tabSwitchViolations',       label: 'Tab Switch',  icon: IconRefresh,       color: '#0A84FF' },
  { key: 'windowBlurViolations',      label: 'Win Blur',    icon: IconWindowMaximize,color: '#64D2FF' },
  { key: 'browserLockdownViolations', label: 'Lockdown',    icon: IconLock,          color: '#FF453A' },
  { key: 'gazeViolationCount',        label: 'Gaze',        icon: IconMapPin,        color: '#30D158' },
  { key: 'externalDisplayCount',      label: 'Ext Display', icon: IconDeviceDesktop, color: '#5E5CE6' },
  { key: 'audioViolationCount',       label: 'Audio',       icon: IconMicrophone,    color: '#FF6B6B' },
];

const inputSx = { background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF', fontSize: '0.875rem', fontFamily: 'Inter,sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box' };
const selectSx = { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: '#FFFFFF', fontFamily: 'Inter,sans-serif', fontSize: '0.875rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0A84FF' }, '& .MuiSelect-icon': { color: 'rgba(235,235,245,0.4)' } };

const downloadCSV = (logs, examName) => {
  const headers = ['#','Student','Email',...VCOLS.map(c=>c.label),'Total','Risk','Screenshots'];
  const rows = logs.map((log,i) => [i+1,log.username,log.email,...VCOLS.map(c=>log[c.key]||0),getTotal(log),getRisk(getTotal(log)).label,log.screenshots?.length||0].join(','));
  const blob = new Blob([[headers.join(','),...rows].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `violations_${examName||'exam'}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
};

export default function CheatingTable() {
  const [filter, setFilter] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [cheatingLogs, setCheatingLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openScreenshots, setOpenScreenshots] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState('desc');

  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery();
  const { data: cheatingLogsData, isLoading: logsLoading } = useGetCheatingLogsQuery(selectedExamId, { skip: !selectedExamId });

  useEffect(() => { if (examsData?.length > 0 && !selectedExamId) setSelectedExamId(examsData[0].examId); }, [examsData]);
  useEffect(() => { if (cheatingLogsData) setCheatingLogs(Array.isArray(cheatingLogsData) ? cheatingLogsData : []); }, [cheatingLogsData]);

  const selectedExam = examsData?.find(e => e.examId === selectedExamId);

  const handleSort = (key) => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('desc'); } };

  const filtered = cheatingLogs
    .filter(log => {
      const q = filter.toLowerCase();
      const matchSearch = !q || log.username?.toLowerCase().includes(q) || log.email?.toLowerCase().includes(q);
      const risk = getRisk(getTotal(log)).label.toLowerCase();
      const matchRisk = riskFilter === 'all' || risk === riskFilter.toLowerCase();
      return matchSearch && matchRisk;
    })
    .sort((a, b) => {
      if (sortKey === 'name') { const va = a.username||''; const vb = b.username||''; return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      const va = sortKey === 'total' ? getTotal(a) : (a[sortKey]||0);
      const vb = sortKey === 'total' ? getTotal(b) : (b[sortKey]||0);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  const totalStudents = filtered.length;
  const highRisk = filtered.filter(l => getTotal(l) >= 5).length;
  const totalViolationsAll = filtered.reduce((s,l) => s + getTotal(l), 0);
  const avgViolations = totalStudents ? (totalViolationsAll / totalStudents).toFixed(1) : 0;

  const radarOptions = (log) => ({
    chart: { background: 'transparent', toolbar: { show: false }, type: 'radar' },
    xaxis: { categories: VCOLS.map(c=>c.label), labels: { style: { colors: Array(10).fill('rgba(235,235,245,0.4)'), fontFamily: 'Inter,sans-serif', fontSize: '10px' } } },
    yaxis: { show: false }, fill: { opacity: 0.15 }, stroke: { width: 2, colors: ['#0A84FF'] },
    markers: { size: 3, colors: ['#0A84FF'] }, colors: ['#0A84FF'],
    tooltip: { theme: 'dark' },
    plotOptions: { radar: { polygons: { strokeColors: 'rgba(255,255,255,0.07)', fill: { colors: ['rgba(255,255,255,0.02)','rgba(255,255,255,0.01)'] } } } },
  });

  const SortIcon = ({ k }) => sortKey === k ? (sortDir === 'asc' ? <IconChevronUp size={11}/> : <IconChevronDown size={11}/>) : null;

  if (examsLoading) return <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:200 }}><CircularProgress sx={{ color:'#0A84FF' }}/></Box>;
  if (!examsData?.length) return <Box sx={{ backgroundColor:'#1C1C1E', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:'16px', py:8, textAlign:'center' }}><Typography sx={{ color:'rgba(235,235,245,0.3)', fontFamily:'Inter,sans-serif' }}>No exams available.</Typography></Box>;

  return (
    <Box>
      {/* Summary Stats */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: 'Students Monitored', value: totalStudents,       color: '#0A84FF' },
          { label: 'High Risk (≥5)',      value: highRisk,            color: '#FF453A' },
          { label: 'Total Violations',    value: totalViolationsAll,  color: '#FF9F0A' },
          { label: 'Avg per Student',     value: avgViolations,       color: '#BF5AF2' },
        ].map((s,i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Box sx={{ backgroundColor:'#1C1C1E', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:'14px', p:2 }}>
              <Typography sx={{ fontWeight:800, fontSize:'1.75rem', color:s.color, letterSpacing:'-0.05em', lineHeight:1, fontFamily:'Inter,sans-serif' }}>{s.value}</Typography>
              <Typography sx={{ fontSize:'0.75rem', color:'rgba(235,235,245,0.4)', mt:0.5, fontFamily:'Inter,sans-serif' }}>{s.label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ backgroundColor:'#1C1C1E', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:'16px', p:2.5, mb:2, display:'flex', gap:2, flexWrap:'wrap', alignItems:'flex-end' }}>
        <Box sx={{ flex:'1 1 180px' }}>
          <Typography sx={{ fontSize:'0.6875rem', fontWeight:600, color:'rgba(235,235,245,0.3)', letterSpacing:'0.06em', textTransform:'uppercase', mb:1, fontFamily:'Inter,sans-serif' }}>Exam</Typography>
          <Select value={selectedExamId||''} onChange={e=>setSelectedExamId(e.target.value)} fullWidth size="small" sx={selectSx}>
            {examsData.map(exam => <MenuItem key={exam.examId} value={exam.examId} sx={{ fontFamily:'Inter,sans-serif' }}>{exam.examName||'Unnamed'}</MenuItem>)}
          </Select>
        </Box>
        <Box sx={{ flex:'1 1 180px' }}>
          <Typography sx={{ fontSize:'0.6875rem', fontWeight:600, color:'rgba(235,235,245,0.3)', letterSpacing:'0.06em', textTransform:'uppercase', mb:1, fontFamily:'Inter,sans-serif' }}>Search Student</Typography>
          <Box sx={{ position:'relative' }}>
            <Box sx={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(235,235,245,0.3)', pointerEvents:'none' }}><IconSearch size={14}/></Box>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Name or email…" style={{ ...inputSx, paddingLeft:'36px' }}/>
          </Box>
        </Box>
        <Box sx={{ flex:'1 1 140px' }}>
          <Typography sx={{ fontSize:'0.6875rem', fontWeight:600, color:'rgba(235,235,245,0.3)', letterSpacing:'0.06em', textTransform:'uppercase', mb:1, fontFamily:'Inter,sans-serif' }}>Risk Level</Typography>
          <Select value={riskFilter} onChange={e=>setRiskFilter(e.target.value)} fullWidth size="small" sx={selectSx}>
            {['all','critical','high','medium','low','clear'].map(r => <MenuItem key={r} value={r} sx={{ fontFamily:'Inter,sans-serif' }}>{r==='all'?'All Levels':r.charAt(0).toUpperCase()+r.slice(1)}</MenuItem>)}
          </Select>
        </Box>
        <Tooltip title="Export as CSV">
          <Box onClick={() => downloadCSV(filtered, selectedExam?.examName)} sx={{ height:40, px:2, backgroundColor:'rgba(48,209,88,0.08)', border:'0.5px solid rgba(48,209,88,0.2)', borderRadius:'10px', display:'flex', alignItems:'center', gap:1, cursor:'pointer', '&:hover':{ backgroundColor:'rgba(48,209,88,0.15)' } }}>
            <IconDownload size={15} color="#30D158"/>
            <Typography sx={{ fontSize:'0.8125rem', color:'#30D158', fontFamily:'Inter,sans-serif', fontWeight:600 }}>Export CSV</Typography>
          </Box>
        </Tooltip>
      </Box>

      {/* Table */}
      <Box sx={{ backgroundColor:'#1C1C1E', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:'16px', overflow:'hidden' }}>
        <Box sx={{ px:2.5, py:2, borderBottom:'0.5px solid rgba(84,84,88,0.4)', display:'flex', alignItems:'center', gap:1.5 }}>
          <Box sx={{ width:32, height:32, borderRadius:'8px', backgroundColor:'rgba(255,159,10,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <IconShieldOff size={16} color="#FF9F0A"/>
          </Box>
          <Typography sx={{ fontWeight:600, fontSize:'0.9375rem', color:'#FFFFFF', fontFamily:'Inter,sans-serif' }}>Violation Logs</Typography>
          {filtered.length > 0 && <Box sx={{ backgroundColor:'rgba(255,159,10,0.12)', borderRadius:'20px', px:1.25, py:0.25 }}><Typography sx={{ fontSize:'0.75rem', color:'#FF9F0A', fontWeight:600, fontFamily:'Inter,sans-serif' }}>{filtered.length} students</Typography></Box>}
        </Box>

        {logsLoading ? (
          <Box sx={{ display:'flex', justifyContent:'center', py:6 }}><CircularProgress sx={{ color:'#0A84FF' }}/></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py:8, textAlign:'center' }}><Typography sx={{ color:'rgba(235,235,245,0.3)', fontFamily:'Inter,sans-serif' }}>No violations found for this exam.</Typography></Box>
        ) : (
          <Box sx={{ overflowX:'auto' }}>
            <Table sx={{ minWidth:1000 }}>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { borderColor:'rgba(84,84,88,0.25)', py:1.25, px:1.5, fontSize:'0.6875rem', fontWeight:600, color:'rgba(235,235,245,0.3)', letterSpacing:'0.05em', textTransform:'uppercase', fontFamily:'Inter,sans-serif', backgroundColor:'rgba(255,255,255,0.02)', whiteSpace:'nowrap' } }}>
                  <TableCell>#</TableCell>
                  <TableCell onClick={()=>handleSort('name')} sx={{ cursor:'pointer' }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>Student <SortIcon k="name"/></Box>
                  </TableCell>
                  {VCOLS.map(col => (
                    <TableCell key={col.key} align="center" onClick={()=>handleSort(col.key)} sx={{ cursor:'pointer' }}>
                      <Tooltip title={col.label}>
                        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.4 }}>
                          <col.icon size={13} color={col.color}/> <SortIcon k={col.key}/>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  ))}
                  <TableCell align="center" onClick={()=>handleSort('total')} sx={{ cursor:'pointer' }}>
                    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.5 }}>Total <SortIcon k="total"/></Box>
                  </TableCell>
                  <TableCell align="center">Risk</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((log, index) => {
                  const total = getTotal(log);
                  const risk = getRisk(total);
                  return (
                    <TableRow key={index} sx={{ '& .MuiTableCell-root':{ borderColor:'rgba(84,84,88,0.15)', py:1.25, px:1.5 }, '&:hover':{ backgroundColor:'rgba(255,255,255,0.015)' }, '&:last-child .MuiTableCell-root':{ borderBottom:'none' } }}>
                      <TableCell><Typography sx={{ fontSize:'0.75rem', color:'rgba(235,235,245,0.3)', fontFamily:'Inter,sans-serif' }}>{index+1}</Typography></TableCell>
                      <TableCell>
                        <Box sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
                          <Avatar sx={{ width:30, height:30, background:`linear-gradient(135deg,${risk.color}70,${risk.color}30)`, fontSize:'0.75rem', fontWeight:700, fontFamily:'Inter,sans-serif' }}>
                            {log.username?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight:600, fontSize:'0.875rem', color:'#FFFFFF', fontFamily:'Inter,sans-serif', lineHeight:1.2 }}>{log.username}</Typography>
                            <Typography sx={{ fontSize:'0.6875rem', color:'rgba(235,235,245,0.3)', fontFamily:'Inter,sans-serif' }}>{log.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      {VCOLS.map(col => {
                        const count = log[col.key] || 0;
                        return (
                          <TableCell key={col.key} align="center">
                            {count > 0 ? (
                              <Box sx={{ display:'inline-flex', alignItems:'center', gap:0.4, backgroundColor:`${col.color}15`, borderRadius:'6px', px:0.75, py:0.25 }}>
                                {count > 3 && <IconAlertTriangle size={10} color={col.color}/>}
                                <Typography sx={{ fontSize:'0.8125rem', fontWeight:600, color:col.color, fontFamily:'Inter,sans-serif' }}>{count}</Typography>
                              </Box>
                            ) : (
                              <Typography sx={{ fontSize:'0.75rem', color:'rgba(235,235,245,0.15)', fontFamily:'Inter,sans-serif' }}>—</Typography>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        <Typography sx={{ fontWeight:800, fontSize:'1rem', color: total>=10?'#FF453A':total>=5?'#FF9F0A':total>0?'#FFFFFF':'rgba(235,235,245,0.25)', fontFamily:'Inter,sans-serif', letterSpacing:'-0.03em' }}>{total}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display:'inline-flex', backgroundColor:risk.bg, borderRadius:'20px', px:1.25, py:0.4 }}>
                          <Typography sx={{ fontSize:'0.6875rem', fontWeight:600, color:risk.color, fontFamily:'Inter,sans-serif' }}>{risk.label}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display:'flex', gap:0.5, justifyContent:'center' }}>
                          <Tooltip title="View Detail">
                            <IconButton size="small" onClick={() => { setSelectedLog(log); setOpenDetail(true); }} sx={{ color:'#0A84FF', '&:hover':{ backgroundColor:'rgba(10,132,255,0.1)' } }}>
                              <IconEye size={15}/>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={log.screenshots?.length ? `${log.screenshots.length} screenshots` : 'No screenshots'}>
                            <span>
                              <IconButton size="small" onClick={() => { setSelectedLog(log); setOpenScreenshots(true); }} disabled={!log.screenshots?.length}
                                sx={{ color: log.screenshots?.length ? '#FF9F0A':'rgba(255,255,255,0.15)', '&:hover':{ backgroundColor: log.screenshots?.length ? 'rgba(255,159,10,0.1)':'transparent' } }}>
                                <IconPhoto size={15}/>
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper':{ backgroundColor:'#1C1C1E', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:'20px' } }}>
        <DialogTitle sx={{ px:3, pt:3, pb:0 }}>
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {selectedLog && (() => {
              const total = getTotal(selectedLog);
              const risk = getRisk(total);
              return (
                <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                  <Avatar sx={{ width:40, height:40, background:`linear-gradient(135deg,${risk.color}70,${risk.color}30)`, fontWeight:700, fontFamily:'Inter,sans-serif' }}>{selectedLog.username?.charAt(0).toUpperCase()}</Avatar>
                  <Box>
                    <Typography sx={{ fontWeight:700, fontSize:'1.0625rem', color:'#FFFFFF', fontFamily:'Inter,sans-serif' }}>{selectedLog.username}</Typography>
                    <Typography sx={{ fontSize:'0.8125rem', color:'rgba(235,235,245,0.4)', fontFamily:'Inter,sans-serif' }}>{selectedLog.email}</Typography>
                  </Box>
                  <Box sx={{ display:'inline-flex', backgroundColor:risk.bg, borderRadius:'20px', px:1.5, py:0.5, ml:1 }}>
                    <Typography sx={{ fontSize:'0.75rem', fontWeight:700, color:risk.color, fontFamily:'Inter,sans-serif' }}>{risk.label} Risk — {total} violations</Typography>
                  </Box>
                </Box>
              );
            })()}
            <IconButton onClick={() => setOpenDetail(false)} size="small" sx={{ color:'rgba(235,235,245,0.4)' }}><IconX size={18}/></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px:3, pt:2.5, pb:3 }}>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <Typography sx={{ fontSize:'0.6875rem', fontWeight:600, color:'rgba(235,235,245,0.3)', letterSpacing:'0.06em', textTransform:'uppercase', mb:1.5, fontFamily:'Inter,sans-serif' }}>Violation Breakdown</Typography>
                <Stack spacing={1}>
                  {VCOLS.map(col => {
                    const count = selectedLog[col.key] || 0;
                    const maxVal = Math.max(...cheatingLogs.map(l => l[col.key]||0), 1);
                    const pct = Math.round((count/maxVal)*100);
                    return (
                      <Box key={col.key}>
                        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:0.5 }}>
                          <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                            <col.icon size={13} color={count>0?col.color:'rgba(235,235,245,0.2)'}/>
                            <Typography sx={{ fontSize:'0.8125rem', color:count>0?'#FFFFFF':'rgba(235,235,245,0.3)', fontFamily:'Inter,sans-serif' }}>{col.label}</Typography>
                          </Box>
                          <Typography sx={{ fontSize:'0.8125rem', fontWeight:700, color:count>0?col.color:'rgba(235,235,245,0.2)', fontFamily:'Inter,sans-serif' }}>{count}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct} sx={{ height:4, borderRadius:2, backgroundColor:'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar':{ backgroundColor:col.color, borderRadius:2 } }}/>
                      </Box>
                    );
                  })}
                  <Box sx={{ mt:1, p:1.5, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:'10px', display:'flex', justifyContent:'space-between' }}>
                    <Typography sx={{ fontSize:'0.875rem', fontWeight:600, color:'rgba(235,235,245,0.6)', fontFamily:'Inter,sans-serif' }}>Total Violations</Typography>
                    <Typography sx={{ fontSize:'1.25rem', fontWeight:800, color:getRisk(getTotal(selectedLog)).color, fontFamily:'Inter,sans-serif', letterSpacing:'-0.04em' }}>{getTotal(selectedLog)}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={5}>
                <Typography sx={{ fontSize:'0.6875rem', fontWeight:600, color:'rgba(235,235,245,0.3)', letterSpacing:'0.06em', textTransform:'uppercase', mb:1.5, fontFamily:'Inter,sans-serif' }}>Violation Pattern</Typography>
                <ReactApexChart options={radarOptions(selectedLog)} series={[{ name:'Violations', data:VCOLS.map(c=>selectedLog[c.key]||0) }]} type="radar" height={250}/>
              </Grid>
              {selectedLog.screenshots?.length > 0 && (
                <Grid item xs={12}>
                  <Box onClick={() => { setOpenDetail(false); setTimeout(() => setOpenScreenshots(true), 150); }} sx={{ p:1.5, backgroundColor:'rgba(255,159,10,0.07)', border:'0.5px solid rgba(255,159,10,0.2)', borderRadius:'10px', display:'flex', alignItems:'center', gap:1.5, cursor:'pointer', '&:hover':{ backgroundColor:'rgba(255,159,10,0.12)' } }}>
                    <IconPhoto size={16} color="#FF9F0A"/>
                    <Typography sx={{ fontSize:'0.875rem', color:'#FF9F0A', fontFamily:'Inter,sans-serif', fontWeight:500 }}>View {selectedLog.screenshots.length} violation screenshot{selectedLog.screenshots.length>1?'s':''} →</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Screenshots Dialog */}
      <Dialog open={openScreenshots} onClose={() => setOpenScreenshots(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper':{ backgroundColor:'#1C1C1E', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:'20px' } }}>
        <DialogTitle sx={{ px:3, pt:3, pb:0 }}>
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Typography sx={{ fontWeight:600, fontSize:'1.0625rem', color:'#FFFFFF', fontFamily:'Inter,sans-serif' }}>Screenshots — {selectedLog?.username} ({selectedLog?.screenshots?.length||0})</Typography>
            <IconButton onClick={() => setOpenScreenshots(false)} size="small" sx={{ color:'rgba(235,235,245,0.4)' }}><IconX size={18}/></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px:3, pt:2.5, pb:3 }}>
          {(!selectedLog?.screenshots?.length) && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography sx={{ color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter,sans-serif', fontSize: '0.875rem' }}>No screenshots captured for this student.</Typography>
            </Box>
          )}
          <Grid container spacing={1.5}>
            {selectedLog?.screenshots?.map((ss, i) => {
              const typeColorMap = {
                periodic:        '#0A84FF',
                noFace:          '#BF5AF2',
                multipleFace:    '#FF9F0A',
                cellPhone:       '#FF453A',
                prohibitedObject:'#FF453A',
                gazeViolation:   '#30D158',
                tabSwitch:       '#64D2FF',
                lockdown:        '#FF453A',
                audioViolation:  '#FF9F0A',
                externalDisplay: '#5E5CE6',
              };
              const color = typeColorMap[ss.type] || '#FF9F0A';
              const label = ss.type?.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) || 'Unknown';
              return (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ backgroundColor:'#2C2C2E', border:`0.5px solid ${color}30`, borderRadius:'12px', overflow:'hidden', transition:'border-color 0.15s', '&:hover':{ borderColor:`${color}70` } }}>
                    <Box sx={{ position:'relative' }}>
                      <CardMedia component="img" height="150" image={ss.url} alt={ss.type} sx={{ objectFit:'cover', cursor:'pointer' }} onClick={() => window.open(ss.url,'_blank')}/>
                      <Box sx={{ position:'absolute', top:6, left:6, backgroundColor:`${color}CC`, borderRadius:'6px', px:0.75, py:0.2 }}>
                        <Typography sx={{ fontSize:'0.5625rem', fontWeight:800, color:'#fff', letterSpacing:'0.06em', fontFamily:'Inter,sans-serif' }}>{label.toUpperCase()}</Typography>
                      </Box>
                      <Box sx={{ position:'absolute', top:6, right:6, backgroundColor:'rgba(0,0,0,0.6)', borderRadius:'6px', px:0.75, py:0.2 }}>
                        <Typography sx={{ fontSize:'0.5625rem', fontWeight:600, color:'rgba(255,255,255,0.7)', fontFamily:'Inter,sans-serif' }}>#{i+1}</Typography>
                      </Box>
                    </Box>
                    <CardContent sx={{ p:1.25, '&:last-child':{ pb:1.25 } }}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.75, mb:0.25 }}>
                        <Box sx={{ height:6, width:6, borderRadius:'50%', backgroundColor:color, flexShrink:0 }}/>
                        <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color, fontFamily:'Inter,sans-serif' }}>{label}</Typography>
                      </Box>
                      <Typography sx={{ fontSize:'0.6875rem', color:'rgba(235,235,245,0.35)', fontFamily:'Inter,sans-serif' }}>{new Date(ss.detectedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
