import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import PageTitle from 'components/PageTitle';
import { useRtmProjects, useQaMetrics } from 'api/rtm';

// ── Sankey Flow Diagram ──────────────────────────────────────────

function SankeyFlow({ data }) {
  const containerRef = useRef(null);
  const [paths, setPaths] = useState('');

  const drawPaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const leftNodes = container.querySelectorAll('[data-col="left"]');
    const midNodes = container.querySelectorAll('[data-col="mid"]');
    const rightNodes = container.querySelectorAll('[data-col="right"]');
    if (!leftNodes.length || !midNodes.length || !rightNodes.length) return;

    let d = '';
    const opacities = [0.18, 0.12, 0.16, 0.10, 0.14, 0.12, 0.16, 0.10, 0.14, 0.10];

    for (let i = 0; i < Math.min(leftNodes.length, midNodes.length); i++) {
      const lr = leftNodes[i].getBoundingClientRect();
      const mr = midNodes[i].getBoundingClientRect();
      const x1 = lr.right - cRect.left;
      const y1 = lr.top + lr.height / 2 - cRect.top;
      const x2 = mr.left - cRect.left;
      const y2 = mr.top + mr.height / 2 - cRect.top;
      const cx = (x1 + x2) / 2;
      d += `<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}" fill="none" stroke="rgba(68,170,255,${opacities[i % opacities.length]})" stroke-width="7" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < Math.min(midNodes.length, rightNodes.length); i++) {
      const mr = midNodes[i].getBoundingClientRect();
      const rr = rightNodes[i].getBoundingClientRect();
      const x1 = mr.right - cRect.left;
      const y1 = mr.top + mr.height / 2 - cRect.top;
      const x2 = rr.left - cRect.left;
      const y2 = rr.top + rr.height / 2 - cRect.top;
      const cx = (x1 + x2) / 2;
      d += `<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}" fill="none" stroke="rgba(68,170,255,${opacities[i % opacities.length]})" stroke-width="5" stroke-linecap="round"/>`;
    }
    setPaths(d);
  }, []);

  useEffect(() => {
    const t = setTimeout(drawPaths, 150);
    window.addEventListener('resize', drawPaths);
    return () => { clearTimeout(t); window.removeEventListener('resize', drawPaths); };
  }, [drawPaths, data]);

  const nodeStyle = {
    px: 1.2, py: 0.6, fontSize: '0.72rem',
    bgcolor: 'rgba(68,170,255,0.08)', borderLeft: '2px solid #4af',
    borderRadius: '0 4px 4px 0', color: 'text.primary',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    fontFamily: 'monospace',
  };

  const colTitleStyle = {
    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1.5px', color: 'text.secondary', mb: 0.75, textAlign: 'center',
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative', minHeight: 320 }}>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        dangerouslySetInnerHTML={{ __html: paths }} />
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: 140, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Typography sx={colTitleStyle}>{data.colTitles[0]}</Typography>
        {data.left.map(n => <Box key={n.id} data-col="left" sx={nodeStyle}>{n.label}</Box>)}
      </Box>
      <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 130, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Typography sx={colTitleStyle}>{data.colTitles[1]}</Typography>
        {data.mid.map(n => <Box key={n.id} data-col="mid" sx={nodeStyle}>{n.label}</Box>)}
      </Box>
      <Box sx={{ position: 'absolute', top: 0, right: 0, width: 120, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Typography sx={colTitleStyle}>{data.colTitles[2]}</Typography>
        {data.right.map(n => <Box key={n.id} data-col="right" sx={nodeStyle}>{n.label}</Box>)}
      </Box>
    </Box>
  );
}

// ── Feature Table ────────────────────────────────────────────────

function FeatureTable({ data, filter }) {
  const maxCount = data[0]?.total_tcs || 1;
  const filtered = useMemo(() =>
    filter === 'All' ? data : data.filter(f => f.feature === filter),
    [data, filter]
  );

  return (
    <TableContainer sx={{ maxHeight: 370, overflowY: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Feature</TableCell>
            <TableCell align="right" sx={{ width: 80 }}>Test Cases</TableCell>
            <TableCell sx={{ width: '40%' }}>Distribution</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(f => (
            <TableRow key={f.feature} hover>
              <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                {f.feature}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>
                {f.total_tcs.toLocaleString()}
              </TableCell>
              <TableCell>
                <Box sx={{ position: 'relative', height: 18, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 0.5, overflow: 'hidden' }}>
                  <Box sx={{
                    height: '100%', width: `${(f.total_tcs / maxCount * 100).toFixed(1)}%`,
                    background: 'linear-gradient(90deg, #4af, #6c5ce7)',
                    borderRadius: 0.5, boxShadow: '0 0 8px rgba(68,170,255,0.2)',
                  }} />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Spec Table ───────────────────────────────────────────────────

function SpecTable({ data, filter }) {
  const filtered = useMemo(() =>
    filter === 'All' ? data : data.filter(s => s.spec_id === filter),
    [data, filter]
  );

  return (
    <TableContainer sx={{ maxHeight: 370, overflowY: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Specification ID</TableCell>
            <TableCell align="right">Test Case Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(s => (
            <TableRow key={s.spec_id} hover>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{s.spec_id}</TableCell>
              <TableCell align="right">
                <Chip label={s.total_tcs.toLocaleString()} size="small" sx={{
                  fontFamily: 'monospace', fontWeight: 600, fontSize: '0.72rem', height: 22,
                  bgcolor: s.total_tcs >= 1000 ? 'rgba(68,170,255,0.15)' : s.total_tcs >= 100 ? 'rgba(0,214,143,0.12)' : 'rgba(255,255,255,0.06)',
                  color: s.total_tcs >= 1000 ? '#4af' : s.total_tcs >= 100 ? '#00d68f' : 'text.secondary',
                }} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function QAMetricsPage() {
  const { projects } = useRtmProjects();
  const activeProject = projects?.[0];
  const activeId = activeProject?.id;
  const { metrics, loading } = useQaMetrics(activeId);

  const [featureFilter, setFeatureFilter] = useState('All');
  const [reqFilter, setReqFilter] = useState('All');
  const [specFilter, setSpecFilter] = useState('All');
  const [hazardFilter, setHazardFilter] = useState('All');

  const m = metrics || {};
  const featureData = m.feature_tcs || [];
  const specData = m.spec_tcs || [];
  const flowData = m.flow_data || [];

  const featureOptions = useMemo(() => ['All', ...featureData.map(f => f.feature)], [featureData]);
  const reqOptions = useMemo(() => ['All', ...flowData.map(r => r.srd_id)], [flowData]);
  const specOptions = useMemo(() => ['All', ...specData.map(s => s.spec_id)], [specData]);
  const hazardOptions = useMemo(() => {
    const hazards = (m.hazard_ids || []);
    return ['All', ...hazards];
  }, [m.hazard_ids]);

  if (!activeProject) {
    return (
      <Box>
        <PageTitle bold="QA" accent="METRICS" icon="qa" sub="Import an RTM project first via Data Sources." />
        <Alert severity="info" sx={{ maxWidth: 500 }}>No RTM project loaded.</Alert>
      </Box>
    );
  }

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  // Build sankey data from real flow_data
  const sankeyReq = {
    left: flowData.slice(0, 8).map((r, i) => ({ id: `f${i}`, label: r.feature?.slice(0, 20) || '—' })),
    mid: flowData.slice(0, 8).map((r, i) => ({ id: `r${i}`, label: r.srd_id })),
    right: flowData.slice(0, 8).map((r, i) => ({ id: `t${i}`, label: `${r.total_tcs?.toLocaleString()} TCs` })),
    colTitles: ['Feature', 'Requirement ID', 'Test Cases'],
  };
  const sankeySpec = {
    left: flowData.slice(0, 8).map((r, i) => ({ id: `sf${i}`, label: r.feature?.slice(0, 20) || '—' })),
    mid: flowData.slice(0, 8).map((r, i) => ({ id: `s${i}`, label: r.spec_id || '(none)' })),
    right: flowData.slice(0, 8).map((r, i) => ({ id: `st${i}`, label: `${r.total_tcs?.toLocaleString()} TCs` })),
    colTitles: ['Feature', 'Specification ID', 'Test Cases'],
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <PageTitle bold="QA" accent="METRICS" icon="qa" />
        <Chip label={`${(m.total_test_cases || 0).toLocaleString()} Test Cases`} size="small" sx={{
          fontWeight: 700, fontSize: '0.72rem', fontFamily: 'monospace',
          bgcolor: 'rgba(68,170,255,0.12)', color: '#4af', border: '1px solid rgba(68,170,255,0.25)',
        }} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
        Test case traceability — Feature → Requirement → Specification coverage
      </Typography>

      {/* Filter row — matches Power BI layout: 4 dropdowns + Total TC card */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Card sx={{ px: 2, py: 1, flex: '1 1 160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.disabled', mb: 0.5 }}>Feature</Typography>
          <Select value={featureFilter} onChange={e => setFeatureFilter(e.target.value)} size="small" variant="standard" disableUnderline
            sx={{ fontFamily: 'monospace', fontSize: '0.8rem', '& .MuiSelect-select': { py: 0 } }}>
            {featureOptions.map(f => <MenuItem key={f} value={f} sx={{ fontSize: '0.8rem' }}>{f}</MenuItem>)}
          </Select>
        </Card>
        <Card sx={{ px: 2, py: 1, flex: '1 1 160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.disabled', mb: 0.5 }}>Requirement ID</Typography>
          <Select value={reqFilter} onChange={e => setReqFilter(e.target.value)} size="small" variant="standard" disableUnderline
            sx={{ fontFamily: 'monospace', fontSize: '0.8rem', '& .MuiSelect-select': { py: 0 } }}>
            {reqOptions.map(r => <MenuItem key={r} value={r} sx={{ fontSize: '0.8rem' }}>{r}</MenuItem>)}
          </Select>
        </Card>
        <Card sx={{ px: 2, py: 1, flex: '1 1 160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.disabled', mb: 0.5 }}>Specification ID</Typography>
          <Select value={specFilter} onChange={e => setSpecFilter(e.target.value)} size="small" variant="standard" disableUnderline
            sx={{ fontFamily: 'monospace', fontSize: '0.8rem', '& .MuiSelect-select': { py: 0 } }}>
            {specOptions.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{s}</MenuItem>)}
          </Select>
        </Card>
        <Card sx={{ px: 2, py: 1, flex: '1 1 160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.disabled', mb: 0.5 }}>Hazard ID</Typography>
          <Select value={hazardFilter} onChange={e => setHazardFilter(e.target.value)} size="small" variant="standard" disableUnderline
            sx={{ fontFamily: 'monospace', fontSize: '0.8rem', '& .MuiSelect-select': { py: 0 } }}>
            {hazardOptions.map(h => <MenuItem key={h} value={h} sx={{ fontSize: '0.8rem' }}>{h}</MenuItem>)}
          </Select>
        </Card>
        <Card sx={{ px: 3, py: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: '2px solid #4af', minWidth: 130 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.disabled' }}>Total Test Cases</Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: '#4af', lineHeight: 1.2 }}>
            {(m.total_test_cases || 0).toLocaleString()}
          </Typography>
        </Card>
      </Box>

      {/* Row 1: Flow + Feature Table */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4af' }} />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Feature → Requirement → Test Case Flow</Typography>
              </Box>
              <SankeyFlow data={sankeyReq} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6c5ce7' }} />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Feature-Wise Test Case Count</Typography>
              </Box>
              <FeatureTable data={featureData} filter={featureFilter} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Spec Flow + Spec Table */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00d68f' }} />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Feature → Specification → Test Case Flow</Typography>
              </Box>
              <SankeyFlow data={sankeySpec} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ffaa00' }} />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Specification-Wise Test Case Count</Typography>
              </Box>
              <SpecTable data={specData} filter={specFilter} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
