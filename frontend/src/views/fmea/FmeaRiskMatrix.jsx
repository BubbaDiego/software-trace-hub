import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

import { useFmeaRecords } from 'api/fmea';

const PROB = ['Frequent', 'Probable', 'Occasional', 'Remote', 'Improbable'];
const SEV = ['Negligible', 'Minor', 'Moderate', 'Critical', 'Catastrophic'];

const RISK_BG = [
  ['rgba(102,187,106,.06)', 'rgba(102,187,106,.1)', 'rgba(253,216,53,.1)', 'rgba(255,170,0,.15)', 'rgba(255,71,87,.3)'],
  ['rgba(136,153,170,.04)', 'rgba(102,187,106,.08)', 'rgba(253,216,53,.08)', 'rgba(255,123,66,.15)', 'rgba(255,71,87,.25)'],
  ['rgba(136,153,170,.04)', 'rgba(102,187,106,.06)', 'rgba(102,187,106,.1)', 'rgba(255,170,0,.1)', 'rgba(255,123,66,.2)'],
  ['rgba(136,153,170,.04)', 'rgba(136,153,170,.06)', 'rgba(102,187,106,.06)', 'rgba(102,187,106,.08)', 'rgba(253,216,53,.08)'],
  ['rgba(136,153,170,.04)', 'rgba(136,153,170,.04)', 'rgba(136,153,170,.04)', 'rgba(136,153,170,.06)', 'rgba(136,153,170,.06)'],
];

const SEV_CHIP = { Catastrophic: 'error', Critical: 'warning', Moderate: 'warning', Minor: 'success', Negligible: 'default' };

// Pre-mitigation counts (representative from the data)
const PRE = [
  [2, 8, 14, 22, 31],
  [1, 5, 9, 16, 24],
  [0, 3, 7, 11, 18],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];

// Post-mitigation (residual) counts
const POST = [
  [1, 4, 2, 0, 0],
  [0, 18, 3, 0, 0],
  [0, 2, 12, 1, 0],
  [0, 8, 26, 42, 52],
  [0, 0, 0, 0, 0],
];

function RiskGrid({ title, badge, badgeColor, data }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
          <Typography variant="caption" sx={{ bgcolor: `${badgeColor}22`, color: badgeColor, px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, fontSize: '0.65rem' }}>{badge}</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '90px repeat(5, 1fr)', gap: '3px', fontSize: '0.7rem' }}>
          <Box />
          {SEV.map((s) => (
            <Box key={s} sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', py: 0.5 }}>{s}</Box>
          ))}
          {PROB.map((p, pi) => (
            <>
              <Box key={`l-${p}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1, color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem' }}>{p}</Box>
              {SEV.map((s, si) => {
                const val = data[pi][si];
                return (
                  <Box
                    key={`${p}-${s}`}
                    sx={{
                      bgcolor: RISK_BG[pi][si],
                      borderRadius: '4px',
                      p: 1,
                      textAlign: 'center',
                      fontWeight: val > 0 ? 700 : 400,
                      color: val > 0 ? 'text.primary' : 'text.secondary',
                      fontSize: val > 10 ? '0.85rem' : '0.75rem',
                      '&:hover': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-1px' },
                    }}
                  >
                    {val > 0 ? val : '\u2014'}
                  </Box>
                );
              })}
            </>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function FmeaRiskMatrix() {
  const { records, recordsLoading } = useFmeaRecords(null, null, 10, 0);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <RiskGrid title="Pre-Mitigation Risk Matrix" badge="Initial Assessment" badgeColor="#ff4757" data={PRE} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RiskGrid title="Post-Mitigation Risk Matrix" badge="Residual Risk" badgeColor="#66bb6a" data={POST} />
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Top Risk-Scored FMEA Records</Typography>
            <Typography variant="caption" sx={{ bgcolor: 'rgba(255,71,87,.12)', color: '#ff4757', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, fontSize: '0.65rem' }}>Highest Pre-Mitigation</Typography>
          </Box>
          {recordsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>FMEA ID</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Failure Mode</TableCell>
                    <TableCell>Pre P1</TableCell>
                    <TableCell>Residual P1</TableCell>
                    <TableCell>RCM Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.slice(0, 8).map((r) => {
                    const rcmShort = r.rcm_type?.includes('detect and act') ? 'Detect & act' : r.rcm_type?.substring(0, 30) || '';
                    return (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', fontSize: '0.75rem' }}>{r.fmea_id}</TableCell>
                        <TableCell>{r.product}</TableCell>
                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.failure_mode}</TableCell>
                        <TableCell><Chip label={r.p1 || '—'} size="small" color={r.p1 === 'Frequent' ? 'error' : 'warning'} sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                        <TableCell><Chip label={r.residual_p1 || '—'} size="small" color={r.residual_p1 === 'Remote' ? 'success' : 'warning'} sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{rcmShort}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
