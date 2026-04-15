import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { IconClock, IconClipboardList, IconArrowRight, IconCalendar, IconCalendarOff, IconHourglass } from '@tabler/icons-react';

const getStatus = (liveDate, deadDate) => {
  const now = new Date();
  if (now < new Date(liveDate)) return { label: 'Upcoming', color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)' };
  if (now > new Date(deadDate)) return { label: 'Ended', color: 'rgba(235,235,245,0.4)', bg: 'rgba(255,255,255,0.06)' };
  return { label: 'Live', color: '#30D158', bg: 'rgba(48,209,88,0.12)' };
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const pad = (n) => String(n).padStart(2, '0');
const formatCountdown = (ms) => {
  if (ms <= 0) return 'Starting…';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

const formatTimeLeft = (ms) => {
  if (ms <= 0) return 'Ending soon';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${pad(m)}m left`;
  if (m > 0) return `${pad(m)}m ${pad(s)}s left`;
  return `${pad(s)}s left`;
};

export default function ExamCard({ exam }) {
  const { examName, duration, totalQuestions, examId, liveDate, deadDate, description } = exam;
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === 'teacher';
  const navigate = useNavigate();
  const status = getStatus(liveDate, deadDate);
  const isLive = status.label === 'Live';
  const isUpcoming = status.label === 'Upcoming';
  const isEnded = status.label === 'Ended';

  const [countdown, setCountdown] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Countdown for upcoming exams
  useEffect(() => {
    if (!isUpcoming) return;
    const update = () => setCountdown(formatCountdown(new Date(liveDate) - new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isUpcoming, liveDate]);

  // Time remaining for live exams
  useEffect(() => {
    if (!isLive) return;
    const update = () => setTimeLeft(formatTimeLeft(new Date(deadDate) - new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isLive, deadDate]);

  const handleCardClick = () => {
    if (isTeacher) { toast.error('Teachers cannot take exams'); return; }
    if (!isLive) { toast.warning('This exam is not currently active'); return; }
    navigate(`/exam/${examId}`);
  };

  return (
    <Box
      onClick={handleCardClick}
      sx={{
        backgroundColor: '#1C1C1E',
        border: isLive ? '0.5px solid rgba(48,209,88,0.25)' : '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        p: 2.5,
        cursor: isLive && !isTeacher ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': isLive && !isTeacher ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 32px rgba(10,132,255,0.12)',
          border: '0.5px solid rgba(10,132,255,0.3)',
        } : {},
      }}
    >
      {/* Subtle gradient accent for live exams */}
      {isLive && (
        <Box sx={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle, rgba(48,209,88,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '10px',
          background: isLive ? 'linear-gradient(135deg, #30D158, #0A84FF)' : isUpcoming ? 'linear-gradient(135deg, #FF9F0A, #FF6B00)' : 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconClipboardList size={20} color="#fff" stroke={1.75} />
        </Box>
        <Box sx={{ backgroundColor: status.bg, borderRadius: '20px', px: 1.25, py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isLive && (
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#30D158', boxShadow: '0 0 6px #30D158', animation: 'pulse 1.5s infinite' }} />
            )}
            <Typography sx={{ fontSize: '0.75rem', color: status.color, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              {status.label}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Name */}
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif', lineHeight: 1.3, mb: 0.5 }}>
          {examName}
        </Typography>
        {description ? (
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI-Proctored Exam
          </Typography>
        )}
      </Box>

      {/* Meta row */}
      <Stack direction="row" spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <IconClipboardList size={13} color="rgba(235,235,245,0.35)" />
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif' }}>
            {totalQuestions} questions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <IconClock size={13} color="rgba(235,235,245,0.35)" />
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif' }}>
            {duration} min
          </Typography>
        </Box>
      </Stack>

      {/* Countdown / Time Left pill */}
      {isUpcoming && countdown && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(255,159,10,0.1)', borderRadius: '10px', px: 1.5, py: 0.75 }}>
          <IconHourglass size={13} color="#FF9F0A" />
          <Typography sx={{ fontSize: '0.75rem', color: '#FF9F0A', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            Starts in {countdown}
          </Typography>
        </Box>
      )}
      {isLive && timeLeft && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(48,209,88,0.08)', borderRadius: '10px', px: 1.5, py: 0.75 }}>
          <IconClock size={13} color="#30D158" />
          <Typography sx={{ fontSize: '0.75rem', color: '#30D158', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            {timeLeft}
          </Typography>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(84,84,88,0.45)' }} />

      {/* Dates */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconCalendar size={13} color="rgba(235,235,245,0.3)" />
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>
            Opens{' '}
            <span style={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500 }}>
              {fmtDate(liveDate)} at {fmtTime(liveDate)}
            </span>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconCalendarOff size={13} color="rgba(235,235,245,0.3)" />
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.35)', fontFamily: 'Inter, sans-serif' }}>
            Closes{' '}
            <span style={{ color: 'rgba(235,235,245,0.6)', fontWeight: 500 }}>
              {fmtDate(deadDate)} at {fmtTime(deadDate)}
            </span>
          </Typography>
        </Box>
      </Box>

      {/* CTA */}
      {isLive && !isTeacher && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#0A84FF' }}>
            Start Exam
          </Typography>
          <IconArrowRight size={14} color="#0A84FF" />
        </Box>
      )}
      {isUpcoming && !isTeacher && (
        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', color: '#FF9F0A', fontWeight: 500 }}>
          Not yet available
        </Typography>
      )}
      {isEnded && (
        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', color: 'rgba(235,235,245,0.3)', fontWeight: 500 }}>
          This exam has ended
        </Typography>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </Box>
  );
}
