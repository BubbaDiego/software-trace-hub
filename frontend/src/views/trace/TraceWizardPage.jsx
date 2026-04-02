import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import axios from '../../utils/axios';
import useSWR from 'swr';
import { useRtmProjects } from 'api/rtm';

const fetcher = (url) => axios.get(url).then((r) => r.data);

export default function TraceWizardPage() {
  const [search, setSearch] = useState('');
  const { projects } = useRtmProjects();
  const projectId = projects?.[0]?.id;

  const { data: rtmData, isLoading: rtmLoading } = useSWR(
    projectId ? `/api/rtm/requirements?project_id=${projectId}&limit=1000` : null,
    fetcher,
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false },
  );
  const { data: staData, isLoading: staLoading } = useSWR(
    projectId ? `/api/sta/specs/${projectId}` : null,
    fetcher,
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false },
  );

  const requirements = rtmData?.items || [];
  const specs = staData?.items || [];
  const loading = rtmLoading || staLoading;

  // Build trace links: requirement -> specs -> design -> tests
  const traces = useMemo(() => {
    if (!requirements.length) return [];
    return requirements.map((req) => {
      const reqId = req.srd_id || req.id || '';
      const linkedSpecs = specs.filter(
        (s) => s.srd_id === reqId || s.requirement_id === reqId
      );
      return { ...req, reqId, linkedSpecs };
    });
  }, [requirements, specs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return traces;
    const q = search.toLowerCase();
    return traces.filter(
      (t) =>
        (t.reqId || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.feature || '').toLowerCase().includes(q)
    );
  }, [traces, search]);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Trace Wizard
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 3 }}>
        Search and trace requirements across specifications, design outputs, and verification evidence.
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by SRD ID, description, or feature..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 500 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info" sx={{ maxWidth: 500 }}>
          {requirements.length === 0
            ? 'No requirements loaded. Import an RTM bundle first.'
            : 'No results match your search.'}
        </Alert>
      ) : (
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 120 }}>SRD ID</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell sx={{ width: 140 }}>Feature</TableCell>
                  <TableCell sx={{ width: 100 }}>Trace Status</TableCell>
                  <TableCell sx={{ width: 80 }}>Specs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(0, 200).map((t, i) => (
                  <TableRow key={t.reqId || i} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#4af' }}>
                        {t.reqId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.primary' }} noWrap>
                        {t.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }} noWrap>
                        {t.feature || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.trace_status || 'unlinked'}
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor:
                            t.trace_status === 'full' ? 'rgba(0,214,143,0.15)' :
                            t.trace_status === 'partial' ? 'rgba(255,170,0,0.15)' :
                            'rgba(255,71,87,0.1)',
                          color:
                            t.trace_status === 'full' ? '#00d68f' :
                            t.trace_status === 'partial' ? '#ffaa00' :
                            '#ff4757',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: '0.75rem' }}>
                        {t.linkedSpecs.length}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
