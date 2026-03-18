import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import { useFeatureLandscape, useFeatureDetail } from 'api/rtm';

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

export default function FeatureDetailExplorer({ projectId }) {
  const { landscape } = useFeatureLandscape(projectId);
  const [selectedFeature, setSelectedFeature] = useState('');
  const { detail, loading } = useFeatureDetail(projectId, selectedFeature || undefined);

  const features = landscape?.items || [];

  // Auto-select first feature
  if (!selectedFeature && features.length > 0) {
    setSelectedFeature(features[0].feature);
    return null;
  }

  const d = detail || {};
  const covColor = d.coverage_pct >= 30 ? '#00d68f' : d.coverage_pct >= 10 ? '#f5a623' : d.coverage_pct > 0 ? '#ff4757' : '#555a72';

  return (
    <Box>
      <FormControl size="small" sx={{ mb: 2.5, minWidth: 300 }}>
        <InputLabel>Select Feature</InputLabel>
        <Select value={selectedFeature} label="Select Feature" onChange={(e) => setSelectedFeature(e.target.value)}>
          {features.map(f => (
            <MenuItem key={f.feature} value={f.feature}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                <span>{f.feature}</span>
                <Typography variant="caption" color="text.secondary">{f.total} reqs</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading && <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>}

      {detail && (
        <>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Requirements" value={d.total} sub={`${d.sub_features?.length || 0} sub-features`} color="#4af" /></Grid>
            <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Coverage" value={`${d.coverage_pct}%`} sub={`${d.covered} fully traced`} color={covColor} /></Grid>
            <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Test Cases" value={d.total_test_cases} sub={`${d.manual_evidence} manual, ${d.cats_evidence} CATS`} color="#a855f7" /></Grid>
            <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Open Gaps" value={d.total_gaps} sub="Unresolved gaps" color="#ff4757" /></Grid>
            <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Modules" value={d.module_count} sub={d.modules?.join(', ')} color="#f5a623" /></Grid>
            <Grid size={{ xs: 6, md: 2 }}><KpiCard label="STA Enrichment" value={d.sta_enrichment} sub="Spec ref linkages" color="#00d68f" /></Grid>
          </Grid>

          {/* Coverage bar */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ pb: '14px !important' }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1, display: 'block' }}>
                Coverage Breakdown
              </Typography>
              <Box sx={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden', gap: '2px', mb: 1 }}>
                <Box sx={{ width: `${d.covered / (d.total || 1) * 100}%`, bgcolor: '#00d68f', borderRadius: 1 }} />
                <Box sx={{ width: `${d.partial / (d.total || 1) * 100}%`, bgcolor: '#f5a623', borderRadius: 1 }} />
                <Box sx={{ width: `${d.missing / (d.total || 1) * 100}%`, bgcolor: '#ff4757', borderRadius: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {[['Full', d.covered, '#00d68f'], ['Partial', d.partial, '#f5a623'], ['Missing', d.missing, '#ff4757']].map(([l, v, c]) => (
                  <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c }} />
                    <Typography variant="caption" color="text.secondary">{l}: {v}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {/* Sub-features table */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
                    Sub-Feature Breakdown
                  </Typography>
                  <TableContainer sx={{ maxHeight: 350 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Sub-Feature</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>Reqs</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>Covered</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Coverage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(d.sub_features || []).map(sf => {
                          const sfColor = sf.coverage_pct >= 30 ? '#00d68f' : sf.coverage_pct >= 10 ? '#f5a623' : sf.coverage_pct > 0 ? '#ff4757' : '#555a72';
                          return (
                            <TableRow key={sf.sub_feature} hover>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{sf.sub_feature}</TableCell>
                              <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{sf.total}</TableCell>
                              <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{sf.covered}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,.04)', borderRadius: '4px', height: 6, overflow: 'hidden' }}>
                                    <Box sx={{ height: '100%', width: `${Math.max(sf.coverage_pct, 1)}%`, bgcolor: sfColor, borderRadius: '4px' }} />
                                  </Box>
                                  <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: sfColor, minWidth: 32, textAlign: 'right' }}>{sf.coverage_pct}%</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Gap summary */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
                    Gap Analysis
                  </Typography>
                  {(d.gap_summary || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No open gaps</Typography>
                  ) : (
                    <Table size="small">
                      <TableBody>
                        {(d.gap_summary || []).map((g, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{g.gap_type.replace('_', ' ')}</TableCell>
                            <TableCell>
                              <Chip label={g.priority} size="small" sx={{
                                fontSize: '0.65rem', fontWeight: 600, height: 20,
                                bgcolor: g.priority === 'P1' ? 'rgba(255,71,87,.12)' : g.priority === 'P2' ? 'rgba(245,166,35,.12)' : 'rgba(255,255,255,.06)',
                                color: g.priority === 'P1' ? '#ff4757' : g.priority === 'P2' ? '#f5a623' : 'text.secondary',
                              }} />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>{g.cnt}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
                    Modules Impacted
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(d.modules || []).map(m => (
                      <Chip key={m} label={m} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
