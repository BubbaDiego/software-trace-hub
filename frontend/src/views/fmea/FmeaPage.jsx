import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import FmeaOverview from './FmeaOverview';
import FmeaRiskMatrix from './FmeaRiskMatrix';
import FmeaExplorer from './FmeaExplorer';
import FmeaByProduct from './FmeaByProduct';
import FmeaCommonCauses from './FmeaCommonCauses';

import { useFmeaOverview } from 'api/fmea';

const TABS = ['Executive Overview', 'Risk Matrix', 'Failure Mode Explorer', 'By Product', 'Common Causes'];

export default function FmeaPage() {
  const [tab, setTab] = useState(0);
  const { overview, overviewLoading } = useFmeaOverview();

  const empty = !overviewLoading && (!overview.total || overview.total === 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>SOFTWARE</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.5px', color: '#4af', lineHeight: 1, ml: 0.5 }}>FMEA</Typography>
        </Box>
        {overview.total > 0 && (
          <>
            <Typography variant="caption" sx={{ bgcolor: 'error.main', color: '#fff', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, fontSize: '0.7rem' }}>
              {overview.total} Records
            </Typography>
            <Typography variant="caption" sx={{ bgcolor: 'warning.main', color: '#000', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, fontSize: '0.7rem' }}>
              {overview.distinct_hazards} Hazards
            </Typography>
          </>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
        Failure Mode &amp; Effects Analysis — Alaris v12.6 Embedded Software
      </Typography>

      {empty && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No FMEA data loaded. Go to <strong>Data Sources</strong> to upload a Software FMEA Excel file.
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {tab === 0 && <FmeaOverview />}
      {tab === 1 && <FmeaRiskMatrix />}
      {tab === 2 && <FmeaExplorer />}
      {tab === 3 && <FmeaByProduct />}
      {tab === 4 && <FmeaCommonCauses />}
    </Box>
  );
}
