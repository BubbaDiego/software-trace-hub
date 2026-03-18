import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import { useFeatureGaps } from 'api/rtm';

const GAP_COLORS = { no_tests: '#ff4757', manual_only: '#f5a623', no_spec: '#4af', scenario_gap: '#a855f7' };
const GAP_LABELS = { no_tests: 'No Tests', manual_only: 'Manual Only', no_spec: 'No Spec', scenario_gap: 'Scenario Gap' };

function KpiCard({ label, value, sub, color }) {
  return (
    <Card sx={{ height: '100%', borderTop: `2px solid ${color}` }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mt: 0.5 }}>{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function useChart(ref, config, deps) {
  useEffect(() => {
    if (!ref.current || !deps) return;
    let chart;
    import('chart.js/auto').then(({ default: Chart }) => { chart = new Chart(ref.current, config); });
    return () => chart?.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(deps)]);
}

export default function FeatureGapDashboard({ projectId }) {
  const { gapData, loading } = useFeatureGaps(projectId);
  const donutRef = useRef(null);
  const barRef = useRef(null);

  const gd = gapData || {};
  const items = gd.items || [];
  const totals = gd.totals || {};
  const totalGaps = Object.values(totals).reduce((s, v) => s + v, 0);

  useChart(donutRef, {
    type: 'doughnut',
    data: {
      labels: Object.keys(totals).map(k => GAP_LABELS[k] || k),
      datasets: [{ data: Object.values(totals), backgroundColor: Object.keys(totals).map(k => GAP_COLORS[k] || '#555'), borderWidth: 0 }]
    },
    options: {
      cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyleWidth: 8, padding: 14, color: '#8b90a8', font: { size: 11 } } } }
    }
  }, totals);

  useChart(barRef, {
    type: 'bar',
    data: {
      labels: items.slice(0, 15).map(f => f.feature.length > 20 ? f.feature.slice(0, 18) + '…' : f.feature),
      datasets: [
        { label: 'No Tests', data: items.slice(0, 15).map(f => f.no_tests), backgroundColor: '#ff4757', borderRadius: 2 },
        { label: 'Manual Only', data: items.slice(0, 15).map(f => f.manual_only), backgroundColor: '#f5a623', borderRadius: 2 },
        { label: 'No Spec', data: items.slice(0, 15).map(f => f.no_spec), backgroundColor: '#4af', borderRadius: 2 },
        { label: 'Scenario Gap', data: items.slice(0, 15).map(f => f.scenario_gap), backgroundColor: '#a855f7', borderRadius: 2 },
      ]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 8, padding: 12, color: '#8b90a8', font: { size: 10 } } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: '#8b90a8' } },
        y: { stacked: true, grid: { display: false }, ticks: { color: '#8b90a8', font: { size: 10 } } }
      }
    }
  }, items);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Total Open Gaps" value={totalGaps} sub={`Across ${gd.feature_count} features`} color="#ff4757" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="No Tests (P1)" value={totals.no_tests || 0} sub="Critical — no evidence" color="#ff4757" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Manual Only" value={totals.manual_only || 0} sub="Needs automation" color="#f5a623" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Scenario Gaps" value={totals.scenario_gap || 0} sub="Multi-module, no scenario tests" color="#a855f7" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>Gap Type Distribution</Typography>
            <Box sx={{ height: 250 }}><canvas ref={donutRef} /></Box>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>Gaps by Feature (Top 15)</Typography>
            <Box sx={{ height: 250 }}><canvas ref={barRef} /></Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>No Tests</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Manual Only</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>No Spec</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Scenario</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Composition</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(f => {
                const t = f.total_gaps || 1;
                return (
                  <TableRow key={f.feature} hover>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{f.feature}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>{f.total_gaps}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: f.no_tests ? '#ff4757' : 'text.disabled' }}>{f.no_tests || '—'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: f.manual_only ? '#f5a623' : 'text.disabled' }}>{f.manual_only || '—'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: f.no_spec ? '#4af' : 'text.disabled' }}>{f.no_spec || '—'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: f.scenario_gap ? '#a855f7' : 'text.disabled' }}>{f.scenario_gap || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', height: 6, borderRadius: 1, overflow: 'hidden', gap: '1px' }}>
                        {f.no_tests > 0 && <Box sx={{ width: `${f.no_tests / t * 100}%`, bgcolor: '#ff4757', borderRadius: 1 }} />}
                        {f.manual_only > 0 && <Box sx={{ width: `${f.manual_only / t * 100}%`, bgcolor: '#f5a623', borderRadius: 1 }} />}
                        {f.no_spec > 0 && <Box sx={{ width: `${f.no_spec / t * 100}%`, bgcolor: '#4af', borderRadius: 1 }} />}
                        {f.scenario_gap > 0 && <Box sx={{ width: `${f.scenario_gap / t * 100}%`, bgcolor: '#a855f7', borderRadius: 1 }} />}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
