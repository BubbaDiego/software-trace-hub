import { useState } from 'react';
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
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';

// ---------------------------------------------------------------------------
// Static data — will be replaced by API once backend exists
// ---------------------------------------------------------------------------
const CLAUSES = [
  { id: '3', title: 'General requirements for risk management', subs: 3, status: 'complete', evidence: 'Risk Mgmt Plan v4.2', links: 12 },
  {
    id: '4',
    title: 'Risk analysis',
    subs: 5,
    status: 'complete',
    evidence: 'Risk Analysis Report v3.1',
    links: 142,
    children: [
      { id: '4.2', req: 'Intended use and reasonably foreseeable misuse', status: 'complete', evidence: 'IFU-ALR-001 Rev D', hazards: '—' },
      {
        id: '4.3',
        req: 'Identification of safety-related characteristics',
        status: 'complete',
        evidence: 'RA-ALR-001 Sec 3',
        hazards: 142
      },
      {
        id: '4.4',
        req: 'Identification of hazards and hazardous situations',
        status: 'complete',
        evidence: 'RA-ALR-001 Sec 4',
        hazards: 142
      },
      { id: '4.5', req: 'Risk estimation', status: 'complete', evidence: 'RA-ALR-001 Sec 5 + Matrix', hazards: 142 },
      { id: '4.6', req: 'Sequence of foreseeable events', status: 'complete', evidence: 'FTA-ALR-001', hazards: 34 }
    ]
  },
  { id: '5', title: 'Risk evaluation', subs: 2, status: 'complete', evidence: 'Risk Eval Matrix v3.1', links: 142 },
  { id: '6', title: 'Risk control', subs: 4, status: 'in_progress', evidence: 'Risk Controls DB', links: 287 },
  {
    id: '7',
    title: 'Evaluation of overall residual risk',
    subs: 2,
    status: 'in_progress',
    evidence: 'Benefit-Risk Analysis draft',
    links: 24
  },
  { id: '8', title: 'Risk management review', subs: 3, status: 'pending', evidence: '—', links: 0 },
  { id: '9', title: 'Production and post-production', subs: 3, status: 'pending', evidence: '—', links: 0 },
  { id: 'A', title: 'Annex A — Rationale', subs: null, status: 'informative', evidence: '—', links: null },
  { id: 'B', title: 'Annex B — Risk management process', subs: null, status: 'informative', evidence: '—', links: null },
  { id: 'C', title: 'Annex C — Fundamental risk concepts', subs: null, status: 'informative', evidence: '—', links: null }
];

const STATUS_META = {
  complete: { label: 'Complete', color: 'success' },
  in_progress: { label: 'In Progress', color: 'warning' },
  pending: { label: 'Pending', color: 'error' },
  informative: { label: 'Informative', color: 'default' }
};

function ExpandableClause({ clause }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[clause.status];
  const expandable = clause.children?.length > 0;

  return (
    <>
      <TableRow hover sx={{ cursor: expandable ? 'pointer' : 'default' }} onClick={() => expandable && setOpen(!open)}>
        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {expandable && (
              <IconButton size="small" sx={{ p: 0 }}>
                {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </IconButton>
            )}
            {clause.id}
          </Box>
        </TableCell>
        <TableCell>{clause.title}</TableCell>
        <TableCell align="center">{clause.subs ?? '—'}</TableCell>
        <TableCell align="center">
          <Chip label={meta.label} size="small" color={meta.color} variant="outlined" />
        </TableCell>
        <TableCell>{clause.evidence}</TableCell>
        <TableCell align="center">{clause.links ?? '—'}</TableCell>
      </TableRow>
      {expandable && (
        <TableRow>
          <TableCell colSpan={6} sx={{ p: 0, borderBottom: open ? undefined : 'none' }}>
            <Collapse in={open}>
              <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sub-clause</TableCell>
                      <TableCell>Requirement</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell>Evidence Document</TableCell>
                      <TableCell align="center">Hazards Linked</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clause.children.map((c) => {
                      const cm = STATUS_META[c.status];
                      return (
                        <TableRow key={c.id}>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{c.id}</TableCell>
                          <TableCell>{c.req}</TableCell>
                          <TableCell align="center">
                            <Chip label={cm.label} size="small" color={cm.color} variant="outlined" />
                          </TableCell>
                          <TableCell>{c.evidence}</TableCell>
                          <TableCell align="center">{c.hazards}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function IsoClauseCompliance({ projectId }) {
  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            ISO 14971:2019 Clause Compliance Status
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Clause</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell align="center">Sub-clauses</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Evidence</TableCell>
                  <TableCell align="center">RTM Links</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CLAUSES.map((c) => (
                  <ExpandableClause key={c.id} clause={c} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
