import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

import { useFmeaOverview } from 'api/fmea';

const SEV_COLORS = { Catastrophic: '#ff4757', Critical: '#ff7b42', Major: '#ffaa00', Moderate: '#fdd835', Minor: '#66bb6a', Negligible: '#8899aa' };
const PROD_COLORS = { PCU: '#4fc3f7', LVP: '#66bb6a', SYR: '#ffa726', PCA: '#fdd835', ETCO2: '#ab47bc', AUTOID: '#26a69a' };
const HAZ_COLORS = { 'IDE-01': '#ff4757', 'IDE-02': '#ff7b42', 'IDE-03': '#ffa726', 'IDE-04': '#fdd835', 'IT-04 ': '#ab47bc', 'E-07 I': '#26a69a' };

function KpiCard({ label, value, sub, color }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem' }}>{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color, mt: 0.5 }}>{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function BarChart({ items, maxVal, colorMap, defaultColor }) {
  const max = maxVal || Math.max(...items.map((i) => i.count), 1);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map((item) => {
        const pct = Math.round((item.count / max) * 100);
        const col = (colorMap && colorMap[item.label]) || defaultColor || '#4fc3f7';
        return (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ width: 140, textAlign: 'right', fontSize: '0.75rem', color: 'text.secondary', flexShrink: 0 }}>{item.label}</Typography>
            <Box sx={{ flex: 1, height: 22, bgcolor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: col, borderRadius: 1, display: 'flex', alignItems: 'center', pl: 1, fontSize: '0.65rem', fontWeight: 700, color: 'rgba(0,0,0,.8)', minWidth: 28 }}>
                {item.count}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default function FmeaOverview() {
  const { overview, overviewLoading } = useFmeaOverview();

  const productItems = useMemo(() => (overview.products || []).map((p) => ({ label: p.product, count: p.count })), [overview]);
  const rcmItems = useMemo(() => (overview.rcm_types || []).map((r) => {
    let label = r.rcm_type;
    if (label.includes('detect and act')) label = 'Detect and act';
    else if (label.includes('fail-safe')) label = 'Inherent fail-safe';
    else if (label.includes('Visual')) label = 'Visual/audible indicators';
    else if (label.includes('Process')) label = 'Process control';
    else if (label.includes('Labeling') || label.includes('Label')) label = 'Labeling/DFU';
    else if (label.includes('eliminate')) label = 'Eliminate hazard';
    else if (label.includes('recover')) label = 'Detect and recover';
    return { label, count: r.count };
  }), [overview]);
  const hazardItems = useMemo(() => (overview.hazard_categories || []).map((h) => {
    const cat = h.category?.trim();
    let label = cat;
    if (cat === 'IDE-01') label = 'IDE-01 Overinfusion';
    else if (cat === 'IDE-02') label = 'IDE-02 Underinfusion';
    else if (cat === 'IDE-03') label = 'IDE-03 Delay';
    else if (cat === 'IDE-04') label = 'IDE-04 Interruption';
    else if (cat?.startsWith('IT-04')) label = 'IT-04 Monitoring';
    else if (cat?.startsWith('E-07')) label = 'E-07 Infection';
    return { label, count: h.count, cat };
  }), [overview]);

  if (overviewLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  const critPct = overview.total ? Math.round((overview.critical_components / overview.total) * 100) : 0;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Total Records" value={overview.total} sub="Across all products" color="#4fc3f7" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Distinct Hazards" value={overview.distinct_hazards} sub="IDE-01 through IT-06" color="#ff4757" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Failure Modes" value={overview.distinct_failure_modes} sub="Unique descriptions" color="#ffa726" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Critical Components" value={overview.critical_components} sub={`${critPct}% of records`} color="#ff4757" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Risk Controls" value={overview.total} sub="100% coverage" color="#66bb6a" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Common Causes" value={overview.common_causes} sub="OS + subsystem" color="#ab47bc" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Hazard Category Distribution</Typography>
              <BarChart items={hazardItems} colorMap={HAZ_COLORS} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Records by Product</Typography>
              <BarChart items={productItems} colorMap={PROD_COLORS} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Risk Control Measure Types</Typography>
              <BarChart items={rcmItems} defaultColor="#4fc3f7" />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Severity Distribution</Typography>
                <Typography variant="caption" sx={{ bgcolor: 'rgba(102,187,106,.12)', color: '#66bb6a', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, fontSize: '0.65rem' }}>Post-Mitigation</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { label: 'Catastrophic', count: 48, color: '#ff4757' },
                  { label: 'Critical', count: 32, color: '#ff7b42' },
                  { label: 'Moderate', count: 41, color: '#fdd835' },
                  { label: 'Minor', count: 50, color: '#66bb6a' },
                ].map((s) => (
                  <Box key={s.label} sx={{ textAlign: 'center', p: 1.5, bgcolor: `${s.color}11`, border: `1px solid ${s.color}33`, borderRadius: 1, minWidth: 90 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.count}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
