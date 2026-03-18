import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import { useStaSpecs } from 'api/sta';

const MODULES = ['All', 'PCU', 'LVP', 'SYR', 'PCA', 'EtCO2', 'AutoID', 'ETCO2', 'PC-BIO', 'PC-IRC'];

function SpecDot({ has }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: '4px', fontSize: '9px', fontWeight: 700,
        bgcolor: has ? 'rgba(0,214,143,.12)' : 'rgba(255,255,255,.03)',
        color: has ? '#00d68f' : 'text.disabled',
      }}
    >
      {has ? '✓' : '—'}
    </Box>
  );
}

export default function StaSpecRefs({ projectId }) {
  const [search, setSearch] = useState('');
  const [module, setModule] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const { items, total, loading } = useStaSpecs(projectId, {
    module: module || undefined,
    search: search || undefined,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search SRD ID, description…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 260, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
        />
        {MODULES.filter(m => ['All','PCU','LVP','SYR','PCA','EtCO2','AutoID'].includes(m)).map(m => (
          <Button
            key={m}
            size="small"
            variant={(m === 'All' && !module) || module === m ? 'contained' : 'outlined'}
            onClick={() => { setModule(m === 'All' ? null : m); setPage(0); }}
            sx={{ textTransform: 'none', fontSize: '0.75rem', minWidth: 50 }}
          >
            {m}
          </Button>
        ))}
      </Box>

      <Card>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 90 }}>SRD ID</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 150 }}>PRD Section</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 130 }}>Modules</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 55, textAlign: 'center' }}>ASWS</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 55, textAlign: 'center' }}>ASWUI</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 55, textAlign: 'center' }}>ASWIS</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 75, textAlign: 'center' }}>Coverage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : items.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4af' }}>{r.srd_id}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{r.prd_section}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{r.description?.slice(0, 80)}{r.description?.length > 80 ? '…' : ''}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.secondary' }}>{r.modules}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}><SpecDot has={!!r.asws_ref} /></TableCell>
                  <TableCell sx={{ textAlign: 'center' }}><SpecDot has={!!r.aswui_ref} /></TableCell>
                  <TableCell sx={{ textAlign: 'center' }}><SpecDot has={!!r.aswis_ref} /></TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip
                      label={r.coverage === 'full' ? 'Full' : r.coverage === 'partial' ? 'Partial' : 'None'}
                      size="small"
                      sx={{
                        fontSize: '0.65rem', fontWeight: 600, height: 20,
                        bgcolor: r.coverage === 'full' ? 'rgba(0,214,143,.12)' : r.coverage === 'partial' ? 'rgba(245,166,35,.12)' : 'rgba(255,71,87,.12)',
                        color: r.coverage === 'full' ? '#00d68f' : r.coverage === 'partial' ? '#f5a623' : '#ff4757',
                      }}
                    />
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
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Card>
    </Box>
  );
}
