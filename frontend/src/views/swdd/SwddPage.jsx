import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import PageTitle from 'components/PageTitle';
import { useSwddSummary } from 'api/swdd';

import SwddCrossRefs from './SwddCrossRefs';
import SwddUnitExplorer from './SwddUnitExplorer';

const TABS = [
  { label: 'Cross-Reference Matrix', color: '#a855f7' },
  { label: 'Unit Explorer', color: '#ff4757' },
];

export default function SwddPage() {
  const [tab, setTab] = useState(0);
  const { summary } = useSwddSummary();

  if (summary && !summary.imported) {
    return (
      <Box>
        <PageTitle bold="DETAILED" accent="DESIGN" sub="Import the SW Detailed Design .docx via Data Sources." />
        <Alert severity="info" sx={{ maxWidth: 600 }}>
          No SWDD document loaded. Go to Data Sources and upload the SW Detailed Design .docx file.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
        <PageTitle bold="DETAILED" accent="DESIGN" />
        <Chip label="IEC 62304 §5.4" size="small" sx={{ bgcolor: 'rgba(245,166,35,.12)', color: '#f5a623', fontWeight: 600, fontSize: '0.7rem' }} />
        {summary && (
          <>
            <Chip label={`${summary.items} Items`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            <Chip label={`${summary.units} Units`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
          </>
        )}
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
          <Tab key={i} label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: t.color, opacity: tab === i ? 1 : 0.4 }} />
              {t.label}
            </Box>
          } />
        ))}
      </Tabs>

      {tab === 0 && <SwddCrossRefs />}
      {tab === 1 && <SwddUnitExplorer />}
    </Box>
  );
}
