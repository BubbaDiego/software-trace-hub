import { useTheme } from '@mui/material/styles';
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
import Alert from '@mui/material/Alert';

// ---------------------------------------------------------------------------
// Static data — will be replaced by API once backend exists
// ---------------------------------------------------------------------------
const CLASSES = [
  {
    cls: 'C',
    label: 'Class C',
    color: 'error',
    desc: 'Death or serious injury possible',
    modules: 'LVP, SYR, PCA',
    reqs: 3840,
    docLevel: 'Full (all clauses)'
  },
  {
    cls: 'B',
    label: 'Class B',
    color: 'warning',
    desc: 'Non-serious injury possible',
    modules: 'EtCO2, SPO2',
    reqs: 1920,
    docLevel: 'Moderate (selected clauses)'
  },
  {
    cls: 'A',
    label: 'Class A',
    color: 'success',
    desc: 'No injury possible',
    modules: 'PCU, Auto-ID',
    reqs: 980,
    docLevel: 'Basic (minimal clauses)'
  }
];

const APPLICABILITY = [
  { id: '5.1', activity: 'Development planning', a: true, b: true, c: true },
  { id: '5.2', activity: 'Requirements analysis', a: true, b: true, c: true },
  { id: '5.3', activity: 'Architectural design', a: false, b: true, c: true },
  { id: '5.4', activity: 'Detailed design', a: false, b: false, c: true },
  { id: '5.5', activity: 'Unit implementation & verification', a: false, b: true, c: true },
  { id: '5.6', activity: 'Integration & integration testing', a: true, b: true, c: true },
  { id: '5.7', activity: 'System testing', a: true, b: true, c: true },
  { id: '5.8', activity: 'Release', a: true, b: true, c: true },
  { id: '7.1', activity: 'Risk analysis for SW', a: true, b: true, c: true },
  { id: '7.2', activity: 'Risk control measures', a: false, b: true, c: true },
  { id: '7.3', activity: 'Verification of risk controls', a: false, b: true, c: true },
  { id: '7.4', activity: 'Risk management of changes', a: true, b: true, c: true }
];

function Dot({ active }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        mx: 'auto',
        bgcolor: active ? theme.palette.success.main : theme.palette.action.disabled
      }}
    />
  );
}

export default function IecSafetyClasses({ projectId }) {
  return (
    <Box>
      <Grid container spacing={2}>
        {/* Classification table */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Software Safety Classification
              </Typography>
              <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                Safety class determines the rigor of development activities required. Higher class = more documentation, verification, and
                review.
              </Alert>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Modules</TableCell>
                      <TableCell align="right">Reqs</TableCell>
                      <TableCell>Documentation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {CLASSES.map((c) => (
                      <TableRow key={c.cls} hover>
                        <TableCell>
                          <Chip label={c.label} size="small" color={c.color} variant="outlined" />
                        </TableCell>
                        <TableCell>{c.desc}</TableCell>
                        <TableCell>{c.modules}</TableCell>
                        <TableCell align="right">{c.reqs.toLocaleString()}</TableCell>
                        <TableCell>{c.docLevel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Applicability matrix */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Clause Applicability Matrix
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Clause</TableCell>
                      <TableCell>Activity</TableCell>
                      <TableCell align="center">A</TableCell>
                      <TableCell align="center">B</TableCell>
                      <TableCell align="center">C</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {APPLICABILITY.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{row.id}</TableCell>
                        <TableCell>{row.activity}</TableCell>
                        <TableCell align="center">
                          <Dot active={row.a} />
                        </TableCell>
                        <TableCell align="center">
                          <Dot active={row.b} />
                        </TableCell>
                        <TableCell align="center">
                          <Dot active={row.c} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 1.5, display: 'flex', gap: 2, fontSize: 11, color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Dot active /> Required
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Dot active={false} /> Not required
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
