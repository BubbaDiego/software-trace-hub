import React from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';

import { useRtmModules, useRtmHeatmap } from 'api/rtm';

function ProgressRing({ value, size = 80, color = 'primary.main' }) {
  const theme = useTheme();
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const colorResolved = theme.palette.mode === 'dark'
    ? (typeof color === 'string' && color.includes('.') ? undefined : color)
    : undefined;

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={6}
          stroke={theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200]}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={6} strokeLinecap="round"
          stroke={theme.palette.success.main}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', textAlign: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {value}%
        </Typography>
      </Box>
    </Box>
  );
}

function heatBg(pct, theme) {
  if (pct >= 90) return theme.palette.success.main + '30';
  if (pct >= 70) return theme.palette.success.light + '25';
  if (pct >= 50) return theme.palette.warning.main + '25';
  if (pct >= 30) return theme.palette.warning.light + '20';
  return theme.palette.error.main + '25';
}

export default function ModuleCoverage({ projectId }) {
  const theme = useTheme();
  const { modules, loading } = useRtmModules(projectId);
  const { heatmap, loading: hmLoading } = useRtmHeatmap(projectId, 12);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Module progress rings */}
      <Grid container spacing={2}>
        {modules.map((m) => (
          <Grid key={m.module_name} size={{ xs: 6, sm: 4, md: 12 / Math.max(modules.length, 1) }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2.5 }}>
                <ProgressRing value={m.coverage_pct} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                  {m.module_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {m.total_reqs.toLocaleString()} reqs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Manual vs CATS side by side */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Manual Test Evidence</Typography>
                <Chip label="REQ + SPEC TCs" size="small" variant="outlined" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {modules.map((m) => (
                  <Box key={m.module_name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" sx={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
                      {m.module_name}
                    </Typography>
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <LinearProgress
                        variant="determinate"
                        value={m.manual_pct}
                        sx={{ height: 22, borderRadius: 1, bgcolor: 'action.hover' }}
                        color="primary"
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute', left: 8, top: '50%',
                          transform: 'translateY(-50%)', fontWeight: 600,
                          color: m.manual_pct > 15 ? 'primary.contrastText' : 'text.primary'
                        }}
                      >
                        {m.manual_covered.toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ width: 45, textAlign: 'right', fontWeight: 600 }}>
                      {m.manual_pct}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>CATS Automated Evidence</Typography>
                <Chip label="Automated TCs" size="small" variant="outlined" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {modules.map((m) => (
                  <Box key={m.module_name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" sx={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
                      {m.module_name}
                    </Typography>
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <LinearProgress
                        variant="determinate"
                        value={m.cats_pct}
                        sx={{ height: 22, borderRadius: 1, bgcolor: 'action.hover' }}
                        color="info"
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute', left: 8, top: '50%',
                          transform: 'translateY(-50%)', fontWeight: 600,
                          color: m.cats_pct > 15 ? 'info.contrastText' : 'text.primary'
                        }}
                      >
                        {m.cats_covered.toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ width: 45, textAlign: 'right', fontWeight: 600 }}>
                      {m.cats_pct}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feature x Module Heatmap */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Feature x Module Coverage Heatmap</Typography>
            <Chip label={`Top ${heatmap.features?.length || 0} Features`} size="small" variant="outlined" />
          </Box>
          {hmLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, minWidth: 160 }}>Feature</TableCell>
                    {heatmap.modules?.map((mod) => (
                      <TableCell key={mod} align="center" sx={{ fontWeight: 600, minWidth: 70 }}>
                        {mod}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {heatmap.features?.map((feat) => (
                    <TableRow key={feat}>
                      <TableCell sx={{ fontWeight: 500 }}>{feat}</TableCell>
                      {heatmap.modules?.map((mod) => {
                        const cell = heatmap.cells?.[`${feat}|${mod}`];
                        if (!cell) {
                          return <TableCell key={mod} align="center" sx={{ color: 'text.disabled' }}>&mdash;</TableCell>;
                        }
                        return (
                          <TableCell
                            key={mod}
                            align="center"
                            sx={{
                              bgcolor: heatBg(cell.pct, theme),
                              fontWeight: 600,
                              fontSize: 12
                            }}
                          >
                            {cell.pct}%
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
