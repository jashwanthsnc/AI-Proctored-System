import React from 'react';
import { Box, Typography, Chip, Grid, Button } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import CheatingTable from './components/CheatingTable';
import { IconShieldOff, IconCamera, IconAlertTriangle, IconEye, IconMicrophone, IconDeviceMobile, IconDownload } from '@tabler/icons-react';
import { toast } from 'react-toastify';

const DETECTION_FEATURES = [
  { icon: IconEye,          label: 'Face Detection',   desc: 'No face / multiple faces',  color: '#BF5AF2' },
  { icon: IconDeviceMobile, label: 'Device Detection',  desc: 'Phones & prohibited items', color: '#FF453A' },
  { icon: IconCamera,       label: 'Gaze Tracking',     desc: 'Eye direction monitoring',  color: '#30D158' },
  { icon: IconAlertTriangle,label: 'Tab Monitoring',    desc: 'Tab & window switches',     color: '#0A84FF' },
  { icon: IconMicrophone,   label: 'Audio Analysis',    desc: 'Background noise detection',color: '#FF9F0A' },
  { icon: IconShieldOff,    label: 'Lockdown Events',   desc: 'Browser security triggers', color: '#FF453A' },
];

const ExamLogPage = () => {
  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/users/cheatingLogs/export', { credentials: 'include' });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `violations_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Violations exported successfully');
    } catch {
      toast.error('Failed to export violations');
    }
  };

  return (
    <PageContainer title="Exam Logs">
      <Box sx={{ pb: 4 }}>
        {/* ── Header ── */}
        <Box sx={{ mb: 4, pb: 3, borderBottom: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '11px', background: 'linear-gradient(135deg, #FF453A, #FF9F0A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconShieldOff size={20} color="#fff" />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.875rem', color: '#FFFFFF', letterSpacing: '-0.045em', fontFamily: 'Inter, sans-serif', lineHeight: 1.1 }}>
                Violation Logs
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.4)', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif', ml: 7 }}>
              AI proctoring violations, risk scores and screenshots per exam
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              icon={<IconCamera size={13} />}
              label="AI Vision Active"
              size="small"
              sx={{ backgroundColor: 'rgba(10,132,255,0.1)', border: '0.5px solid rgba(10,132,255,0.25)', color: '#0A84FF', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600, '& .MuiChip-icon': { color: '#0A84FF' } }}
            />
            <Chip
              label="10 Detection Types"
              size="small"
              sx={{ backgroundColor: 'rgba(48,209,88,0.08)', border: '0.5px solid rgba(48,209,88,0.2)', color: '#30D158', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600 }}
            />
            <Button
              onClick={handleExportCSV}
              startIcon={<IconDownload size={14} />}
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(235,235,245,0.8)', borderRadius: '980px', px: 2, py: 0.75, fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', textTransform: 'none', border: '0.5px solid rgba(255,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.11)' } }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* ── Detection Features Overview ── */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(235,235,245,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2, fontFamily: 'Inter, sans-serif' }}>
            Active Detection Systems
          </Typography>
          <Grid container spacing={1.5}>
            {DETECTION_FEATURES.map(({ icon: Icon, label, desc, color }) => (
              <Grid item xs={12} sm={6} lg={4} key={label}>
                <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', p: 1.75, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '9px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} color={color} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#EBEBF5', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>{desc}</Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#30D158', flexShrink: 0, boxShadow: '0 0 6px rgba(48,209,88,0.6)' }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <CheatingTable />
      </Box>
    </PageContainer>
  );
};

export default ExamLogPage;
