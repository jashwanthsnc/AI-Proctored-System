import React, { useState, useMemo } from 'react';
import {
  Box, AppBar, Toolbar, styled, Stack, IconButton, Badge, Typography,
  Popover, Divider,
} from '@mui/material';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Profile from './Profile';
import { IconBellRinging, IconMenu, IconShieldOff, IconClipboardList, IconCheck } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useGetExamsQuery } from 'src/slices/examApiSlice';

const getExamStatus = (exam) => {
  const now = new Date();
  if (now < new Date(exam.liveDate)) return 'upcoming';
  if (now > new Date(exam.deadDate)) return 'ended';
  return 'live';
};

const Header = (props) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('readNotifIds') || '[]')); } catch { return new Set(); }
  });

  const { data: examsData } = useGetExamsQuery(undefined, { skip: !userInfo });

  const notifications = useMemo(() => {
    if (!examsData) return [];
    const notes = [];
    const now = new Date();
    examsData.forEach((exam) => {
      const status = getExamStatus(exam);
      const liveMs = new Date(exam.liveDate) - now;
      if (status === 'live') {
        notes.push({ id: `live-${exam.examId}`, type: 'live', color: '#30D158', bg: 'rgba(48,209,88,0.1)', icon: IconShieldOff, title: `${exam.examName} is Live`, body: 'Exam is currently in progress', time: new Date(exam.liveDate) });
      } else if (status === 'upcoming' && liveMs < 24 * 60 * 60 * 1000) {
        const hrs = Math.floor(liveMs / 3600000);
        const mins = Math.floor((liveMs % 3600000) / 60000);
        notes.push({ id: `upcoming-${exam.examId}`, type: 'upcoming', color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)', icon: IconClipboardList, title: `${exam.examName} starts soon`, body: hrs > 0 ? `Starts in ${hrs}h ${mins}m` : `Starts in ${mins} minutes`, time: new Date(exam.liveDate) });
      }
    });
    return notes.sort((a, b) => b.time - a.time).slice(0, 8);
  }, [examsData]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const newSet = new Set(notifications.map((n) => n.id));
    setReadIds(newSet);
    localStorage.setItem('readNotifIds', JSON.stringify([...newSet]));
  };

  const markRead = (id) => {
    const newSet = new Set([...readIds, id]);
    setReadIds(newSet);
    localStorage.setItem('readNotifIds', JSON.stringify([...newSet]));
  };

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    backgroundColor: 'rgba(0,0,0,0.72)',
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    borderBottom: '0.5px solid rgba(84,84,88,0.65)',
    justifyContent: 'center',
    [theme.breakpoints.up('lg')]: { minHeight: '52px' },
  }));

  const ToolbarStyled = styled(Toolbar)(() => ({
    width: '100%',
    minHeight: '52px !important',
    padding: '0 16px',
  }));

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        <IconButton
          onClick={props.toggleMobileSidebar}
          sx={{ display: { lg: 'none', xs: 'flex' }, color: 'rgba(235,235,245,0.6)', mr: 1 }}
        >
          <IconMenu width="18" height="18" />
        </IconButton>

        <Box flexGrow={1} />

        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Notification Bell */}
          <IconButton
            size="small"
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            sx={{ color: 'rgba(235,235,245,0.6)', width: 32, height: 32, borderRadius: '10px', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' } }}
          >
            <Badge
              badgeContent={unreadCount || null}
              sx={{ '& .MuiBadge-badge': { backgroundColor: '#FF453A', color: '#fff', minWidth: '14px', height: '14px', fontSize: '0.5625rem', top: 2, right: 2 } }}
            >
              <IconBellRinging size="16" stroke="2" />
            </Badge>
          </IconButton>

          {/* Notification Popover */}
          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                backgroundColor: '#1C1C1E',
                border: '0.5px solid rgba(255,255,255,0.12)',
                borderRadius: '16px',
                boxShadow: '0 32px 64px rgba(0,0,0,0.8)',
                width: 340,
                mt: 1,
                overflow: 'hidden',
              },
            }}
          >
            {/* Header */}
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(84,84,88,0.45)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Notifications</Typography>
                {unreadCount > 0 && (
                  <Box sx={{ backgroundColor: '#FF453A', borderRadius: '20px', px: 0.75, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>{unreadCount}</Typography>
                  </Box>
                )}
              </Box>
              {unreadCount > 0 && (
                <Box onClick={markAllRead} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: '#0A84FF', '&:hover': { opacity: 0.8 } }}>
                  <IconCheck size={13} />
                  <Typography sx={{ fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Mark all read</Typography>
                </Box>
              )}
            </Box>

            {/* Notifications list */}
            <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif' }}>No notifications</Typography>
                </Box>
              ) : (
                notifications.map((n, i) => {
                  const Icon = n.icon;
                  const isRead = readIds.has(n.id);
                  return (
                    <Box key={n.id}>
                      <Box
                        onClick={() => markRead(n.id)}
                        sx={{
                          px: 2.5, py: 1.75, display: 'flex', gap: 1.5, cursor: 'pointer',
                          backgroundColor: isRead ? 'transparent' : 'rgba(10,132,255,0.04)',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' },
                          transition: 'background 0.15s',
                        }}
                      >
                        <Box sx={{ width: 34, height: 34, borderRadius: '9px', backgroundColor: n.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                          <Icon size={16} color={n.color} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.8125rem', fontWeight: isRead ? 400 : 600, color: isRead ? 'rgba(235,235,245,0.7)' : '#FFFFFF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                              {n.title}
                            </Typography>
                            {!isRead && <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#0A84FF', flexShrink: 0, mt: 0.5 }} />}
                          </Box>
                          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', mt: 0.25 }}>{n.body}</Typography>
                          <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.25)', fontFamily: 'Inter, sans-serif', mt: 0.5 }}>
                            {n.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {n.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>
                      {i < notifications.length - 1 && <Divider sx={{ borderColor: 'rgba(84,84,88,0.3)' }} />}
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Footer */}
            <Box sx={{ px: 2.5, py: 1.5, borderTop: '0.5px solid rgba(84,84,88,0.45)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                Notifications are based on your current exams
              </Typography>
            </Box>
          </Popover>

          {/* User name pill */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.75, px: 1.5, py: 0.625, borderRadius: '10px', border: '0.5px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#30D158', boxShadow: '0 0 5px #30D158' }} />
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(235,235,245,0.85)', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
              {_.startCase(userInfo?.name || '')}
            </Typography>
          </Box>

          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
