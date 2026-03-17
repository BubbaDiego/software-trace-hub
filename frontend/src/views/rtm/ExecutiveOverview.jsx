import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { useRtmModules, useRtmSnapshots } from 'api/rtm';

function KpiCard({ label, value, sub, color, pct }) {
  const theme = useTheme();
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, color: color || 'text.primary', mt: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {sub}
          </Typography>
        )}
        {pct !== undefined && (
          <LinearProgress
            variant="determinate"
            value={Math.min(pct, 100)}
            sx={{
              mt: 1.5,
              height: 4,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: color || 'primary.main',
                borderRadius: 2
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function CoverageDonut({ covered, partial, missing, total, label }) {
  const theme = useTheme();
  const pctCov = total ? Math.round((covered / total) * 100) : 0;
  const pctPar = total ? Math.round((partial / total) * 100) : 0;

  const green = theme.palette.success.main;
  const yellow = theme.palette.warning.main;
  const red = theme.palette.error.main;
  const degCov = (covered / (total || 1)) * 360;
  const degPar = degCov + (partial / (total || 1)) * 360;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `conic-gradient(${green} 0deg ${degCov}deg, ${yellow} ${degCov}deg ${degPar}deg, ${red} ${degPar}deg 360deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {pctCov}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <LegendRow color={green} label="Full" value={covered} />
        <LegendRow color={yellow} label="Partial" value={partial} />
        <LegendRow color={red} label="Missing" value={missing} />
      </Box>
    </Box>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color, flexShrink: 0 }} />
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, ml: 'auto', pl: 2 }}>
        {value?.toLocaleString()}
      </Typography>
    </Box>
  );
}

function heatColor(pct) {
  if (pct >= 90) return 'success.main';
  if (pct >= 70) return 'success.light';
  if (pct >= 50) return 'warning.main';
  if (pct >= 30) return 'warning.light';
  return 'error.main';
}

export default function ExecutiveOverview({ projectId, overview, staSummary }) {
  const { modules: modulesData } = useRtmModules(projectId);
  const { snapshots } = useRtmSnapshots(projectId);

  const ov = overview || {};
  const total = ov.total_requirements || 0;
  const covered = ov.covered || 0;
  const partial = ov.partial || 0;
  const missing = ov.missing || 0;
  const coveragePct = ov.coverage_pct || 0;
  const gapCount = ov.gap_count || 0;
  const hazardLinked = ov.hazard_linked || 0;
  const featureCount = ov.feature_count || 0;
  const moduleCount = ov.module_count || 0;
  const modules = ov.modules || {};

  const topFeatures = useMemo(() => {
    if (!ov.features) return [];
    return Object.entries(ov.features)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [ov.features]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* KPI Row */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Total Requirements" value={total} sub="SRD requirements traced" pct={100} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Full Coverage" value={`${coveragePct}%`} sub={`${covered.toLocaleString()} / ${total.toLocaleString()}`} pct={coveragePct} color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Partial" value={partial} sub="Manual only (no CATS)" pct={(partial / (total || 1)) * 100} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Open Gaps" value={gapCount} sub={`${((gapCount / (total || 1)) * 100).toFixed(1)}% of requirements`} pct={(gapCount / (total || 1)) * 100} color="error.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Features / Modules" value={`${featureCount} / ${moduleCount}`} sub={`${hazardLinked} hazard-linked`} pct={100} color="info.main" />
        </Grid>
      </Grid>

      {/* STA Enrichment KPIs */}
      {staSummary?.enriched && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card variant="outlined" sx={{ borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>SRS Spec Links</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>{(staSummary.spec_refs ?? 0).toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">ASWS + ASWUI + ASWIS</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card variant="outlined" sx={{ borderLeft: '3px solid', borderLeftColor: 'secondary.main' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Design Outputs</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', mt: 0.5 }}>{(staSummary.design_outputs ?? 0).toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">SDD section refs</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card variant="outlined" sx={{ borderLeft: '3px solid', borderLeftColor: 'success.main' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Unit Tests</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mt: 0.5 }}>{(staSummary.design_outputs ?? 0).toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">Source files linked</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card variant="outlined" sx={{ borderLeft: '3px solid', borderLeftColor: 'warning.main' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>Versions Tracked</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mt: 0.5 }}>{staSummary.versions_available?.length ?? 0}</Typography>
                <Typography variant="caption" color="text.secondary">{staSummary.versions_available?.join(', ') || ''}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Donuts + Module Distribution */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Traceability Status
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                <CoverageDonut
                  covered={covered}
                  partial={partial}
                  missing={missing}
                  total={total}
                  label="Req→Test"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Module Distribution
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(modules)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mod, count]) => {
                    const pct = total ? (count / total) * 100 : 0;
                    return (
                      <Box key={mod} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="body2" sx={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
                          {mod}
                        </Typography>
                        <Box sx={{ flex: 1, position: 'relative' }}>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ height: 20, borderRadius: 1, bgcolor: 'action.hover' }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              left: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontWeight: 600,
                              color: pct > 15 ? 'primary.contrastText' : 'text.primary'
                            }}
                          >
                            {count.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Module Risk Heatmap + Top Features */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Module Risk Summary
                </Typography>
                <Chip label="By Module" size="small" variant="outlined" />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Module</TableCell>
                      <TableCell align="right">Reqs</TableCell>
                      <TableCell align="right">Full %</TableCell>
                      <TableCell align="right">Manual %</TableCell>
                      <TableCell align="right">CATS %</TableCell>
                      <TableCell align="right">Gaps</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modulesData?.map((m) => (
                      <TableRow key={m.module_name}>
                        <TableCell sx={{ fontWeight: 600 }}>{m.module_name}</TableCell>
                        <TableCell align="right">{m.total_reqs?.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip label={`${m.coverage_pct}%`} size="small" sx={{ bgcolor: heatColor(m.coverage_pct), color: '#fff', fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={`${m.manual_pct}%`} size="small" sx={{ bgcolor: heatColor(m.manual_pct), color: '#fff', fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={`${m.cats_pct}%`} size="small" sx={{ bgcolor: heatColor(m.cats_pct), color: '#fff', fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right">{m.gap_count?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Top Features by Size
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {topFeatures.map(([name, count]) => (
                  <Box key={name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                      {name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {count.toLocaleString()}
                    </Typography>
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
