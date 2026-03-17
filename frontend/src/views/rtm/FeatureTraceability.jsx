import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
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
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

import { useRtmRequirements } from 'api/rtm';

const MODULES = ['', 'PCU', 'LVP', 'SYR', 'PCA', 'EtCO2', 'SPO2', 'Auto-ID'];
const STATUSES = ['', 'full', 'partial', 'missing'];

function statusChip(status) {
  const map = {
    full: { label: 'Full', color: 'success' },
    partial: { label: 'Partial', color: 'warning' },
    missing: { label: 'Missing', color: 'error' }
  };
  const s = map[status] || { label: status, color: 'default' };
  return <Chip label={s.label} size="small" color={s.color} variant="filled" />;
}

export default function FeatureTraceability({ projectId, overview }) {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [featureFilter, setFeatureFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const { items, total, loading } = useRtmRequirements(projectId, {
    feature: featureFilter || undefined,
    module: moduleFilter || undefined,
    traceStatus: statusFilter || undefined,
    search: search || undefined,
    limit: rowsPerPage,
    offset: page * rowsPerPage
  });

  const features = useMemo(() => {
    if (!overview?.features) return [];
    return Object.entries(overview.features)
      .sort((a, b) => b[1] - a[1]);
  }, [overview?.features]);

  // Feature treemap (top 12)
  const topFeatures = features.slice(0, 12);
  const totalReqs = overview?.total_requirements || 1;
  const colors = [
    'primary.main', 'success.main', 'secondary.main', 'warning.main',
    'info.main', 'error.main', 'primary.light', 'success.light',
    'secondary.light', 'warning.light', 'info.light', 'error.light'
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Feature Treemap */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Feature Landscape</Typography>
            <Chip label={`${features.length} Features`} size="small" variant="outlined" />
          </Box>
          <Grid container spacing={0.5}>
            {topFeatures.map(([name, count], i) => {
              const pct = (count / totalReqs) * 100;
              const span = pct > 10 ? 4 : pct > 5 ? 3 : 2;
              return (
                <Grid key={name} size={{ xs: 6, sm: span }}>
                  <Box
                    onClick={() => { setFeatureFilter(name); setPage(0); }}
                    sx={{
                      bgcolor: colors[i % colors.length],
                      opacity: 0.85,
                      borderRadius: 1,
                      p: 1.5,
                      cursor: 'pointer',
                      minHeight: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      '&:hover': { opacity: 1 },
                      transition: 'opacity 0.15s'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff' }} noWrap>
                      {name}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
                      {count.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {pct.toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
            {features.length > 12 && (
              <Grid size={{ xs: 6, sm: 4 }}>
                <Box
                  onClick={() => setFeatureFilter('')}
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    p: 1.5,
                    minHeight: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {features.length - 12} Other Features
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {features.slice(12).reduce((s, [, c]) => s + c, 0).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Filter bar + Table */}
      <Card variant="outlined">
        <CardContent sx={{ pb: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Feature &rarr; Requirement &rarr; Test Mapping
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search SRD ID, spec, feature..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Module</InputLabel>
              <Select value={moduleFilter} label="Module" onChange={(e) => { setModuleFilter(e.target.value); setPage(0); }}>
                {MODULES.map((m) => <MenuItem key={m} value={m}>{m || 'All Modules'}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Status'}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Feature</InputLabel>
              <Select value={featureFilter} label="Feature" onChange={(e) => { setFeatureFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Features</MenuItem>
                {features.map(([f]) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 'auto' }}>
              {total.toLocaleString()} results
            </Typography>
          </Box>
        </CardContent>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>SNO</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Sub-Feature</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>SRD ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Spec ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Modules</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Evidence</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.sno}</TableCell>
                      <TableCell>{r.feature}</TableCell>
                      <TableCell>{r.sub_feature}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.srd_id}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.spec_id || '\u2014'}</TableCell>
                      <TableCell>{r.impacted_modules}</TableCell>
                      <TableCell align="center">{r.evidence?.length || 0}</TableCell>
                      <TableCell align="center">{statusChip(r.trace_status)}</TableCell>
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
