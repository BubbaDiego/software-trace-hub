import { useState } from 'react';
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
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { useStaDesignOutputs } from 'api/sta';

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

export default function StaDesignOutputs({ projectId }) {
  const { designData, loading } = useStaDesignOutputs(projectId, { limit: 100 });
  const [expanded, setExpanded] = useState({});

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  const dd = designData || {};
  const items = dd.items || [];
  const maxCount = items[0]?.srd_count || 1;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Design Documents" value={dd.total_documents} sub="Unique ASDD references" color="#f5a623" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Requirements Covered" value={dd.total_srd_coverage} sub="SRDs with design outputs" color="#4af" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Avg Outputs / SRD" value={dd.avg_outputs_per_srd} sub="Design documents per requirement" color="#00d68f" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Top Document" value={dd.top_document} sub={`Referenced by ${dd.top_document_count?.toLocaleString()} SRDs`} color="#f5a623" /></Grid>
      </Grid>

      {/* Bubble grid */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
            Design Output Documents by Requirement Count
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {items.slice(0, 25).map((d, i) => {
              const size = Math.max(52, Math.sqrt(d.srd_count / maxCount) * 110);
              const c = COLORS[i % COLORS.length];
              return (
                <Box
                  key={d.design_ref}
                  sx={{
                    width: size, height: size, bgcolor: `${c}18`, border: `1px solid ${c}44`,
                    borderRadius: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'default',
                    transition: 'transform .15s', '&:hover': { transform: 'scale(1.06)' }
                  }}
                  title={`${d.design_ref}: ${d.srd_count} SRDs`}
                >
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,.9)', textAlign: 'center', lineHeight: 1.1 }}>
                    {d.design_ref.replace('ASDD-', '')}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,.4)', mt: 0.25 }}>{d.srd_count}</Typography>
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
                <TableCell sx={{ fontWeight: 600, width: 40 }}></TableCell>
                <TableCell sx={{ fontWeight: 600, width: 200 }}>Design Output</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100, textAlign: 'right' }}>SRD Count</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Coverage</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>% of Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((d, i) => {
                const c = COLORS[i % COLORS.length];
                const isOpen = !!expanded[d.design_ref];
                return [
                  <TableRow key={d.design_ref} hover sx={{ cursor: 'pointer' }} onClick={() => setExpanded(p => ({ ...p, [d.design_ref]: !p[d.design_ref] }))}>
                    <TableCell>
                      <IconButton size="small">{isOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}</IconButton>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: c }}>{d.design_ref}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{d.srd_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,.04)', borderRadius: '4px', height: 8, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${d.srd_count / maxCount * 100}%`, bgcolor: c, borderRadius: '4px' }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{d.percentage}%</TableCell>
                  </TableRow>,
                  <TableRow key={`${d.design_ref}-detail`}>
                    <TableCell colSpan={5} sx={{ py: 0, borderBottom: isOpen ? undefined : 'none' }}>
                      <Collapse in={isOpen}>
                        <Box sx={{ py: 1.5, pl: 5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(d.sample_srds || []).map(s => (
                            <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', height: 22 }} />
                          ))}
                          {d.srd_count > (d.sample_srds?.length || 0) && (
                            <Chip label={`+ ${d.srd_count - (d.sample_srds?.length || 0)} more`} size="small" sx={{ fontSize: '0.65rem', height: 22, color: 'text.disabled' }} />
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                ];
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
