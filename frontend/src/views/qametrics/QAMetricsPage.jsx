import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
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
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import PageTitle from 'components/PageTitle';
import { useRtmProjects, useQaMetrics } from 'api/rtm';
import { useTraceGraph } from 'api/trace';
import { swimlaneLayout, TYPE_COLORS } from 'views/trace/traceLayout';
import { nodeTypes } from 'views/trace/TraceNode';
import TraceDetailPanel from 'views/trace/TraceDetailPanel';

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

function FeatureTable({ data }) {
  const maxCount = data[0]?.total_tcs || 1;

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
          {data.map(f => (
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

function SpecTable({ data }) {
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
          {data.map(s => (
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
  const [featureFilter, setFeatureFilter] = useState('All');
  const [reqFilter, setReqFilter] = useState('All');
  const [specFilter, setSpecFilter] = useState('All');
  const [hazardFilter, setHazardFilter] = useState('All');

  // Pass filters to backend — all panels re-query together
  const { metrics, loading } = useQaMetrics(activeId, {
    feature: featureFilter,
    srdId: reqFilter,
    specId: specFilter,
    hazardId: hazardFilter,
  });

  const m = metrics || {};
  const featureData = m.feature_tcs || [];
  const specData = m.spec_tcs || [];
  const flowData = m.flow_data || [];

  // Dropdown options come from unfiltered lists (always show all choices)
  const featureOptions = useMemo(() => ['All', ...(m.all_features || [])], [m.all_features]);
  const reqOptions = useMemo(() => ['All', ...(m.all_requirements || [])], [m.all_requirements]);
  const specOptions = useMemo(() => ['All', ...(m.all_specs || [])], [m.all_specs]);
  const hazardOptions = useMemo(() => ['All', ...(m.all_hazards || [])], [m.all_hazards]);

  const hasFilters = featureFilter !== 'All' || reqFilter !== 'All' || specFilter !== 'All' || hazardFilter !== 'All';

  if (!activeProject) {
    return (
      <Box>
        <PageTitle bold="QA" accent="METRICS" icon="qa" sub="Import an RTM project first via Data Sources." />
        <Alert severity="info" sx={{ maxWidth: 500 }}>No RTM project loaded.</Alert>
      </Box>
    );
  }

  if (loading && !metrics) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  // Build sankey data from filtered flow_data
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <PageTitle bold="QA" accent="METRICS" icon="qa" />
      </Box>

      {/* Top-level KPI row — Features first, Total Test Cases last */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          ['Features', m.unique_features, '#00d68f'],
          ['Requirements', m.unique_requirements, '#a855f7'],
          ['Specifications', m.unique_specs, '#f5a623'],
          ['Total Test Cases', m.total_test_cases, '#4af'],
        ].map(([label, val, color]) => (
          <Grid key={label} size={{ xs: 6, md: 3 }}>
            <Card sx={{ borderTop: `2px solid ${color}` }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.disabled' }}>{label}</Typography>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'monospace', color: '#fff', mt: 0.5 }}>
                  {(val || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter cards with searchable Autocomplete — no redundant Total TC card */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {[
          { label: 'Feature', value: featureFilter, set: setFeatureFilter, options: featureOptions },
          { label: 'Requirement ID', value: reqFilter, set: setReqFilter, options: reqOptions },
          { label: 'Specification ID', value: specFilter, set: setSpecFilter, options: specOptions },
          { label: 'Hazard ID', value: hazardFilter, set: setHazardFilter, options: hazardOptions },
        ].map(({ label, value, set, options }) => (
          <Card key={label} sx={{ px: 1.5, py: 1, flex: '1 1 170px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.disabled', mb: 0.5 }}>{label}</Typography>
            <Autocomplete
              size="small"
              value={value}
              onChange={(_, v) => set(v || 'All')}
              options={options}
              disableClearable={value === 'All'}
              renderInput={(params) => (
                <TextField {...params} variant="standard" placeholder="Type to search…"
                  InputProps={{ ...params.InputProps, disableUnderline: true, sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                />
              )}
              slotProps={{
                listbox: { sx: { maxHeight: 280, fontSize: '0.78rem', fontFamily: 'monospace', '& .MuiAutocomplete-option': { py: 0.5, minHeight: 28 } } },
                paper: { sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } },
              }}
            />
          </Card>
        ))}
      </Box>

      {/* ── DRILLED MODE: Requirement selected → trace up top + compact summary ── */}
      {m.selected_requirement_id ? (
        <>
          <TracePanel requirementId={m.selected_requirement_id} srdId={reqFilter} />

          {/* Compact summary strip */}
          <Grid container spacing={1.5} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6c5ce7' }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Feature-Wise Test Case Count</Typography>
                  </Box>
                  <FeatureTable data={featureData} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ffaa00' }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Specification-Wise Test Case Count</Typography>
                  </Box>
                  <SpecTable data={specData} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        /* ── DASHBOARD MODE: No specific requirement → full 2x2 layout ── */
        <>
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
                  <FeatureTable data={featureData} />
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
                  <SpecTable data={specData} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

// ── Inline Trace Swimlane ────────────────────────────────────────

const TRACE_LEGEND = [
  { type: 'requirement', label: 'Requirement' },
  { type: 'spec', label: 'Spec Ref' },
  { type: 'feature', label: 'Feature' },
  { type: 'design', label: 'Design' },
  { type: 'test', label: 'Test' },
  { type: 'hazard', label: 'Hazard' },
  { type: 'fmea', label: 'FMEA' },
  { type: 'version', label: 'Version' },
  { type: 'gap', label: 'Gap' },
];

function TracePanel({ requirementId, srdId }) {
  const { graph, traceLoading } = useTraceGraph(requirementId);
  const [selectedNode, setSelectedNode] = useState(null);

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return swimlaneLayout(graph.nodes, graph.edges);
  }, [graph]);

  const handleNodeClick = useCallback((_, node) => {
    if (node.type === 'laneHeader') return;
    const raw = graph?.nodes?.find((n) => n.id === node.id);
    if (raw) setSelectedNode(raw);
  }, [graph]);

  return (
    <>
      <Card sx={{ border: '1px solid rgba(68,170,255,0.2)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4af' }} />
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Traceability Chain — {srdId}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', ml: 0.5 }}>
              Click any node for details
            </Typography>

            {/* Stats chips */}
            {graph?.stats && (
              <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                {Object.entries(graph.stats).map(([k, v]) => v > 0 && (
                  <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined"
                    sx={{ fontSize: '0.6rem', height: 20, borderColor: TYPE_COLORS[k]?.border || '#4af', color: TYPE_COLORS[k]?.text || '#4af' }} />
                ))}
              </Box>
            )}
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
            {TRACE_LEGEND.map(({ type, label }) => (
              <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: TYPE_COLORS[type]?.border || '#4af' }} />
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {/* ReactFlow canvas */}
          <Box sx={{
            width: '100%', height: 420,
            border: '1px solid', borderColor: 'divider', borderRadius: 1,
            bgcolor: 'background.default', overflow: 'hidden',
          }}>
            {traceLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.3}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="rgba(68,170,255,0.06)" gap={20} />
                <Controls showInteractive={false} />
                <MiniMap
                  style={{ background: 'rgba(10,12,24,0.9)' }}
                  maskColor="rgba(68,170,255,0.08)"
                  nodeColor={(n) => TYPE_COLORS[n.data?.nodeType]?.border || '#4af'}
                />
              </ReactFlow>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.disabled' }}>
                No trace data available
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Detail drawer — slides in from right when a node is clicked */}
      <TraceDetailPanel
        node={selectedNode}
        open={!!selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </>
  );
}
