import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import PageTitle from 'components/PageTitle';
import { useRtmProjects } from 'api/rtm';

import FeatureLandscape from './FeatureLandscape';
import FeatureHeatmap from './FeatureHeatmap';
import FeatureDetailExplorer from './FeatureDetailExplorer';
import FeatureGapDashboard from './FeatureGapDashboard';
import FeatureEvidenceMatrix from './FeatureEvidenceMatrix';

const TABS = [
  { label: 'Feature Landscape', color: '#4af' },
  { label: 'Feature × Module Heatmap', color: '#00d68f' },
  { label: 'Feature Detail Explorer', color: '#f5a623' },
  { label: 'Feature Gap Dashboard', color: '#ff4757' },
  { label: 'Feature Evidence Matrix', color: '#a855f7' },
];

export default function FeaturesPage() {
  const [tab, setTab] = useState(0);
  const { projects } = useRtmProjects();
  const activeProject = projects?.[0];
  const activeId = activeProject?.id;

  if (!activeProject) {
    return (
      <Box>
        <PageTitle bold="FEATURE" accent="TRACEABILITY" sub="Import an RTM project first via Data Sources." />
        <Alert severity="info" sx={{ maxWidth: 500 }}>No RTM project loaded.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
        <PageTitle bold="FEATURE" accent="TRACEABILITY" />
        <Chip label={activeProject.name || 'Project'} size="small" color="primary" variant="outlined" />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2.5,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.8rem', minHeight: 40 },
          '& .Mui-selected': { fontWeight: 600 },
        }}
      >
        {TABS.map((t, i) => (
          <Tab key={i} label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: t.color, opacity: tab === i ? 1 : 0.4 }} />
              {t.label}
            </Box>
          } />
        ))}
      </Tabs>

      {tab === 0 && <FeatureLandscape projectId={activeId} />}
      {tab === 1 && <FeatureHeatmap projectId={activeId} />}
      {tab === 2 && <FeatureDetailExplorer projectId={activeId} />}
      {tab === 3 && <FeatureGapDashboard projectId={activeId} />}
      {tab === 4 && <FeatureEvidenceMatrix projectId={activeId} />}
    </Box>
  );
}
