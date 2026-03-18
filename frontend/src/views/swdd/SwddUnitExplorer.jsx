import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import { useSwddUnits, useSwddOverview } from 'api/swdd';

function useChart(ref, config, deps) {
  useEffect(() => {
    if (!ref.current || !deps) return;
    let chart;
    import('chart.js/auto').then(({ default: Chart }) => { chart = new Chart(ref.current, config); });
    return () => chart?.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(deps)]);
}

export default function SwddUnitExplorer() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const { units, total, loading } = useSwddUnits({ search: search || undefined, limit: rowsPerPage, offset: page * rowsPerPage });
  const { overview } = useSwddOverview();
  const barRef = useRef(null);

  // Get domain counts from overview for the chart
  const ov = overview || {};
  // Build domain unit counts from all units (fetch a big batch for chart)
  const { units: allUnits } = useSwddUnits({ limit: 500 });
  const domainCounts = {};
  allUnits.forEach(u => { domainCounts[u.asdd_ref || u.item_name] = (domainCounts[u.asdd_ref || u.item_name] || 0) + 1; });
  const topDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

  const COLORS = ['#4af','#00d68f','#f5a623','#a855f7','#ff4757','#06d6a0','#38bdf8','#e056a0','#fbbf24','#34d399','#4af','#00d68f','#f5a623','#a855f7','#ff4757'];

  useChart(barRef, {
    type: 'bar',
    data: {
      labels: topDomains.map(d => d[0]),
      datasets: [{
        label: 'Units',
        data: topDomains.map(d => d[1]),
        backgroundColor: topDomains.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 4, barPercentage: .6,
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#7e84a0' } },
        y: { grid: { display: false }, ticks: { color: '#7e84a0', font: { size: 10 } } },
      }
    }
  }, topDomains);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
                Top Domains by Unit Count
              </Typography>
              <Box sx={{ height: 260 }}><canvas ref={barRef} /></Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
                Unit Distribution
              </Typography>
              <Grid container spacing={1}>
                {[
                  ['Total Units', ov.total_units || total, '#4af'],
                  ['Domains w/ Units', ov.with_units || Object.keys(domainCounts).length, '#00d68f'],
                  ['Avg / Domain', ov.with_units ? (ov.total_units / ov.with_units).toFixed(1) : '—', '#f5a623'],
                  ['Max Units', topDomains[0]?.[1] || '—', '#a855f7'],
                ].map(([label, val, color]) => (
                  <Grid key={label} size={{ xs: 6 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,.03)', borderRadius: 1, p: 1.5 }}>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, letterSpacing: .6, textTransform: 'uppercase', color: 'text.disabled' }}>{label}</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: '#fff', mt: 0.25 }}>{val}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search units…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 260, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {total} units total
        </Typography>
      </Box>

      <Card>
        <TableContainer sx={{ maxHeight: 450 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 50 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 220 }}>Unit Name</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Domain (ASDD)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Parent Item</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : units.map((u, i) => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.disabled' }}>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{u.name}</TableCell>
                  <TableCell>
                    {u.asdd_ref && (
                      <Chip label={u.asdd_ref} size="small" sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 600, height: 18, bgcolor: 'rgba(68,170,255,.1)', color: '#4af' }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{u.item_name}</TableCell>
                </TableRow>
              ))}
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
      </Card>
    </Box>
  );
}
