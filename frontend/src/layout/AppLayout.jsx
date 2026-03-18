import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { IconClipboardList, IconShieldCheck, IconAlertTriangle, IconBug, IconUsers, IconDatabaseImport, IconFileAnalytics, IconLayoutGrid, IconWand, IconReportAnalytics, IconChartBar, IconFileExport, IconSitemap } from '@tabler/icons-react';

const DRAWER_WIDTH = 240;

const NAV_SECTIONS = [
  {
    header: 'Trace',
    items: [
      { path: '/rtm', label: 'RTM Tracker', icon: IconClipboardList, color: 'primary.main' },
      { path: '/sta', label: 'SW Traceability', icon: IconFileAnalytics, color: '#4af' },
      { path: '/features', label: 'Features', icon: IconLayoutGrid, color: '#f5a623' },
      { path: '/trace', label: 'Trace Wizard', icon: IconWand, color: '#4af' },
      { path: '/swdd', label: 'Detailed Design', icon: IconSitemap, color: '#a855f7' },
    ],
  },
  {
    header: 'Audit Support',
    items: [
      { path: '/iec62304', label: 'IEC 62304', icon: IconShieldCheck, color: 'success.main' },
      { path: '/iso14971', label: 'ISO 14971', icon: IconAlertTriangle, color: 'warning.main' },
      { path: '/fmea', label: 'Software FMEA', icon: IconBug, color: 'error.main' },
    ],
  },
  {
    header: 'Reports',
    items: [
      { path: '/reports/coverage', label: 'Coverage Summary', icon: IconReportAnalytics, color: 'text.secondary', disabled: true },
      { path: '/reports/gap', label: 'Gap Report', icon: IconChartBar, color: 'text.secondary', disabled: true },
      { path: '/reports/export', label: 'Export Package', icon: IconFileExport, color: 'text.secondary', disabled: true },
    ],
  },
  {
    header: 'Planning',
    items: [
      { path: '/resources', label: 'Resources', icon: IconUsers, color: 'info.main' },
      { path: '/data-sources', label: 'Data Sources', icon: IconDatabaseImport, color: 'secondary.main' },
    ],
  },
];

// ── Animated Orbitor (from Sonic10) ──────────────────────────────
function Orbitor({ size = 48 }) {
  const c = size / 2;
  const ringR = size * 0.36;
  const innerR = size * 0.27;
  const coreR = size * 0.2;
  const centerR = size * 0.08;
  const orbR = size * 0.44;
  const orbDotR = size * 0.05;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, display: 'block' }}>
      <circle cx={c} cy={c} r={coreR} fill="url(#coreGlow)" />
      <g>
        <animateTransform attributeName="transform" type="rotate" from={`0 ${c} ${c}`} to={`360 ${c} ${c}`} dur="10s" repeatCount="indefinite" />
        <path d={describeArc(c, c, ringR, 0, 180)} fill="none" stroke="#4af" strokeWidth="2" strokeLinecap="round" />
        <path d={describeArc(c, c, ringR, 180, 340)} fill="none" stroke="rgba(68,170,255,0.3)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from={`0 ${c} ${c}`} to={`-360 ${c} ${c}`} dur="14s" repeatCount="indefinite" />
        <path d={describeArc(c, c, innerR, 0, 140)} fill="none" stroke="rgba(168,85,247,0.5)" strokeWidth="1" strokeLinecap="round" />
      </g>
      <circle cx={c} cy={c} r={centerR} fill="#4af" />
      <g>
        <animateTransform attributeName="transform" type="rotate" from={`0 ${c} ${c}`} to={`360 ${c} ${c}`} dur="10s" repeatCount="indefinite" />
        <circle cx={c} cy={c - orbR} r={orbDotR} fill="#4af" />
      </g>
      <defs>
        <radialGradient id="coreGlow">
          <stop offset="0%" stopColor="rgba(68,170,255,0.15)" />
          <stop offset="60%" stopColor="rgba(68,170,255,0.03)" />
          <stop offset="100%" stopColor="rgba(68,170,255,0)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

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
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 0.5, userSelect: 'none' }}>
          <Orbitor size={42} />
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>
              TRACE
            </Typography>
            <Typography sx={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.5px', color: '#4af', lineHeight: 1 }}>
              HUB
            </Typography>
          </Box>
        </Box>
        <Divider />
        {NAV_SECTIONS.map((section, si) => (
          <Box key={section.header}>
            <Typography sx={{ px: 2, pt: si === 0 ? 1.5 : 1, pb: 0.5, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'text.secondary', userSelect: 'none' }}>
              {section.header}
            </Typography>
            <List sx={{ px: 1, pt: 0, pb: 0.5 }}>
              {section.items.map(({ path, label, icon: Icon, color, disabled }) => {
                const active = location.pathname === path;
                return (
                  <ListItemButton
                    key={path}
                    selected={active}
                    disabled={disabled}
                    onClick={() => !disabled && navigate(path)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.25,
                      py: 0.5,
                      opacity: disabled ? 0.4 : 1,
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                        '&:hover': { bgcolor: 'action.selected' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: active ? color : 'text.secondary' }}>
                      <Icon size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary={disabled ? `${label} (TBD)` : label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: active ? 600 : 400,
                        fontSize: '0.82rem',
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Drawer>
      <Box component="main" sx={{ flex: 1, p: '28px 32px', overflow: 'auto', maxWidth: 1600, mx: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
