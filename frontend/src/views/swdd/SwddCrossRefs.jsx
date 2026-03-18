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
import { useSwddCrossRefs, useSwddOverview } from 'api/swdd';

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

export default function SwddCrossRefs() {
  const { xrefData, loading } = useSwddCrossRefs();
  const { overview } = useSwddOverview();

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  const xd = xrefData || {};
  const items = xd.items || [];
  const maxSta = items[0]?.sta_requirement_links || 1;
  const totalStaLinks = items.reduce((s, i) => s + (i.sta_requirement_links || 0), 0);
  const totalUtLinks = items.reduce((s, i) => s + (i.ut_file_links || 0), 0);
  const ov = overview || {};

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Linked Domains" value={xd.linked || 0} sub={`${((xd.linked || 0) / (xd.total || 1) * 100).toFixed(1)}% of ASDD refs`} color="#00d68f" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Unlinked" value={xd.unlinked || 0} sub="No STA requirement links" color="#ff4757" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Total STA Links" value={totalStaLinks} sub="Requirement cross-refs" color="#4af" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Unit Test Links" value={totalUtLinks} sub="UT file cross-refs" color="#f5a623" />
        </Grid>
      </Grid>

      {/* Completeness summary */}
      {ov.total_items && (
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ pb: '14px !important' }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
              Documentation Completeness
            </Typography>
            {[
              ['SW Units Defined', ov.with_units, ov.total_items],
              ['Risks Documented', ov.with_risks, ov.total_items],
              ['Test Areas Listed', ov.with_test_areas, ov.total_items],
              ['Assumptions/Constraints', ov.with_assumptions, ov.total_items],
              ['Cross-linked to STA', xd.linked || 0, xd.total || 1],
            ].map(([label, val, total]) => {
              const pct = Math.round(val / (total || 1) * 100);
              const c = pct >= 80 ? '#00d68f' : pct >= 50 ? '#f5a623' : '#ff4757';
              return (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8 }}>
                  <Typography sx={{ fontSize: '0.75rem', width: 160, color: 'text.secondary' }}>{label}</Typography>
                  <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,.04)', borderRadius: '5px', height: 8, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: c, borderRadius: '5px' }} />
                  </Box>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 600, color: c, minWidth: 80, textAlign: 'right' }}>
                    {val}/{total} ({pct}%)
                  </Typography>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Cross-reference table */}
      <Card>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>ASDD Ref</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 60, textAlign: 'right' }}>Units</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 90, textAlign: 'right' }}>STA Links</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Linkage Density</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>UT Links</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 70, textAlign: 'center' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.asdd_ref} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4af' }}>{r.asdd_ref}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{r.item_name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'right' }}>{r.unit_count || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'right', fontWeight: r.sta_requirement_links ? 600 : 400 }}>
                    {r.sta_requirement_links ? r.sta_requirement_links.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,.04)', borderRadius: '3px', height: 6, overflow: 'hidden' }}>
                      <Box sx={{
                        height: '100%',
                        width: `${(r.sta_requirement_links || 0) / maxSta * 100}%`,
                        bgcolor: r.sta_requirement_links ? '#4af' : 'transparent',
                        borderRadius: '3px',
                      }} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'right', color: r.ut_file_links ? '#f5a623' : 'text.disabled' }}>
                    {r.ut_file_links || '—'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip
                      label={r.linked ? 'Linked' : 'None'}
                      size="small"
                      sx={{
                        fontSize: '0.6rem', fontWeight: 600, height: 18,
                        bgcolor: r.linked ? 'rgba(0,214,143,.12)' : 'rgba(255,71,87,.12)',
                        color: r.linked ? '#00d68f' : '#ff4757',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
