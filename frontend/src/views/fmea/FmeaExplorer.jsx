import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { useFmeaRecords } from 'api/fmea';

const PRODUCTS = ['All', 'PCU', 'LVP', 'SYR', 'PCA', 'ETCO2', 'AUTOID'];
const SEV_COLOR = { Catastrophic: 'error', Critical: 'warning', Moderate: 'warning', Minor: 'success' };

export default function FmeaExplorer() {
  const [product, setProduct] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expanded, setExpanded] = useState({});

  const { records, total, recordsLoading } = useFmeaRecords(
    product === 'All' ? null : product,
    debouncedSearch || null,
    rowsPerPage,
    page * rowsPerPage
  );

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setPage(0);
    clearTimeout(window._fmeaSearchTimer);
    window._fmeaSearchTimer = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  }, []);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search FMEA ID, failure mode, hazard, component..."
          value={search}
          onChange={handleSearch}
          sx={{ minWidth: 300, flex: 1, maxWidth: 500 }}
        />
        {PRODUCTS.map((p) => (
          <Chip
            key={p}
            label={p}
            variant={product === p ? 'filled' : 'outlined'}
            color={product === p ? 'primary' : 'default'}
            onClick={() => { setProduct(p); setPage(0); }}
            sx={{ fontWeight: product === p ? 600 : 400 }}
          />
        ))}
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {recordsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 32 }} />
                      <TableCell sx={{ width: 160 }}>FMEA ID</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Failure Mode</TableCell>
                      <TableCell>Component</TableCell>
                      <TableCell>RCM Type</TableCell>
                      <TableCell>P1</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r) => {
                      const isOpen = !!expanded[r.id];
                      const rcmShort = r.rcm_type?.includes('detect and act') ? 'Detect & act'
                        : r.rcm_type?.includes('fail-safe') ? 'Fail-safe'
                        : r.rcm_type?.substring(0, 25) || '';
                      return (
                        <>
                          <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => toggleExpand(r.id)}>
                            <TableCell sx={{ px: 0.5 }}>
                              <IconButton size="small">{isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}</IconButton>
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', fontSize: '0.75rem' }}>{r.fmea_id}</TableCell>
                            <TableCell>{r.product}</TableCell>
                            <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.failure_mode}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{r.component}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{rcmShort}</TableCell>
                            <TableCell>
                              <Chip label={r.p1 || '—'} size="small" color={r.p1 === 'Frequent' ? 'error' : 'warning'} sx={{ fontSize: '0.6rem', height: 20 }} />
                            </TableCell>
                          </TableRow>
                          <TableRow key={`${r.id}-detail`}>
                            <TableCell colSpan={7} sx={{ p: 0, border: isOpen ? undefined : 'none' }}>
                              <Collapse in={isOpen}>
                                <Box sx={{ p: 2, bgcolor: 'background.default', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                  <Box>
                                    <DetailRow label="Source" value={r.source} />
                                    <DetailRow label="Hazard" value={r.hazard} />
                                    <DetailRow label="Cause" value={r.cause} />
                                    <DetailRow label="Effect" value={r.effect} />
                                    <DetailRow label="System Effect" value={r.system_effect} />
                                    <DetailRow label="Critical" value={r.critical_component} />
                                  </Box>
                                  <Box>
                                    <DetailRow label="RCM" value={r.rcm} />
                                    <DetailRow label="Requirement" value={r.requirement} />
                                    <DetailRow label="Evidence" value={r.evidence} />
                                    <DetailRow label="Standard" value={r.standard_ref} />
                                    <DetailRow label="Residual P1" value={r.residual_p1} />
                                    <DetailRow label="Severity" value={r.severity} />
                                  </Box>
                                  {r.mitigation_rationale && (
                                    <Box sx={{ gridColumn: '1 / -1', p: 1.5, bgcolor: 'rgba(102,187,106,.06)', border: '1px solid rgba(102,187,106,.15)', borderRadius: 1 }}>
                                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.6 }}>
                                        <strong style={{ color: '#66bb6a' }}>Mitigation: </strong>
                                        {r.mitigation_rationale}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 0.5, mb: 0.5 }}>
      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, pt: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.75rem', whiteSpace: 'pre-line' }}>{value}</Typography>
    </Box>
  );
}
