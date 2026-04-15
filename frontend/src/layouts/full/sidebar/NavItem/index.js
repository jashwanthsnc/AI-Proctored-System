import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  ListItemIcon,
  ListItem,
  List,
  styled,
  ListItemText,
  useTheme,
} from '@mui/material';

const NavItem = ({ item, level, pathDirect, onClick }) => {
  const Icon = item.icon;
  const theme = useTheme();
  const itemIcon = <Icon stroke={1.5} size="1.1rem" />;

  const ListItemStyled = styled(ListItem)(() => ({
    whiteSpace: 'nowrap',
    marginBottom: '1px',
    padding: '7px 10px',
    borderRadius: '12px',
    backgroundColor: level > 1 ? 'transparent !important' : 'inherit',
    color: 'rgba(235,235,245,0.55)',
    paddingLeft: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.06)',
      color: 'rgba(235,235,245,0.9)',
    },
    '&.Mui-selected': {
      color: '#FFFFFF',
      backgroundColor: 'rgba(10,132,255,0.15)',
      '&:hover': {
        backgroundColor: 'rgba(10,132,255,0.2)',
        color: '#FFFFFF',
      },
    },
  }));

  return (
    <List component="li" disablePadding key={item.id}>
      <ListItemStyled
        button
        component={item.external ? 'a' : NavLink}
        to={item.href}
        href={item.external ? item.href : ''}
        disabled={item.disabled}
        selected={pathDirect === item.href}
        target={item.external ? '_blank' : ''}
        onClick={onClick}
      >
        <ListItemIcon
          sx={{
            minWidth: '34px',
            p: '2px 0',
            color: 'inherit',
            opacity: pathDirect === item.href ? 1 : 0.7,
          }}
        >
          {itemIcon}
        </ListItemIcon>
        <ListItemText
          primaryTypographyProps={{
            fontSize: '0.875rem',
            fontWeight: pathDirect === item.href ? 600 : 400,
            letterSpacing: '-0.01em',
          }}
        >
          <>{item.title}</>
        </ListItemText>
      </ListItemStyled>
    </List>
  );
};

NavItem.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number,
  pathDirect: PropTypes.any,
};

export default NavItem;
