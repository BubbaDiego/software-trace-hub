import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import ResourceDashboard from './ResourceDashboard';
import ProjectView from './ProjectView';
import PeopleDirectory from './PeopleDirectory';
import ResourceTimeline from './ResourceTimeline';

// ---------------------------------------------------------------------------
// FY26 Infusion Resource Planner
// ---------------------------------------------------------------------------
export default function ResourcesPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>RESOURCE</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.5px', color: '#4af', lineHeight: 1, ml: 0.5 }}>PLANNER</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
          Infusion Software &mdash; 59 people, 10 projects, 8 teams
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>FY26 Infusion Software Resources</strong> &mdash; Headcount: 50.5 FTE + 7.5 Contractors. Planning horizon: Mar 2026 &ndash;
        Feb 2027. 5 locations across US, India, France, Ireland.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Dashboard" />
          <Tab label="Project View" />
          <Tab label="People" />
          <Tab label="Timeline" />
        </Tabs>
      </Box>

      {tab === 0 && <ResourceDashboard />}
      {tab === 1 && <ProjectView />}
      {tab === 2 && <PeopleDirectory />}
      {tab === 3 && <ResourceTimeline />}
    </Box>
  );
}
