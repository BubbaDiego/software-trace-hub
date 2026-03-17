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
import { TEAM_FTE_CONTRACTOR, LOCATIONS } from './resourceData';

const KPIS = [
  { label: 'Total Headcount', value: 58, sub: '50.5 FTE + 7.5 Contractor', color: 'primary' },
  { label: 'Unique People', value: 59, sub: '10 on multiple projects', color: 'default' },
  { label: 'Active Projects', value: 10, sub: '+ Automation & Maven', color: 'success' },
  { label: 'Teams', value: 8, sub: 'Across 5 locations', color: 'secondary' },
  { label: 'Peak FTE (Month)', value: '42.2', sub: 'Mar-Apr 2026', color: 'warning' },
  { label: 'Avg Utilization', value: '87%', sub: 'Allocated / available', color: 'info' }
];

const TEAM_BARS = [
  { name: 'BD TCI', val: 15 },
  { name: 'Platform', val: 13.2 },
  { name: 'Application', val: 8.5 },
  { name: 'Firmware', val: 4 },
  { name: 'Dispensing', val: 3 },
  { name: 'Innovation', val: 2 },
  { name: 'RPM', val: 2 },
  { name: 'BD RCI', val: 1 }
];

const BAR_COLORS = ['primary', 'secondary', 'success', 'warning', 'info', 'error', 'primary', 'secondary'];

export default function ResourceDashboard() {
  const theme = useTheme();

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
                {k.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {k.sub}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Grid container spacing={2}>
        {/* Team bars */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                FTE by Team
              </Typography>
              {TEAM_BARS.map((t, i) => {
                const pct = Math.round((t.val / 15) * 100);
                return (
                  <Box key={t.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography variant="caption" sx={{ width: 100, color: 'text.secondary', textAlign: 'right', flexShrink: 0 }}>
                      {t.name}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={BAR_COLORS[i]}
                        sx={{ height: 18, borderRadius: 1, bgcolor: 'action.hover' }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, width: 36, textAlign: 'right' }}>
                      {t.val}
                    </Typography>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Locations */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Headcount by Location
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, py: 1 }}>
                {LOCATIONS.map((loc) => (
                  <Box key={loc.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        border: `3px solid ${theme.palette.primary.main}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14
                      }}
                    >
                      {loc.count}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {loc.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {loc.pct}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FTE vs Contractor table */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            FTE vs Contractor by Team
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell align="center">FTE</TableCell>
                  <TableCell align="center">Contractor</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell>Mix</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {TEAM_FTE_CONTRACTOR.map((t) => {
                  const total = t.fte + t.contractor;
                  const ftePct = total > 0 ? (t.fte / total) * 100 : 100;
                  return (
                    <TableRow key={t.team} hover>
                      <TableCell>{t.team}</TableCell>
                      <TableCell align="center">{t.fte}</TableCell>
                      <TableCell align="center">{t.contractor}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {total}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', height: 10, borderRadius: 1, overflow: 'hidden', width: 160 }}>
                          <Box sx={{ width: `${ftePct}%`, bgcolor: 'primary.main' }} />
                          {t.contractor > 0 && <Box sx={{ width: `${100 - ftePct}%`, bgcolor: 'warning.main' }} />}
                        </Box>
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
