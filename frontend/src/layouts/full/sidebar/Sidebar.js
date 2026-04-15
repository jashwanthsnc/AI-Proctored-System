import { useMediaQuery, Box, Drawer, Typography } from '@mui/material';
import SidebarItems from './SidebarItems';

const Sidebar = (props) => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const sidebarWidth = '260px';

  const BrandLogo = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 2, gap: 1.5 }}>
      <Box sx={{
        width: 32,
        height: 32,
        borderRadius: '8px',
        background: '#0A84FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '0.75rem', letterSpacing: '-1px', fontFamily: 'Inter, sans-serif' }}>AP</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.2, fontFamily: 'Inter, sans-serif' }}>
          ATE-PROT
        </Typography>
        <Typography sx={{ fontWeight: 400, fontSize: '0.625rem', color: 'rgba(235,235,245,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
          Proctored Exams
        </Typography>
      </Box>
    </Box>
  );

  if (lgUp) {
    return (
      <Box sx={{ width: sidebarWidth, flexShrink: 0 }}>
        <Drawer
          anchor="left"
          open={props.isSidebarOpen}
          variant="permanent"
          PaperProps={{
            sx: {
              width: sidebarWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <BrandLogo />
            <Box sx={{ width: '90%', mx: 'auto', height: '0.5px', backgroundColor: 'rgba(84,84,88,0.65)' }} />
            <Box sx={{ flex: 1, overflow: 'auto', pt: 0.5 }}>
              <SidebarItems />
            </Box>
          </Box>
        </Drawer>
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={props.isMobileSidebarOpen}
      onClose={props.onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: sidebarWidth,
          boxShadow: '20px 0 60px rgba(0,0,0,0.8)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <BrandLogo />
        <Box sx={{ width: '90%', mx: 'auto', height: '0.5px', backgroundColor: 'rgba(84,84,88,0.65)' }} />
        <Box sx={{ flex: 1, overflow: 'auto', pt: 0.5 }}>
          <SidebarItems />
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
