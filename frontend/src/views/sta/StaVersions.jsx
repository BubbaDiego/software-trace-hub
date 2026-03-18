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
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useStaVersionCoverage, useStaVersions } from 'api/sta';

function KpiCard({ label, value, sub, color }) {
  return (
    <Card sx={{ height: '100%', borderTop: `2px solid ${color}` }}>
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

const VER_COLORS = ['#ff4757','#f5a623','#fbbf24','#4af','#38bdf8','#00d68f','#a855f7'];

export default function StaVersions({ projectId }) {
  const { versionData, loading: vcLoading } = useStaVersionCoverage(projectId);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const { items, total, versions, loading: matrixLoading } = useStaVersions(projectId, {
    search: search || undefined, limit: rowsPerPage, offset: page * rowsPerPage
  });

  const barRef = useRef(null);
  const lineRef = useRef(null);

  const vd = versionData || {};
  const vers = vd.versions || [];
  const bestVer = vers.length ? vers.reduce((a, b) => a.percentage > b.percentage ? a : b) : {};
  const currentVer = vers.length ? vers[vers.length - 1] : {};

  useChart(barRef, {
    type: 'bar',
    data: {
      labels: vers.map(v => v.version_label),
      datasets: [{
        label: 'SRDs with Test Ref',
        data: vers.map(v => v.srd_count),
        backgroundColor: vers.map((_, i) => VER_COLORS[i % VER_COLORS.length]),
        borderRadius: 4, barPercentage: .6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8b90a8' } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { callback: v => v.toLocaleString(), color: '#8b90a8' } }
      }
    }
  }, vers);

  useChart(lineRef, {
    type: 'line',
    data: {
      labels: vers.map(v => v.version_label),
      datasets: [{
        label: 'Coverage %',
        data: vers.map(v => v.percentage),
        borderColor: '#4af', backgroundColor: 'rgba(68,170,255,.1)',
        fill: true, tension: .3, pointBackgroundColor: '#4af', pointRadius: 5, pointHoverRadius: 7
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8b90a8' } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, min: 0, max: 100, ticks: { callback: v => v + '%', color: '#8b90a8' } }
      }
    }
  }, vers);

  if (vcLoading && !versionData) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Total SRDs Verified" value={vd.total_srds} sub="Design input verification records" color="#ff4757" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Release Versions" value={vers.length} sub={`${vers[0]?.version_label || ''} through ${vers[vers.length - 1]?.version_label || ''}`} color="#4af" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Best Coverage" value={`${bestVer.percentage || 0}%`} sub={`${bestVer.version_label || ''} — baseline release`} color="#00d68f" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Current Release" value={`${currentVer.percentage || 0}%`} sub={`${currentVer.version_label || ''} — incremental`} color="#f5a623" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
              Version Coverage Progression
            </Typography>
            <Box sx={{ height: 250 }}><canvas ref={barRef} /></Box>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
              Coverage Percentage by Version
            </Typography>
            <Box sx={{ height: 250 }}><canvas ref={lineRef} /></Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>
              Version Verification Matrix
            </Typography>
            <Box sx={{ ml: 'auto' }}>
              <TextField
                size="small"
                placeholder="Search SRD ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                sx={{ width: 200, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
              />
            </Box>
          </Box>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 100 }}>Source ID</TableCell>
                  {versions.map(v => <TableCell key={v} sx={{ fontWeight: 600, textAlign: 'center', fontSize: '0.7rem' }}>{v}</TableCell>)}
                  <TableCell sx={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Versions Hit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matrixLoading ? (
                  <TableRow><TableCell colSpan={versions.length + 2} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : items.map((row) => {
                  const hit = versions.filter(v => row.versions[v]?.test_ref).length;
                  return (
                    <TableRow key={row.srd_id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4af' }}>{row.srd_id}</TableCell>
                      {versions.map(v => {
                        const has = !!row.versions[v]?.test_ref;
                        return (
                          <TableCell key={v} sx={{ textAlign: 'center' }}>
                            <Box sx={{
                              width: 10, height: 10, borderRadius: '50%', mx: 'auto',
                              bgcolor: has ? '#00d68f' : 'rgba(255,255,255,.08)',
                              boxShadow: has ? '0 0 6px rgba(0,214,143,.4)' : 'none'
                            }} />
                          </TableCell>
                        );
                      })}
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Chip
                          label={`${hit}/${versions.length}`}
                          size="small"
                          sx={{
                            fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 600, height: 20,
                            bgcolor: hit >= 5 ? 'rgba(0,214,143,.12)' : hit >= 3 ? 'rgba(245,166,35,.12)' : 'rgba(255,71,87,.12)',
                            color: hit >= 5 ? '#00d68f' : hit >= 3 ? '#f5a623' : '#ff4757',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
