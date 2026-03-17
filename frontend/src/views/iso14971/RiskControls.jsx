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
  { label: 'Design Controls', value: 124, color: 'success', sub: 'Inherent safety' },
  { label: 'Protective Controls', value: 98, color: 'primary', sub: 'Guards, alarms, interlocks' },
  { label: 'Info for Safety', value: 65, color: 'warning', sub: 'Labels, warnings, IFU' },
  { label: 'Verification Rate', value: '94%', color: 'default', sub: 'Controls verified effective' }
];

const CONTROLS = [
  {
    id: 'RC-SW-001',
    type: 'Design',
    desc: 'Independent dose calculation check (dual-channel)',
    hazards: 'H-042',
    module: 'LVP, SYR, PCA',
    verified: true,
    trace: 'SRD-1042..1048'
  },
  {
    id: 'RC-SW-002',
    type: 'Design',
    desc: 'Drug library hard/soft limit enforcement',
    hazards: 'H-089',
    module: 'PCU',
    verified: true,
    trace: 'SRD-2001..2034'
  },
  {
    id: 'RC-SW-003',
    type: 'Protective',
    desc: 'Occlusion detection algorithm + alarm',
    hazards: 'H-017',
    module: 'LVP',
    verified: true,
    trace: 'SRD-3100..3115'
  },
  {
    id: 'RC-SW-004',
    type: 'Protective',
    desc: 'Alarm escalation hierarchy (3-tier)',
    hazards: 'H-103',
    module: 'PCU',
    verified: true,
    trace: 'SRD-4200..4218'
  },
  {
    id: 'RC-SW-005',
    type: 'Protective',
    desc: 'Watchdog timer for main processor',
    hazards: 'H-042, H-056',
    module: 'PCU',
    verified: true,
    trace: 'SRD-1200..1205'
  },
  {
    id: 'RC-SW-006',
    type: 'Design',
    desc: 'Input validation — rate, VTBI, time bounds',
    hazards: 'H-042, H-089',
    module: 'LVP, SYR, PCA',
    verified: true,
    trace: 'SRD-1050..1089'
  },
  {
    id: 'RC-SW-007',
    type: 'Info',
    desc: 'Dose rate confirmation screen before start',
    hazards: 'H-042',
    module: 'PCU',
    verified: true,
    trace: 'SRD-5010..5015'
  },
  {
    id: 'RC-SW-008',
    type: 'Protective',
    desc: 'Air-in-line detection + alarm',
    hazards: 'H-031',
    module: 'LVP',
    verified: 'partial',
    trace: 'SRD-3200..3210'
  },
  {
    id: 'RC-SW-009',
    type: 'Design',
    desc: 'Memory integrity CRC check (continuous)',
    hazards: 'H-056',
    module: 'PCU',
    verified: true,
    trace: 'SRD-1210..1215'
  },
  {
    id: 'RC-SW-010',
    type: 'Info',
    desc: 'SpO2 sensor placement instructions',
    hazards: 'H-078',
    module: 'SPO2',
    verified: true,
    trace: 'SRD-6001..6005'
  }
];

const TYPE_COLOR = { Design: 'success', Protective: 'warning', Info: 'default' };

export default function RiskControls({ projectId }) {
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

      {/* Controls table */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Risk Control Measures — Software Related
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Control ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Hazards</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell align="center">Verified</TableCell>
                  <TableCell>RTM Trace</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CONTROLS.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{c.id}</TableCell>
                    <TableCell>
                      <Chip label={c.type} size="small" color={TYPE_COLOR[c.type]} variant="outlined" />
                    </TableCell>
                    <TableCell>{c.desc}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{c.hazards}</TableCell>
                    <TableCell>{c.module}</TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          mx: 'auto',
                          bgcolor: c.verified === true ? 'success.main' : 'warning.main'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'primary.main' }}>{c.trace}</TableCell>
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
