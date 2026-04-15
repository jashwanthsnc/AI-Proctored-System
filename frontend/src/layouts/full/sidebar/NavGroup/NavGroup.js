import PropTypes from 'prop-types';
import { ListSubheader, styled } from '@mui/material';

const NavGroup = ({ item }) => {
  const ListSubheaderStyle = styled((props) => <ListSubheader disableSticky {...props} />)(
    ({ theme }) => ({
      fontWeight: 600,
      fontSize: '0.6875rem',
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'rgba(235,235,245,0.35)',
      lineHeight: '24px',
      marginTop: theme.spacing(2.5),
      marginBottom: theme.spacing(0.5),
      padding: '0 12px',
      backgroundColor: 'transparent',
    }),
  );
  return <ListSubheaderStyle>{item.subheader}</ListSubheaderStyle>;
};

NavGroup.propTypes = {
  item: PropTypes.object,
};

export default NavGroup;
