import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
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
import TablePagination from '@mui/material/TablePagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { useRtmGaps, useRtmOverview, useRtmModules } from 'api/rtm';

const GAP_TYPES = ['', 'no_tests', 'manual_only', 'no_spec', 'scenario_gap'];
const PRIORITIES = ['', 'P1', 'P2', 'P3'];
const MODULES = ['', 'PCU', 'LVP', 'SYR', 'PCA', 'EtCO2', 'SPO2', 'Auto-ID'];

function gapTypeChip(type) {
  const map = {
    no_tests: { label: 'No Tests', color: 'error' },
    manual_only: { label: 'Manual Only', color: 'warning' },
    no_spec: { label: 'No Spec', color: 'info' },
    scenario_gap: { label: 'Scenario Gap', color: 'secondary' }
  };
  const s = map[type] || { label: type, color: 'default' };
  return <Chip label={s.label} size="small" color={s.color} variant="filled" />;
}

function priorityChip(p) {
  const map = {
    P1: { color: 'error' },
    P2: { color: 'warning' },
    P3: { color: 'default' }
  };
  const s = map[p] || { color: 'default' };
  return <Chip label={p} size="small" color={s.color} variant="filled" />;
}

function KpiCard({ label, value, sub, color }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, color: color || 'text.primary', mt: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function GapAnalysis({ projectId }) {
  const theme = useTheme();
  const [gapType, setGapType] = useState('');
  const [priority, setPriority] = useState('');
  const [module, setModule] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const { overview } = useRtmOverview(projectId);
  const { modules: modulesData } = useRtmModules(projectId);
  const { items, total, loading } = useRtmGaps(projectId, {
    gapType: gapType || undefined,
    priority: priority || undefined,
    module: module || undefined,
    limit: rowsPerPage,
    offset: page * rowsPerPage
  });

  // Compute gap type breakdown from unfiltered data
  const { items: allP1 } = useRtmGaps(projectId, { priority: 'P1', limit: 1 });
  const { items: allNoTests } = useRtmGaps(projectId, { gapType: 'no_tests', limit: 1 });
  const { total: totalNoTests } = useRtmGaps(projectId, { gapType: 'no_tests' });
  const { total: totalManualOnly } = useRtmGaps(projectId, { gapType: 'manual_only' });
  const { total: totalNoSpec } = useRtmGaps(projectId, { gapType: 'no_spec' });
  const { total: totalScenario } = useRtmGaps(projectId, { gapType: 'scenario_gap' });

  const totalGaps = overview?.gap_count || 0;
  const totalReqs = overview?.total_requirements || 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Gap KPIs */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Total Gaps" value={totalGaps} sub={`${((totalGaps / totalReqs) * 100).toFixed(1)}% of requirements`} color="error.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="No Tests" value={totalNoTests} sub="Missing all test evidence" color="error.dark" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="Manual Only" value={totalManualOnly} sub="No CATS automation" color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard label="No Spec ID" value={totalNoSpec} sub="SRD without spec link" color="info.main" />
        </Grid>
      </Grid>

      {/* Gaps by module bar chart + Type donut */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Gaps by Module</Typography>
                <Chip label="Prioritized" size="small" variant="outlined" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {modulesData?.map((m) => {
                  const maxGaps = Math.max(...(modulesData?.map((x) => x.gap_count) || [1]));
                  const pct = maxGaps ? (m.gap_count / maxGaps) * 100 : 0;
                  return (
                    <Box key={m.module_name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="body2" sx={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
                        {m.module_name}
                      </Typography>
                      <Box sx={{ flex: 1, position: 'relative' }}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          color="error"
                          sx={{ height: 22, borderRadius: 1, bgcolor: 'action.hover' }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute', left: 8, top: '50%',
                            transform: 'translateY(-50%)', fontWeight: 600,
                            color: pct > 15 ? '#fff' : 'text.primary'
                          }}
                        >
                          {m.gap_count.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Gap Type Distribution</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { label: 'No Test Evidence', count: totalNoTests, color: 'error.main' },
                  { label: 'Manual Only (no CATS)', count: totalManualOnly, color: 'warning.main' },
                  { label: 'Missing Spec Link', count: totalNoSpec, color: 'info.main' },
                  { label: 'Scenario Gap', count: totalScenario, color: 'secondary.main' }
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: item.color, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.count.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 45, textAlign: 'right' }}>
                      {totalGaps ? ((item.count / totalGaps) * 100).toFixed(0) : 0}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gap Details Table */}
      <Card variant="outlined">
        <CardContent sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Open Gaps</Typography>
            <Chip label="Sorted by Priority" size="small" variant="outlined" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Gap Type</InputLabel>
              <Select value={gapType} label="Gap Type" onChange={(e) => { setGapType(e.target.value); setPage(0); }}>
                {GAP_TYPES.map((g) => <MenuItem key={g} value={g}>{g ? g.replace(/_/g, ' ') : 'All Types'}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Priority</InputLabel>
              <Select value={priority} label="Priority" onChange={(e) => { setPriority(e.target.value); setPage(0); }}>
                {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p || 'All'}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Module</InputLabel>
              <Select value={module} label="Module" onChange={(e) => { setModule(e.target.value); setPage(0); }}>
                {MODULES.map((m) => <MenuItem key={m} value={m}>{m || 'All Modules'}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 'auto' }}>
              {total.toLocaleString()} gaps
            </Typography>
          </Box>
        </CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 450 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>SRD ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Gap Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((g) => (
                    <TableRow key={g.id} hover>
                      <TableCell>{priorityChip(g.priority)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{g.srd_id || '\u2014'}</TableCell>
                      <TableCell>{g.feature}</TableCell>
                      <TableCell>{g.module}</TableCell>
                      <TableCell>{gapTypeChip(g.gap_type)}</TableCell>
                      <TableCell>{g.assigned_to || '\u2014'}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.notes || '\u2014'}
                      </TableCell>
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
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
