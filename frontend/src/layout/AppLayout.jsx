import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { IconClipboardList, IconShieldCheck, IconAlertTriangle, IconBug, IconUsers, IconDatabaseImport } from '@tabler/icons-react';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { path: '/rtm', label: 'RTM Tracker', icon: IconClipboardList, color: 'primary.main' },
  { path: '/iec62304', label: 'IEC 62304', icon: IconShieldCheck, color: 'success.main' },
  { path: '/iso14971', label: 'ISO 14971', icon: IconAlertTriangle, color: 'warning.main' },
  { path: '/fmea', label: 'Software FMEA', icon: IconBug, color: 'error.main' },
  { path: '/resources', label: 'Resources', icon: IconUsers, color: 'info.main' },
  { path: '/data-sources', label: 'Data Sources', icon: IconDatabaseImport, color: 'secondary.main' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconClipboardList size={28} color="#4678d8" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              Trace Hub
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
              RTM · IEC 62304 · ISO 14971
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon, color }) => {
            const active = location.pathname === path;
            return (
              <ListItemButton
                key={path}
                selected={active}
                onClick={() => navigate(path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '&:hover': { bgcolor: 'action.selected' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? color : 'text.secondary' }}>
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: active ? 600 : 400
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
      <Box component="main" sx={{ flex: 1, p: '28px 32px', overflow: 'auto', maxWidth: 1600, mx: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
