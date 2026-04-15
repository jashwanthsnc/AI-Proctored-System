import React, { useState, useMemo } from 'react';
import { Grid, Typography, Box, CircularProgress, InputAdornment, TextField, Stack } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import ExamCard from './ExamCard';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { IconBook, IconSearch, IconEye, IconCalendar, IconCalendarOff, IconListCheck } from '@tabler/icons-react';

const getStatus = (liveDate, deadDate) => {
  const now = new Date();
  if (now < new Date(liveDate)) return 'upcoming';
  if (now > new Date(deadDate)) return 'ended';
  return 'live';
};

const FILTERS = [
  { key: 'all',      label: 'All',      icon: IconListCheck  },
  { key: 'live',     label: 'Live',     icon: IconEye        },
  { key: 'upcoming', label: 'Upcoming', icon: IconCalendar   },
  { key: 'ended',    label: 'Ended',    icon: IconCalendarOff},
];

const FILTER_COLORS = { live: '#30D158', upcoming: '#FF9F0A', ended: 'rgba(235,235,245,0.3)', all: '#0A84FF' };

const Exams = () => {
  const { data: userExams, isLoading, isError, error } = useGetExamsQuery();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const counts = useMemo(() => {
    if (!userExams) return { live: 0, upcoming: 0, ended: 0, all: 0 };
    const c = { live: 0, upcoming: 0, ended: 0 };
    userExams.forEach(e => { c[getStatus(e.liveDate, e.deadDate)]++; });
    return { ...c, all: userExams.length };
  }, [userExams]);

  const filtered = useMemo(() => {
    if (!userExams) return [];
    return userExams
      .filter(e => activeFilter === 'all' || getStatus(e.liveDate, e.deadDate) === activeFilter)
      .filter(e => search === '' || e.examName.toLowerCase().includes(search.toLowerCase()) || (e.description || '').toLowerCase().includes(search.toLowerCase()));
  }, [userExams, activeFilter, search]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0A84FF' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ backgroundColor: 'rgba(255,69,58,0.1)', border: '0.5px solid rgba(255,69,58,0.3)', borderRadius: '12px', p: 3, mt: 2 }}>
        <Typography sx={{ color: '#FF453A', fontFamily: 'Inter, sans-serif' }}>
          {error?.data?.message || 'Failed to load exams'}
        </Typography>
      </Box>
    );
  }

  return (
    <PageContainer title="Exams">
      <Box sx={{ pb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
            My Exams
          </Typography>
          <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.45)', mt: 0.75, fontFamily: 'Inter, sans-serif' }}>
            {userExams?.length ? `${userExams.length} exam${userExams.length !== 1 ? 's' : ''} assigned` : 'No exams assigned yet'}
          </Typography>
        </Box>

        {/* Stats strip */}
        {userExams && userExams.length > 0 && (
          <Stack direction="row" spacing={2} mb={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {[['live', '#30D158', 'Live Now'], ['upcoming', '#FF9F0A', 'Upcoming'], ['ended', 'rgba(235,235,245,0.3)', 'Ended']].map(([key, color, label]) => (
              <Box key={key} sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                {key === 'live' && <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#30D158', boxShadow: '0 0 6px #30D158', animation: 'pulse 1.5s infinite' }} />}
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>{counts[key]}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' }}>{label}</Typography>
              </Box>
            ))}
          </Stack>
        )}

        {/* Filter + Search */}
        {userExams && userExams.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            {/* Filter tabs */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {FILTERS.map(({ key, label, icon: Icon }) => {
                const active = activeFilter === key;
                const color = FILTER_COLORS[key];
                return (
                  <Box key={key} onClick={() => setActiveFilter(key)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.75, borderRadius: '10px', cursor: 'pointer',
                      backgroundColor: active ? `${color}18` : 'transparent',
                      border: active ? `0.5px solid ${color}40` : '0.5px solid transparent',
                      transition: 'all 0.12s ease',
                      '&:hover': { backgroundColor: `${color}12` },
                    }}>
                    <Icon size={14} color={active ? color : 'rgba(235,235,245,0.4)'} />
                    <Typography sx={{ fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif', fontWeight: active ? 600 : 400, color: active ? color : 'rgba(235,235,245,0.5)' }}>
                      {label}
                    </Typography>
                    <Box sx={{ backgroundColor: active ? `${color}30` : 'rgba(255,255,255,0.06)', borderRadius: '20px', px: 0.75, py: 0.1 }}>
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: active ? color : 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>
                        {counts[key]}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Search */}
            <TextField
              placeholder="Search exams…" size="small" value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconSearch size={14} color="rgba(235,235,245,0.4)" /></InputAdornment>,
                sx: {
                  backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8125rem', color: '#FFFFFF',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1) !important' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2) !important' },
                  '& input': { color: '#FFFFFF', py: 0.75 },
                  '& input::placeholder': { color: 'rgba(235,235,245,0.35)' },
                },
              }}
              sx={{ width: 230 }}
            />
          </Box>
        )}

        {/* No exams empty state */}
        {!userExams || userExams.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', textAlign: 'center' }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <IconBook size={32} color="rgba(235,235,245,0.25)" />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1.0625rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', mb: 0.75 }}>
              No Exams Assigned
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif' }}>
              Please contact your teacher to get access to exams.
            </Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <IconSearch size={24} color="rgba(235,235,245,0.2)" />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', mb: 0.5 }}>
              No exams match
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.25)', fontFamily: 'Inter, sans-serif' }}>
              Try a different filter or search term
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filtered.map((exam) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={exam._id}>
                <ExamCard exam={exam} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </PageContainer>
  );
};

export default Exams;
