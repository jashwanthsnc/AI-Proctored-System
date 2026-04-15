import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Avatar,
  Box,
  Menu,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import { IconUser, IconLogout, IconSettings } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from './../../../slices/authSlice';
import { useLogoutMutation } from './../../../slices/usersApiSlice';

const Profile = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();

  const initials = userInfo?.name
    ? userInfo.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
    } catch (err) {
      // API call failed — still log out locally
    } finally {
      dispatch(logout());
      navigate('/auth/login');
    }
  };

  return (
    <Box>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.25 }}>
        <Avatar
          sx={{
            width: 28,
            height: 28,
            fontSize: '0.6875rem',
            fontWeight: 700,
            backgroundColor: '#0A84FF',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          {initials}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          mt: 0.5,
          '& .MuiMenu-paper': { width: '220px' },
        }}
      >
        <Box sx={{ px: 1.5, pt: 1, pb: 1.5 }}>
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
            {userInfo?.name}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.4)', mt: 0.25, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.005em' }}>
            {userInfo?.email}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(84,84,88,0.65)', mx: 1, mb: 0.5 }} />

        <MenuItem component={Link} to="/user/account" onClick={() => setAnchorEl(null)}>
          <ListItemIcon sx={{ minWidth: '30px', color: 'rgba(235,235,245,0.5)' }}>
            <IconUser size={15} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>Profile</ListItemText>
        </MenuItem>

        <MenuItem component={Link} to="/user/account" onClick={() => setAnchorEl(null)}>
          <ListItemIcon sx={{ minWidth: '30px', color: 'rgba(235,235,245,0.5)' }}>
            <IconSettings size={15} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>Settings</ListItemText>
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(84,84,88,0.65)', mx: 1, my: 0.5 }} />

        <MenuItem
          onClick={logoutHandler}
          sx={{ color: '#FF453A', '& .MuiListItemIcon-root': { color: '#FF453A' } }}
        >
          <ListItemIcon sx={{ minWidth: '30px' }}>
            <IconLogout size={15} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.9375rem', letterSpacing: '-0.01em', fontWeight: 500 }}>Sign Out</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Profile;
