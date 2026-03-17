import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';

// ---------------------------------------------------------------------------
// Static data — will be replaced by API hooks once backend routes exist
// ---------------------------------------------------------------------------
const PROCESS_AREAS = [
  { clause: '4', name: 'General Requirements', subclauses: 4, traced: 4, partial: 0, missing: 0 },
  { clause: '5', name: 'Software Development Process', subclauses: 28, traced: 18, partial: 7, missing: 3 },
  { clause: '6', name: 'Software Maintenance Process', subclauses: 8, traced: 5, partial: 2, missing: 1 },
  { clause: '7', name: 'Software Risk Management', subclauses: 12, traced: 8, partial: 3, missing: 1 },
  { clause: '8', name: 'Software Configuration Management', subclauses: 8, traced: 7, partial: 1, missing: 0 },
  { clause: '9', name: 'Software Problem Resolution', subclauses: 8, traced: 6, partial: 1, missing: 1 },
  { clause: 'A', name: 'Annex A — Mapping to ISO 14971', subclauses: 6, traced: 4, partial: 2, missing: 0 },
  { clause: 'B', name: 'Annex B — Guidance', subclauses: 6, traced: 3, partial: 2, missing: 1 },
  { clause: 'C', name: 'Annex C — Legacy Software', subclauses: 6, traced: 3, partial: 1, missing: 2 }
];

const TOTALS = { total: 86, traced: 58, partial: 19, missing: 9, linked: 4218, totalReqs: 6740 };

function pct(n, d) {
  return d ? Math.round((n / d) * 100) : 0;
}
function statusColor(p) {
  return p >= 90 ? 'success' : p >= 70 ? 'warning' : 'error';
}

function KpiCard({ label, value, sub, color }) {
  const theme = useTheme();
  const c =
    color === 'green'
      ? theme.palette.success.main
      : color === 'yellow'
        ? theme.palette.warning.main
        : color === 'red'
          ? theme.palette.error.main
          : color === 'purple'
            ? theme.palette.secondary.main
            : theme.palette.primary.main;
  return (
    <Card sx={{ flex: 1, minWidth: 160 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: 10 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: c }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function IecOverview({ projectId }) {
  const theme = useTheme();
  const covPct = pct(TOTALS.traced, TOTALS.total);

  return (
    <Box>
      {/* KPI Row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <KpiCard label="Total Clauses" value={TOTALS.total} sub="Across 9 process areas" color="accent" />
        <KpiCard label="Fully Traced" value={TOTALS.traced} color="green" />
        <KpiCard label="Partial" value={TOTALS.partial} color="yellow" />
        <KpiCard label="Missing" value={TOTALS.missing} color="red" />
        <KpiCard label="Coverage" value={`${covPct}%`} color="purple" />
        <KpiCard label="RTM Reqs Linked" value={TOTALS.linked.toLocaleString()} sub={`of ${TOTALS.totalReqs.toLocaleString()} total`} />
      </Box>

      <Grid container spacing={2}>
        {/* Coverage Donut */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Coverage Breakdown
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  sx={{
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    position: 'relative',
                    background: `conic-gradient(
                    ${theme.palette.success.main} 0% ${covPct}%,
                    ${theme.palette.warning.main} ${covPct}% ${covPct + pct(TOTALS.partial, TOTALS.total)}%,
                    ${theme.palette.error.main} ${covPct + pct(TOTALS.partial, TOTALS.total)}% 100%
                  )`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      bgcolor: theme.palette.background.paper,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {covPct}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      covered
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { label: `Fully traced (${TOTALS.traced})`, color: theme.palette.success.main },
                    { label: `Partial (${TOTALS.partial})`, color: theme.palette.warning.main },
                    { label: `Missing (${TOTALS.missing})`, color: theme.palette.error.main }
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: item.color }} />
                      <Typography variant="body2">{item.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Process Area Bars */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Process Area Coverage
              </Typography>
              {PROCESS_AREAS.filter((a) => !isNaN(Number(a.clause))).map((area) => {
                const p = pct(area.traced, area.subclauses);
                const col = p >= 90 ? theme.palette.success.main : p >= 70 ? theme.palette.warning.main : theme.palette.error.main;
                return (
                  <Box key={area.clause} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography variant="caption" sx={{ width: 140, color: 'text.secondary', flexShrink: 0 }}>
                      {area.name.length > 20 ? area.name.slice(0, 20) + '...' : area.name} ({area.clause})
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={p}
                        sx={{
                          height: 16,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': { bgcolor: col, borderRadius: 1 }
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, width: 36, textAlign: 'right' }}>
                      {p}%
                    </Typography>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Full Table */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            IEC 62304 Process Areas
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Clause</TableCell>
                  <TableCell>Process Area</TableCell>
                  <TableCell align="center">Subclauses</TableCell>
                  <TableCell align="center">Traced</TableCell>
                  <TableCell align="center">Partial</TableCell>
                  <TableCell align="center">Missing</TableCell>
                  <TableCell align="center">Coverage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PROCESS_AREAS.map((a) => {
                  const p = pct(a.traced, a.subclauses);
                  return (
                    <TableRow key={a.clause} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{a.clause}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell align="center">{a.subclauses}</TableCell>
                      <TableCell align="center">{a.traced}</TableCell>
                      <TableCell align="center">{a.partial}</TableCell>
                      <TableCell align="center">{a.missing}</TableCell>
                      <TableCell align="center">
                        <Chip label={`${p}%`} size="small" color={statusColor(p)} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
