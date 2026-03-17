import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

// ---------------------------------------------------------------------------
// Static data — will be replaced by API once backend exists
// ---------------------------------------------------------------------------
const SEVERITY = ['Negligible', 'Minor', 'Serious', 'Critical', 'Catastrophic'];
const PROBABILITY = ['Improbable', 'Remote', 'Occasional', 'Probable', 'Frequent'];

// risk color index: 0=negligible(green), 1=low(yellow), 2=medium(orange), 3=high(red), 4=unacceptable(darkred)
const RISK_LEVEL = [
  // Negligible  Minor  Serious  Critical  Catastrophic   (rows: Improbable → Frequent)
  [0, 0, 0, 0, 1], // Improbable
  [0, 0, 0, 1, 2], // Remote
  [0, 0, 1, 2, 3], // Occasional
  [0, 1, 2, 3, 3], // Probable
  [1, 2, 3, 3, 4] // Frequent
];

// Pre-mitigation counts (row=probability index, col=severity index)
const PRE_COUNTS = [
  [6, 4, 2, 1, 0],
  [12, 9, 7, 11, 4],
  [8, 10, 14, 9, 3],
  [5, 8, 12, 6, 2],
  [2, 4, 3, 1, 0]
];

// Post-mitigation counts
const POST_COUNTS = [
  [8, 3, 1, 0, 0],
  [18, 12, 10, 8, 2],
  [14, 16, 12, 4, 2],
  [8, 10, 5, 3, 1],
  [3, 2, 1, 0, 0]
];

const TOP_HAZARDS = [
  {
    id: 'H-042',
    desc: 'Over-infusion due to software calculation error',
    cat: 'Software',
    sev: 'Catastrophic',
    probPre: 'Probable',
    riskPre: 'High',
    probPost: 'Improbable',
    riskPost: 'Low',
    controls: 4
  },
  {
    id: 'H-017',
    desc: 'Undetected occlusion leading to under-dosing',
    cat: 'Mechanical',
    sev: 'Critical',
    probPre: 'Occasional',
    riskPre: 'High',
    probPost: 'Remote',
    riskPost: 'Low',
    controls: 3
  },
  {
    id: 'H-089',
    desc: 'Incorrect drug library selection',
    cat: 'Use error',
    sev: 'Critical',
    probPre: 'Probable',
    riskPre: 'High',
    probPost: 'Occasional',
    riskPost: 'Med',
    controls: 5
  },
  {
    id: 'H-103',
    desc: 'Alarm fatigue — critical alarm missed',
    cat: 'Use error',
    sev: 'Catastrophic',
    probPre: 'Occasional',
    riskPre: 'High',
    probPost: 'Remote',
    riskPost: 'Low',
    controls: 6
  },
  {
    id: 'H-056',
    desc: 'EMC interference corrupting dose rate',
    cat: 'Environmental',
    sev: 'Serious',
    probPre: 'Frequent',
    riskPre: 'High',
    probPost: 'Improbable',
    riskPost: 'Low',
    controls: 3
  }
];

const RISK_BG = ['rgba(102,187,106,0.25)', 'rgba(253,216,53,0.25)', 'rgba(255,167,38,0.3)', 'rgba(239,83,80,0.35)', 'rgba(183,28,28,0.4)'];

function riskChipColor(r) {
  return r === 'High' ? 'error' : r === 'Med' ? 'warning' : 'success';
}

function MatrixGrid({ title, counts, subtitle }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
          {subtitle}
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '70px repeat(5, 1fr)',
          gridTemplateRows: 'repeat(5, 48px) 30px',
          gap: '3px',
          mt: 1
        }}
      >
        {/* Rows: reverse so Frequent is at top */}
        {[...PROBABILITY].reverse().map((prob, ri) => {
          const rowIdx = PROBABILITY.length - 1 - ri;
          return (
            <React.Fragment key={prob}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'text.secondary',
                  fontWeight: 600
                }}
              >
                {prob}
              </Box>
              {SEVERITY.map((sev, ci) => {
                const level = RISK_LEVEL[rowIdx][ci];
                const count = counts[rowIdx][ci];
                return (
                  <Tooltip key={sev} title={`${prob} x ${sev}: ${count} hazards`} arrow>
                    <Box
                      sx={{
                        bgcolor: RISK_BG[level],
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'transform 0.15s',
                        '&:hover': { transform: 'scale(1.06)', zIndex: 1 }
                      }}
                    >
                      {count}
                    </Box>
                  </Tooltip>
                );
              })}
            </React.Fragment>
          );
        })}
        {/* Severity axis labels */}
        <Box />
        {SEVERITY.map((s) => (
          <Box
            key={s}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'text.secondary', fontWeight: 600 }}
          >
            {s}
          </Box>
        ))}
      </Box>
      {/* Legend */}
      <Box sx={{ mt: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {['Negligible', 'Low', 'Medium', 'High', 'Unacceptable'].map((label, i) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: RISK_BG[i] }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function RiskMatrix({ projectId }) {
  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Risk Estimation Matrix (Severity x Probability)
          </Typography>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <MatrixGrid title="PRE-MITIGATION" counts={PRE_COUNTS} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MatrixGrid
                title="POST-MITIGATION (Residual)"
                counts={POST_COUNTS}
                subtitle="All residual risks in acceptable or ALARP region"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Top Hazards */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Highest Pre-Mitigation Risks
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hazard ID</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Prob (Pre)</TableCell>
                  <TableCell align="center">Risk (Pre)</TableCell>
                  <TableCell>Prob (Post)</TableCell>
                  <TableCell align="center">Risk (Post)</TableCell>
                  <TableCell align="center">Controls</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {TOP_HAZARDS.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{h.id}</TableCell>
                    <TableCell>{h.desc}</TableCell>
                    <TableCell>{h.cat}</TableCell>
                    <TableCell>{h.sev}</TableCell>
                    <TableCell>{h.probPre}</TableCell>
                    <TableCell align="center">
                      <Chip label={h.riskPre} size="small" color={riskChipColor(h.riskPre)} variant="outlined" />
                    </TableCell>
                    <TableCell>{h.probPost}</TableCell>
                    <TableCell align="center">
                      <Chip label={h.riskPost} size="small" color={riskChipColor(h.riskPost)} variant="outlined" />
                    </TableCell>
                    <TableCell align="center">{h.controls}</TableCell>
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
