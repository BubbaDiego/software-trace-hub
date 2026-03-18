import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { useStaOverview } from 'api/sta';

function KpiCard({ label, value, sub, color }) {
  return (
    <Card sx={{ height: '100%', borderTop: `2px solid ${color}` }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mt: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function useChart(ref, config) {
  useEffect(() => {
    if (!ref.current) return;
    let chart;
    import('chart.js/auto').then(({ default: Chart }) => {
      chart = new Chart(ref.current, config);
    });
    return () => chart?.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config.data)]);
}

export default function StaOverview({ projectId }) {
  const { overview, loading } = useStaOverview(projectId);
  const donutRef = useRef(null);
  const barRef = useRef(null);

  const ov = overview || {};
  const full = ov.fully_traced || 0;
  const partial = ov.partial_traced || 0;
  const missing = ov.missing_traced || 0;
  const totalSrds = ov.total_srds || 1;
  const specPct = totalSrds ? ((ov.spec_refs || 0) / totalSrds * 100).toFixed(1) : '0';

  useChart(donutRef, {
    type: 'doughnut',
    data: {
      labels: ['Fully Traced', 'Partial', 'Missing'],
      datasets: [{ data: [full, partial, missing], backgroundColor: ['#00d68f', '#f5a623', '#ff4757'], borderWidth: 0 }]
    },
    options: {
      cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, pointStyleWidth: 8, padding: 14, color: '#8b90a8', font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} (${(ctx.parsed / totalSrds * 100).toFixed(1)}%)` } }
      }
    }
  });

  useChart(barRef, {
    type: 'bar',
    data: {
      labels: (ov.module_evidence || []).map(m => m.module_name),
      datasets: [{
        label: 'Test Case Refs',
        data: (ov.module_evidence || []).map(m => m.total_tc),
        backgroundColor: ['#4af', '#00d68f', '#f5a623', '#a855f7', '#ff4757', '#06d6a0', '#38bdf8', '#e056a0', '#fbbf24', '#34d399'],
        borderRadius: 4, barPercentage: 0.65
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { callback: v => v.toLocaleString(), color: '#8b90a8' } },
        y: { grid: { display: false }, ticks: { color: '#8b90a8' } }
      }
    }
  });

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="SRD Requirements" value={ov.total_srds} sub="Product requirements traced" color="#4af" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Spec References" value={`${(ov.spec_refs || 0).toLocaleString()}`} sub={`${specPct}% linked`} color="#00d68f" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Design Outputs" value={ov.design_docs} sub="Unique ASDD document refs" color="#f5a623" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Unit Test Files" value={ov.unit_test_files} sub="Verification source files" color="#4af" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Version Records" value={ov.version_records} sub={`${(ov.module_count || 0)} modules`} color="#00d68f" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard label="Modules" value={ov.module_count} sub="PCU, LVP, SYR, PCA…" color="#f5a623" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
              Traceability Coverage
            </Typography>
            <Box sx={{ height: 260 }}><canvas ref={donutRef} /></Box>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
              Module Test Evidence
            </Typography>
            <Box sx={{ height: 260 }}><canvas ref={barRef} /></Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 1.5, display: 'block' }}>
            PRD Section Distribution
          </Typography>
          {(ov.prd_sections || []).map((s, i) => {
            const max = ov.prd_sections[0]?.srd_count || 1;
            const colors = ['#4af','#00d68f','#f5a623','#a855f7','#ff4757','#06d6a0','#38bdf8','#e056a0','#fbbf24','#34d399','#4af','#00d68f','#f5a623','#a855f7','#ff4757'];
            return (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '180px 1fr 50px', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography variant="body2" noWrap>{s.prd_section}</Typography>
                <Box sx={{ bgcolor: 'rgba(255,255,255,.04)', borderRadius: '3px', height: 12, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: `${s.srd_count / max * 100}%`, bgcolor: colors[i % colors.length], opacity: .7, borderRadius: '3px' }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{s.srd_count}</Typography>
              </Box>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
}
