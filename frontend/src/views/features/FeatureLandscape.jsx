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
import { useFeatureLandscape, useRtmOverview } from 'api/rtm';

const COLORS = ['#4af','#00d68f','#f5a623','#a855f7','#ff4757','#06d6a0','#e056a0','#38bdf8','#fbbf24','#34d399'];

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

export default function FeatureLandscape({ projectId }) {
  const { landscape, loading } = useFeatureLandscape(projectId);
  const { overview } = useRtmOverview(projectId);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  const items = landscape?.items || [];
  const maxCount = items[0]?.total || 1;
  const totalReqs = overview?.total_requirements || 0;
  const avgCoverage = items.length ? (items.reduce((s, i) => s + i.coverage_pct, 0) / items.length).toFixed(1) : 0;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Total Features" value={items.length} sub={`${totalReqs.toLocaleString()} requirements`} color="#4af" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Avg Coverage" value={`${avgCoverage}%`} sub="Across all features" color="#00d68f" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Largest Feature" value={items[0]?.feature || '—'} sub={`${items[0]?.total?.toLocaleString() || 0} requirements`} color="#f5a623" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Most Sub-Features" value={items.length ? Math.max(...items.map(i => i.sub_feature_count)) : 0} sub="Deepest feature hierarchy" color="#a855f7" /></Grid>
      </Grid>

      {/* Bubble treemap */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
            Feature Landscape — sized by requirement count, colored by coverage
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {items.slice(0, 30).map((f, i) => {
              const size = Math.max(56, Math.sqrt(f.total / maxCount) * 120);
              const cov = f.coverage_pct;
              const bg = cov >= 30 ? '#00d68f' : cov >= 10 ? '#f5a623' : cov > 0 ? '#ff4757' : '#555a72';
              return (
                <Box key={f.feature} sx={{
                  width: size, height: size, bgcolor: `${bg}18`, border: `1px solid ${bg}44`,
                  borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'default', transition: 'transform .15s', '&:hover': { transform: 'scale(1.06)' }
                }} title={`${f.feature}: ${f.total} reqs, ${f.coverage_pct}% coverage`}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: size > 70 ? '0.6rem' : '0.5rem', fontWeight: 600, color: 'rgba(255,255,255,.9)', textAlign: 'center', lineHeight: 1.1, px: 0.5 }} noWrap>
                    {f.feature.length > 16 ? f.feature.slice(0, 14) + '…' : f.feature}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.55rem', color: bg, mt: 0.25 }}>{f.total}</Typography>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer sx={{ maxHeight: 450 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Reqs</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>Coverage</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Coverage Bar</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 70, textAlign: 'right' }}>Sub-Feat</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 70, textAlign: 'right' }}>Modules</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Modules</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((f, i) => {
                const cov = f.coverage_pct;
                const covColor = cov >= 30 ? '#00d68f' : cov >= 10 ? '#f5a623' : cov > 0 ? '#ff4757' : '#555a72';
                return (
                  <TableRow key={f.feature} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{f.feature}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{f.total.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Chip label={`${cov}%`} size="small" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 600, height: 20, bgcolor: `${covColor}18`, color: covColor }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,.04)', borderRadius: '4px', height: 8, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${Math.max(cov, 1)}%`, bgcolor: covColor, borderRadius: '4px' }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{f.sub_feature_count}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{f.module_count}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                        {f.modules.slice(0, 5).map(m => (
                          <Chip key={m} label={m} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                        ))}
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
