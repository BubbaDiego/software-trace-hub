import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

// ---------------------------------------------------------------------------
// Static data — will be replaced by API once backend exists
// ---------------------------------------------------------------------------
const KPIS = [
  { label: 'Total Hazards', value: 142, color: 'primary', sub: 'Identified in risk analysis' },
  { label: 'Mitigated', value: 118, color: 'success', sub: '83% mitigated', pct: 83 },
  { label: 'In Progress', value: 16, color: 'warning', sub: '11% in progress', pct: 11 },
  { label: 'Unmitigated', value: 8, color: 'error', sub: '6% unmitigated', pct: 6 },
  { label: 'Residual Risk', value: 'Acceptable', color: 'secondary', sub: 'Per benefit-risk analysis' },
  { label: 'Risk Controls', value: 287, color: 'default', sub: 'Verified effective' }
];

const CATEGORIES = [
  { name: 'Energy (electrical)', hazards: 28, high: 4, med: 8, low: 16, mitigatedPct: 89 },
  { name: 'Biological (contamination)', hazards: 18, high: 2, med: 6, low: 10, mitigatedPct: 94 },
  { name: 'Mechanical (moving parts)', hazards: 12, high: 1, med: 3, low: 8, mitigatedPct: 92 },
  { name: 'Software (incorrect dosing)', hazards: 34, high: 8, med: 12, low: 14, mitigatedPct: 76 },
  { name: 'Use error (misinterpretation)', hazards: 24, high: 3, med: 9, low: 12, mitigatedPct: 79 },
  { name: 'Drug interaction / compatibility', hazards: 16, high: 2, med: 5, low: 9, mitigatedPct: 88 },
  { name: 'Environmental (EMC)', hazards: 10, high: 0, med: 2, low: 8, mitigatedPct: 100 }
];

const REDUCTION = [
  { label: 'Initial', high: 49, med: 43, low: 50 },
  { label: 'After Design', high: 21, med: 36, low: 85 },
  { label: 'After V&V', high: 8, med: 16, low: 118 }
];

function mitColor(p) {
  return p >= 90 ? 'success' : p >= 80 ? 'warning' : 'error';
}

export default function RiskOverview({ projectId }) {
  return (
    <Box>
      {/* KPI Row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {KPIS.map((k) => (
          <Card key={k.label} sx={{ flex: 1, minWidth: 160 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: 10 }}>
                {k.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: k.color === 'default' ? 'text.primary' : `${k.color}.main` }}>
                {typeof k.value === 'number' ? k.value.toLocaleString() : k.value}
              </Typography>
              {k.sub && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {k.sub}
                </Typography>
              )}
              {k.pct != null && (
                <LinearProgress
                  variant="determinate"
                  value={k.pct}
                  sx={{
                    mt: 0.5,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': { bgcolor: `${k.color}.main` }
                  }}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Grid container spacing={2}>
        {/* Hazard Distribution */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Hazard Distribution by Category
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="center">Hazards</TableCell>
                      <TableCell align="center" sx={{ color: 'error.main' }}>
                        High
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'warning.main' }}>
                        Med
                      </TableCell>
                      <TableCell align="center">Low</TableCell>
                      <TableCell align="center">Mitigated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {CATEGORIES.map((c) => (
                      <TableRow key={c.name} hover>
                        <TableCell>{c.name}</TableCell>
                        <TableCell align="center">{c.hazards}</TableCell>
                        <TableCell align="center" sx={{ color: 'error.main', fontWeight: 600 }}>
                          {c.high}
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'warning.main', fontWeight: 600 }}>
                          {c.med}
                        </TableCell>
                        <TableCell align="center">{c.low}</TableCell>
                        <TableCell align="center">
                          <Chip label={`${c.mitigatedPct}%`} size="small" color={mitColor(c.mitigatedPct)} variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Reduction Over Time */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Risk Reduction Over Time
              </Typography>
              {REDUCTION.map((r) => {
                const total = r.high + r.med + r.low;
                const hPct = (r.high / total) * 100;
                const mPct = (r.med / total) * 100;
                return (
                  <Box key={r.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Typography variant="caption" sx={{ width: 90, color: 'text.secondary', flexShrink: 0 }}>
                      {r.label}
                    </Typography>
                    <Box sx={{ flex: 1, height: 24, borderRadius: 1, display: 'flex', overflow: 'hidden' }}>
                      <Box
                        sx={{
                          width: `${hPct}%`,
                          bgcolor: 'error.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'error.contrastText'
                        }}
                      >
                        {r.high}
                      </Box>
                      <Box
                        sx={{
                          width: `${mPct}%`,
                          bgcolor: 'warning.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'warning.contrastText'
                        }}
                      >
                        {r.med}
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: 'success.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'success.contrastText'
                        }}
                      >
                        {r.low}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                {[
                  { label: 'High', color: 'error.main' },
                  { label: 'Medium', color: 'warning.main' },
                  { label: 'Low/Mitigated', color: 'success.main' }
                ].map((l) => (
                  <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: l.color }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {l.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
