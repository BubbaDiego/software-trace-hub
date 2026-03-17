import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';

// ---------------------------------------------------------------------------
// Static clause data — will be replaced by API once backend exists
// ---------------------------------------------------------------------------
const CLAUSES = [
  {
    id: '5.1',
    title: 'Software Development Planning',
    status: 'full',
    reqs: 12,
    linked: 'SRD-0001..0012',
    desc: 'Establish software development plan including lifecycle model, deliverables, traceability, and configuration management.'
  },
  {
    id: '5.2',
    title: 'Software Requirements Analysis',
    status: 'full',
    reqs: 28,
    linked: 'SRD-0100..0450',
    desc: 'Define and document software requirements derived from system requirements and risk control measures.'
  },
  {
    id: '5.2.6',
    title: 'Re-evaluate medical device risk analysis',
    status: 'partial',
    reqs: 31,
    linked: 'SRD-0320..0351',
    desc: 'Update risk analysis when software requirements change. Ensure bidirectional traceability.'
  },
  {
    id: '5.3',
    title: 'Software Architectural Design',
    status: 'full',
    reqs: 18,
    linked: 'SRD-0500..0518',
    desc: 'Transform requirements into architecture. Define software items and interfaces.'
  },
  {
    id: '5.3.3',
    title: 'Verify architecture supports safety classification',
    status: 'missing',
    reqs: 42,
    linked: 'SRD-0520..0562',
    desc: 'Verify architectural design implements risk controls and supports assigned safety classes.'
  },
  {
    id: '5.4',
    title: 'Software Detailed Design',
    status: 'partial',
    reqs: 156,
    linked: 'SRD-0600..0756',
    desc: 'Refine architecture into detailed design for each software unit. Required for Class B and C.'
  },
  {
    id: '5.4.2',
    title: 'Detailed design for each software unit',
    status: 'missing',
    reqs: 156,
    linked: 'SRD-0600..0756',
    desc: 'Document detailed design for each unit at level sufficient for implementation and verification.'
  },
  {
    id: '5.5',
    title: 'Software Unit Implementation & Verification',
    status: 'partial',
    reqs: 89,
    linked: 'SRD-0800..0889',
    desc: 'Implement units per detailed design. Verify acceptance criteria. Required for Class B and C.'
  },
  {
    id: '5.5.5',
    title: 'Unit verification acceptance criteria',
    status: 'missing',
    reqs: 89,
    linked: 'SRD-0800..0889',
    desc: 'Define and document acceptance criteria for unit verification. Trace to detailed design.'
  },
  {
    id: '5.6',
    title: 'Software Integration & Integration Testing',
    status: 'partial',
    reqs: 203,
    linked: 'SRD-1000..1203',
    desc: 'Integrate software items. Verify integration per plan. Document anomalies.'
  },
  {
    id: '5.7',
    title: 'Software System Testing',
    status: 'full',
    reqs: 340,
    linked: 'SRD-1500..1840',
    desc: 'Test integrated software against requirements. Document results and traceability.'
  },
  {
    id: '5.8',
    title: 'Software Release',
    status: 'full',
    reqs: 8,
    linked: 'SRD-1900..1908',
    desc: 'Ensure all activities complete. Archive release package. Document known anomalies.'
  },
  {
    id: '6.1',
    title: 'Software Maintenance Plan',
    status: 'full',
    reqs: 6,
    linked: 'SRD-2000..2006',
    desc: 'Establish plan for monitoring, analyzing, and addressing post-market feedback.'
  },
  {
    id: '6.2.2',
    title: 'Problem analysis and change impact',
    status: 'missing',
    reqs: 24,
    linked: 'SRD-2010..2034',
    desc: 'Analyze reported problems. Assess impact of changes. Determine appropriate action.'
  },
  {
    id: '7.1',
    title: 'Risk Analysis for Software Items',
    status: 'partial',
    reqs: 67,
    linked: 'SRD-3000..3067',
    desc: 'Identify software items that could contribute to hazardous situations.'
  },
  {
    id: '7.1.3',
    title: 'Document potential causes of hazard contribution',
    status: 'missing',
    reqs: 67,
    linked: 'SRD-3000..3067',
    desc: 'For each software item contributing to a hazard, document the sequence of events and potential causes.'
  },
  {
    id: '8.1',
    title: 'Software Configuration Management Planning',
    status: 'full',
    reqs: 4,
    linked: 'SRD-4000..4004',
    desc: 'Establish CM plan including identification, change control, and status accounting.'
  },
  {
    id: '9.5',
    title: 'Trend analysis of software problems',
    status: 'missing',
    reqs: 8,
    linked: 'SRD-5000..5008',
    desc: 'Analyze trends in software problem reports. Identify systemic issues.'
  }
];

const STATUS_META = {
  full: { label: 'Traced', color: 'success' },
  partial: { label: 'Partial', color: 'warning' },
  missing: { label: 'Missing', color: 'error' }
};

function ClauseCard({ clause }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[clause.status];

  return (
    <Card sx={{ mb: 1 }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        onClick={() => setOpen(!open)}
      >
        <IconButton size="small" sx={{ mr: 1 }}>
          {open ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
        </IconButton>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main', mr: 1.5, minWidth: 48 }}>
          {clause.id}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
          {clause.title}
        </Typography>
        <Chip label={meta.label} size="small" color={meta.color} variant="outlined" sx={{ mr: 2 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {clause.reqs} reqs linked
        </Typography>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {clause.desc}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
              RTM Requirements:{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                {clause.linked}
              </Box>
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
}

export default function IecClauseBreakdown({ projectId }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return CLAUSES;
    return CLAUSES.filter((c) => c.status === filter);
  }, [filter]);

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          size="small"
          onChange={(_, v) => {
            if (v !== null) setFilter(v);
          }}
        >
          <ToggleButton value="all">All ({CLAUSES.length})</ToggleButton>
          <ToggleButton value="full">Fully Traced ({CLAUSES.filter((c) => c.status === 'full').length})</ToggleButton>
          <ToggleButton value="partial">Partial ({CLAUSES.filter((c) => c.status === 'partial').length})</ToggleButton>
          <ToggleButton value="missing">Missing ({CLAUSES.filter((c) => c.status === 'missing').length})</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {filtered.map((clause) => (
        <ClauseCard key={clause.id} clause={clause} />
      ))}
    </Box>
  );
}
