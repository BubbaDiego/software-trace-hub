import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';

// ---------------------------------------------------------------------------
// Static data — will be replaced by API once backend exists
// ---------------------------------------------------------------------------
const KPIS = [
  { label: 'Open Gaps', value: 9, color: 'error', sub: 'Require action' },
  { label: 'Partial Coverage', value: 19, color: 'warning', sub: 'Need completion' },
  { label: 'Resolved This Sprint', value: 7, color: 'success', sub: 'Last 14 days' },
  { label: 'Avg Days Open', value: 12, color: 'primary', sub: 'Gap age' }
];

const GAPS = [
  {
    clause: '5.3.3',
    desc: 'Verify architectural design supports safety classification',
    cls: 'C',
    status: 'missing',
    assigned: 'D. Rivera',
    reqs: 42,
    due: '2026-03-28'
  },
  {
    clause: '5.4.2',
    desc: 'Detailed design for each software unit',
    cls: 'C',
    status: 'missing',
    assigned: 'K. Chen',
    reqs: 156,
    due: '2026-04-01'
  },
  {
    clause: '5.5.5',
    desc: 'Unit verification — acceptance criteria traceability',
    cls: 'C',
    status: 'missing',
    assigned: '—',
    reqs: 89,
    due: '—'
  },
  {
    clause: '6.2.2',
    desc: 'Problem analysis and change impact assessment',
    cls: 'B',
    status: 'missing',
    assigned: 'J. Patel',
    reqs: 24,
    due: '2026-04-05'
  },
  {
    clause: '7.1.3',
    desc: 'Document potential causes of contribution to hazard',
    cls: 'C',
    status: 'missing',
    assigned: '—',
    reqs: 67,
    due: '—'
  },
  {
    clause: '5.2.6',
    desc: 'Re-evaluate medical device risk analysis',
    cls: 'B',
    status: 'partial',
    assigned: 'A. Morales',
    reqs: 31,
    due: '2026-03-25'
  },
  {
    clause: '5.6.7',
    desc: 'Integration test content evaluation',
    cls: 'C',
    status: 'partial',
    assigned: 'D. Rivera',
    reqs: 203,
    due: '2026-04-10'
  },
  { clause: '9.5', desc: 'Trend analysis of software problems', cls: 'A', status: 'missing', assigned: '—', reqs: 8, due: '—' },
  { clause: 'C.4', desc: 'Legacy software risk classification', cls: 'B', status: 'missing', assigned: '—', reqs: 15, due: '—' }
];

const CLS_COLOR = { A: 'success', B: 'warning', C: 'error' };

export default function IecGaps({ projectId }) {
  return (
    <Box>
      {/* KPI row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {KPIS.map((k) => (
          <Card key={k.label} sx={{ flex: 1, minWidth: 160 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: 10 }}>
                {k.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: `${k.color}.main` }}>
                {k.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {k.sub}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Gap table */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Open Compliance Gaps
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Clause</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Class</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell align="right">RTM Reqs</TableCell>
                  <TableCell>Due</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {GAPS.map((g) => (
                  <TableRow key={g.clause} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{g.clause}</TableCell>
                    <TableCell>{g.desc}</TableCell>
                    <TableCell align="center">
                      <Chip label={`Class ${g.cls}`} size="small" color={CLS_COLOR[g.cls]} variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={g.status === 'missing' ? 'Missing' : 'Partial'}
                        size="small"
                        color={g.status === 'missing' ? 'error' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{g.assigned}</TableCell>
                    <TableCell align="right">{g.reqs}</TableCell>
                    <TableCell>{g.due}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
