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
import { useFeatureEvidence } from 'api/rtm';

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

export default function FeatureEvidenceMatrix({ projectId }) {
  const { evidenceData, loading } = useFeatureEvidence(projectId);
  const barRef = useRef(null);

  const items = evidenceData?.items || [];
  const totalManualTcs = items.reduce((s, i) => s + (i.manual_tcs || 0), 0);
  const totalCatsTcs = items.reduce((s, i) => s + (i.cats_tcs || 0), 0);
  const totalTcs = items.reduce((s, i) => s + (i.total_tcs || 0), 0);
  const maxTcs = items[0]?.total_tcs || 1;
  const catsPct = totalTcs ? (totalCatsTcs / totalTcs * 100).toFixed(1) : 0;

  useChart(barRef, {
    type: 'bar',
    data: {
      labels: items.slice(0, 15).map(f => f.feature.length > 18 ? f.feature.slice(0, 16) + '…' : f.feature),
      datasets: [
        { label: 'Manual', data: items.slice(0, 15).map(f => f.manual_tcs), backgroundColor: '#f5a623', borderRadius: 2 },
        { label: 'CATS', data: items.slice(0, 15).map(f => f.cats_tcs), backgroundColor: '#00d68f', borderRadius: 2 },
      ]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 8, padding: 12, color: '#8b90a8', font: { size: 10 } } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { callback: v => v.toLocaleString(), color: '#8b90a8' } },
        y: { stacked: true, grid: { display: false }, ticks: { color: '#8b90a8', font: { size: 10 } } }
      }
    }
  }, items);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Total Test Cases" value={totalTcs} sub={`Across ${items.length} features`} color="#a855f7" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Manual Evidence" value={totalManualTcs} sub={`${(100 - catsPct)}% of total`} color="#f5a623" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="CATS Evidence" value={totalCatsTcs} sub={`${catsPct}% automated`} color="#00d68f" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Features w/ Evidence" value={items.length} sub="Features with test traceability" color="#4af" /></Grid>
      </Grid>

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
            Manual vs CATS Evidence by Feature (Top 15)
          </Typography>
          <Box sx={{ height: 280 }}><canvas ref={barRef} /></Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer sx={{ maxHeight: 450 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100, textAlign: 'right' }}>Total TCs</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Manual</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 90, textAlign: 'right' }}>CATS</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Manual vs CATS</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>CATS %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(f => {
                const t = f.total_tcs || 1;
                const cPct = (f.cats_tcs / t * 100).toFixed(1);
                const cColor = cPct >= 30 ? '#00d68f' : cPct >= 10 ? '#f5a623' : '#ff4757';
                return (
                  <TableRow key={f.feature} hover>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{f.feature}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>{f.total_tcs.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: '#f5a623' }}>{f.manual_tcs.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: '#00d68f' }}>{f.cats_tcs.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', height: 6, borderRadius: 1, overflow: 'hidden', gap: '1px' }}>
                        <Box sx={{ width: `${f.manual_tcs / t * 100}%`, bgcolor: '#f5a623', borderRadius: 1 }} />
                        <Box sx={{ width: `${f.cats_tcs / t * 100}%`, bgcolor: '#00d68f', borderRadius: 1 }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Chip label={`${cPct}%`} size="small" sx={{
                        fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 600, height: 20,
                        bgcolor: `${cColor}18`, color: cColor
                      }} />
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
