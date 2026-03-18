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
import { MONTHS, PROJECTS, TRANSITIONS } from './resourceData';

const PROJECT_COLORS = {
  'PCU Refresh': '#4af',
  Automation: '#00d68f',
  'Alaris R2': '#f5a623',
  'Alaris R3': '#a855f7',
  'Apollo R2.5': '#ff4757',
  'Apollo R2.6': '#06d6a0',
  'Alaris R1.1': '#e056a0',
  'Maven (APM)': '#38bdf8',
};

function ProjectDot({ name, size = 8 }) {
  const color = PROJECT_COLORS[name] || '#4af';
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: color,
        flexShrink: 0,
        boxShadow: `0 0 4px ${color}55`,
      }}
    />
  );
}

export default function ProjectView() {
  const totals = Array(12).fill(0);
  Object.values(PROJECTS).forEach((vals) => vals.forEach((v, i) => (totals[i] += v)));

  return (
    <Box>
      {/* Heatmap */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Monthly FTE Allocation by Project
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '140px repeat(12, 1fr)',
              gap: '3px',
              fontSize: 11
            }}
          >
            <Box />
            {MONTHS.map((m) => (
              <Box key={m} sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 600, fontSize: 10, py: 0.5 }}>
                {m}
              </Box>
            ))}
            {Object.entries(PROJECTS).map(([name, vals]) => {
              const peak = Math.max(...vals, 1);
              return [
                <Box key={`${name}-l`} sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600, textAlign: 'right', pr: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
                  <ProjectDot name={name} size={7} />
                  {name}
                </Box>,
                ...vals.map((v, i) => (
                  <Box
                    key={`${name}-${i}`}
                    sx={{
                      textAlign: 'center',
                      borderRadius: '3px',
                      py: 0.5,
                      fontWeight: 600,
                      bgcolor: v > 0 ? `primary.main` : 'action.hover',
                      opacity: v > 0 ? Math.max(0.25, v / peak) : 0.3,
                      color: v > 0 ? 'primary.contrastText' : 'text.disabled'
                    }}
                  >
                    {v > 0 ? v.toFixed(1) : '\u2014'}
                  </Box>
                ))
              ];
            })}
            {/* Totals */}
            <Box sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'right', pr: 1, borderTop: 1, borderColor: 'divider', pt: 0.5 }}>
              TOTAL
            </Box>
            {totals.map((v, i) => (
              <Box
                key={`total-${i}`}
                sx={{
                  textAlign: 'center',
                  fontWeight: 700,
                  color: 'primary.main',
                  borderTop: 1,
                  borderColor: 'divider',
                  pt: 0.5
                }}
              >
                {v.toFixed(1)}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Project cards */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {Object.entries(PROJECTS).map(([name, vals]) => {
          const peak = Math.max(...vals);
          const avg = vals.reduce((a, b) => a + b, 0) / 12;
          const activeMonths = vals.filter((v) => v > 0).length;
          const color = PROJECT_COLORS[name] || '#4af';
          return (
            <Grid key={name} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    <ProjectDot name={name} size={9} />
                    <Typography variant="subtitle2">{name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box>
                      <Typography variant="overline" sx={{ fontSize: 9, color: 'text.secondary' }}>
                        Peak
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {peak.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="overline" sx={{ fontSize: 9, color: 'text.secondary' }}>
                        Avg
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {avg.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="overline" sx={{ fontSize: 9, color: 'text.secondary' }}>
                        Months
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {activeMonths}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: '2px', height: 28, alignItems: 'flex-end' }}>
                    {vals.map((v, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          bgcolor: color,
                          opacity: v > 0 && peak > 0 ? Math.max(0.15, v / peak) : 0.05,
                          height: v > 0 && peak > 0 ? `${Math.max(15, (v / peak) * 100)}%` : '4px',
                          borderRadius: '2px'
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Transitions */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Project Transitions (People on Multiple Projects)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Transition</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {TRANSITIONS.map((t) => (
                  <TableRow key={t.name} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                    <TableCell>{t.team}</TableCell>
                    <TableCell>{t.from}</TableCell>
                    <TableCell>{t.to}</TableCell>
                    <TableCell>{t.when}</TableCell>
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
