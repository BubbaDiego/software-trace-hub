import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PageTitle from 'components/PageTitle';
import { useRtmProjects } from 'api/rtm';
import { useStaSummary } from 'api/sta';

import StaOverview from './StaOverview';
import StaSpecRefs from './StaSpecRefs';
import StaDesignOutputs from './StaDesignOutputs';
import StaUnitTests from './StaUnitTests';
import StaVersions from './StaVersions';

const TABS = [
  { label: 'Executive Overview', color: '#4af' },
  { label: 'Spec Reference Matrix', color: '#00d68f' },
  { label: 'Design Output Traceability', color: '#f5a623' },
  { label: 'Unit Test Coverage', color: '#a855f7' },
  { label: 'Version Verification', color: '#ff4757' },
];

export default function STAPage() {
  const [tab, setTab] = useState(0);
  const { projects } = useRtmProjects();
  const activeProject = projects?.[0];
  const activeId = activeProject?.id;
  const { staSummary } = useStaSummary(activeId);

  if (!activeProject) {
    return (
      <Box>
        <PageTitle bold="SOFTWARE" accent="TRACEABILITY" sub="Import an RTM project first, then enrich with STA data." />
        <Alert severity="info" sx={{ maxWidth: 500 }}>
          No RTM project loaded. Go to Data Sources to import one.
        </Alert>
      </Box>
    );
  }

  if (!staSummary?.enriched) {
    return (
      <Box>
        <PageTitle bold="SOFTWARE" accent="TRACEABILITY" sub="Alaris System v12.6 — Software Traceability Analysis" />
        <Alert severity="warning" sx={{ maxWidth: 600 }}>
          STA data has not been imported yet. Go to Data Sources and load the STA enrichment for this project.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
        <PageTitle bold="SOFTWARE" accent="TRACEABILITY" />
        <Chip label={activeProject.name || 'Alaris v12.6'} size="small" color="primary" variant="outlined" />
        <Chip label="Safety Class C" size="small" sx={{ bgcolor: 'rgba(245,166,35,.12)', color: '#f5a623', fontWeight: 600, fontSize: '0.7rem' }} />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 2.5,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.8rem', minHeight: 40 },
          '& .Mui-selected': { fontWeight: 600 },
        }}
      >
        {TABS.map((t, i) => (
          <Tab
            key={i}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: t.color, opacity: tab === i ? 1 : 0.4 }} />
                {t.label}
              </Box>
            }
          />
        ))}
      </Tabs>

      {tab === 0 && <StaOverview projectId={activeId} />}
      {tab === 1 && <StaSpecRefs projectId={activeId} />}
      {tab === 2 && <StaDesignOutputs projectId={activeId} />}
      {tab === 3 && <StaUnitTests projectId={activeId} />}
      {tab === 4 && <StaVersions projectId={activeId} />}
    </Box>
  );
}
