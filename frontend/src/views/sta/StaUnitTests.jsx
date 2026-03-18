import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import { useStaUnitTests } from 'api/sta';

function KpiCard({ label, value, sub, color }) {
  return (
    <Card sx={{ height: '100%', borderLeft: `3px solid ${color}` }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mt: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function useChart(ref, config, deps) {
  useEffect(() => {
    if (!ref.current || !deps) return;
    let chart;
    import('chart.js/auto').then(({ default: Chart }) => {
      chart = new Chart(ref.current, config);
    });
    return () => chart?.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(deps)]);
}

export default function StaUnitTests({ projectId }) {
  const [search, setSearch] = useState('');
  const { utData, loading } = useStaUnitTests(projectId, { search: search || undefined, limit: 50 });
  const distRef = useRef(null);
  const catRef = useRef(null);

  const ud = utData || {};
  const items = ud.items || [];
  const maxCount = ud.max_coverage || 1;

  const distLabels = Object.keys(ud.distribution || {});
  const distValues = Object.values(ud.distribution || {});
  useChart(distRef, {
    type: 'bar',
    data: {
      labels: distLabels,
      datasets: [{ label: 'Test Files', data: distValues, backgroundColor: ['#a855f7','#8b5cf6','#7c3aed','#6d28d9','#5b21b6'], borderRadius: 4, barPercentage: .6 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, title: { display: true, text: 'SRD Coverage Range', color: '#555a72', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, title: { display: true, text: 'File Count', color: '#555a72', font: { size: 10 } } }
      }
    }
  }, ud.distribution);

  const catLabels = Object.keys(ud.categories || {});
  const catValues = Object.values(ud.categories || {});
  useChart(catRef, {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{ data: catValues, backgroundColor: ['#a855f7','#4af','#ff4757','#f5a623','#00d68f','#06d6a0','#555a72'], borderWidth: 0 }]
    },
    options: {
      cutout: '55%',
      plugins: { legend: { position: 'right', labels: { font: { size: 10 }, padding: 10, usePointStyle: true, pointStyleWidth: 8, color: '#8b90a8' } } }
    }
  }, ud.categories);

  if (loading && !utData) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Unit Test Files" value={ud.total_files} sub="Unique verification source files" color="#a855f7" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Requirements Covered" value={ud.total_srds_covered} sub="Every SRD has unit test traceability" color="#a855f7" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Avg Tests / SRD" value={ud.avg_tests_per_srd} sub="Test files per requirement" color="#a855f7" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Max Coverage" value={ud.max_coverage} sub="SRDs covered by top test file" color="#a855f7" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
              Coverage Distribution
            </Typography>
            <Box sx={{ height: 250 }}><canvas ref={distRef} /></Box>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
              Test Files by Category
            </Typography>
            <Box sx={{ height: 250 }}><canvas ref={catRef} /></Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search test file name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          Showing top {items.length} of {ud.total_files} files — sorted by requirement coverage
        </Typography>
      </Box>

      <Card>
        <TableContainer sx={{ maxHeight: 450 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 50 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 260 }}>Test File</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100, textAlign: 'right' }}>SRD Count</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Coverage Intensity</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>% of SRDs</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r, i) => {
                const intensity = r.srd_count / maxCount;
                const hue = intensity > .7 ? '#a855f7' : intensity > .4 ? '#4af' : intensity > .2 ? '#00d68f' : '#f5a623';
                return (
                  <TableRow key={r.test_file} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.disabled' }}>{i + 1}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: hue }}>{r.test_file}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.srd_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,.04)', borderRadius: '4px', height: 8, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${intensity * 100}%`, background: `linear-gradient(90deg, ${hue}88, ${hue})`, borderRadius: '4px' }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.percentage}%</TableCell>
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
