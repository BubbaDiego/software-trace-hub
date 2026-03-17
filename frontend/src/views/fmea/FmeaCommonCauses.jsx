import { useMemo } from 'react';
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

import { useFmeaCommonCauses } from 'api/fmea';

function KpiCard({ label, value, sub, color }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem' }}>{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color, mt: 0.5 }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function CauseCard({ cause }) {
  return (
    <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 1 }}>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'primary.main', mb: 0.5 }}>{cause.module}</Typography>
      <Typography sx={{ fontSize: '0.75rem', mb: 0.5, lineHeight: 1.5 }}>{cause.common_cause}</Typography>
      {cause.mitigation && (
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.5 }}>
          <strong style={{ color: '#66bb6a' }}>Mitigation: </strong>
          {cause.mitigation}
        </Typography>
      )}
    </Box>
  );
}

export default function FmeaCommonCauses() {
  const { commonCauses, ccLoading } = useFmeaCommonCauses();

  const grouped = useMemo(() => {
    const groups = {};
    (commonCauses || []).forEach((cc) => {
      const key = cc.module || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(cc);
    });
    return groups;
  }, [commonCauses]);

  // Categorize
  const oseGroup = useMemo(() => Object.entries(grouped).filter(([k]) => k.startsWith('OSE')), [grouped]);
  const smxGroup = useMemo(() => Object.entries(grouped).filter(([k]) => k.startsWith('SMX')), [grouped]);
  const appGroup = useMemo(() => Object.entries(grouped).filter(([k]) => k.includes('PCU') || k.includes('LVP') || k.includes('Application')), [grouped]);
  const otherGroup = useMemo(() => Object.entries(grouped).filter(([k]) =>
    !k.startsWith('OSE') && !k.startsWith('SMX') && !k.includes('PCU') && !k.includes('LVP') && !k.includes('Application')
  ), [grouped]);

  if (ccLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  const total = commonCauses?.length || 0;
  const osCount = oseGroup.reduce((a, [, v]) => a + v.length, 0) + smxGroup.reduce((a, [, v]) => a + v.length, 0);
  const subsysCount = otherGroup.reduce((a, [, v]) => a + v.length, 0);
  const appCount = appGroup.reduce((a, [, v]) => a + v.length, 0);

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Common Causes" value={total} sub="Across OS + application" color="#ab47bc" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="OS-Level" value={osCount} sub="OSE + SMX kernel" color="#ffa726" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Subsystem" value={subsysCount} sub="STL, containers, algorithms" color="#26a69a" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Application" value={appCount} sub="Cross-module shared code" color="#4fc3f7" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* OSE Column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>OS Kernel — OSE (Modules)</Typography>
              {oseGroup.map(([, causes]) => causes.map((cc) => <CauseCard key={cc.id} cause={cc} />))}
            </CardContent>
          </Card>
        </Grid>
        {/* SMX Column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>OS Kernel — SMX (PCU)</Typography>
              {smxGroup.map(([, causes]) => causes.map((cc) => <CauseCard key={cc.id} cause={cc} />))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Application + Other in a table */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Application &amp; Subsystem Common Causes</Typography>
            <Chip label="Cross-Module" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.65rem' }} />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Scope / Module</TableCell>
                  <TableCell>Common Cause</TableCell>
                  <TableCell>Mitigation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...appGroup, ...otherGroup].map(([, causes]) =>
                  causes.map((cc) => (
                    <TableRow key={cc.id} hover>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>{cc.module}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{cc.common_cause}</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', color: 'text.secondary', maxWidth: 400 }}>{cc.mitigation}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
