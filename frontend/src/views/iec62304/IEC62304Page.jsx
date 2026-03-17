import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import PageTitle from 'components/PageTitle';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { IconClipboardList, IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import { useRtmProjects } from 'api/rtm';

import IecOverview from './IecOverview';
import IecClauseBreakdown from './IecClauseBreakdown';
import IecSafetyClasses from './IecSafetyClasses';
import IecGaps from './IecGaps';

// ---------------------------------------------------------------------------
// IEC 62304 — Software Lifecycle Process Compliance
// ---------------------------------------------------------------------------
export default function IEC62304Page() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [projectId, setProjectId] = useState(null);

  const { projects, loading: projLoading } = useRtmProjects();
  const activeId = projectId ?? projects?.[0]?.id ?? null;

  const activeProject = useMemo(() => projects?.find((p) => p.id === activeId) ?? null, [projects, activeId]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>IEC</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.5px', color: '#4af', lineHeight: 1, ml: 0.5 }}>62304</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Medical device software lifecycle processes
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <Tooltip title="RTM Tracker">
            <IconButton size="small" onClick={() => navigate('/rtm')} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              <IconClipboardList size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="ISO 14971 — Risk Management">
            <IconButton size="small" onClick={() => navigate('/iso14971')} sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}>
              <IconAlertTriangle size={20} />
            </IconButton>
          </Tooltip>
        </Box>
        {projects?.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Project</InputLabel>
            <Select value={activeId ?? ''} label="Project" onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.version ? `v${p.version}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>IEC 62304:2006+A1:2015</strong> — Defines requirements for software development, maintenance, risk management, configuration
        management, and problem resolution. Software safety classification determines rigor: <strong>Class A</strong> (no injury),{' '}
        <strong>Class B</strong> (non-serious injury), <strong>Class C</strong> (death/serious injury).
      </Alert>

      {!activeId && !projLoading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No RTM project loaded. Import a project on the RTM Tracker page first.
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Clause Breakdown" />
          <Tab label="Safety Classes" />
          <Tab label="Gaps & Actions" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tab === 0 && <IecOverview projectId={activeId} project={activeProject} />}
      {tab === 1 && <IecClauseBreakdown projectId={activeId} />}
      {tab === 2 && <IecSafetyClasses projectId={activeId} />}
      {tab === 3 && <IecGaps projectId={activeId} />}
    </Box>
  );
}
