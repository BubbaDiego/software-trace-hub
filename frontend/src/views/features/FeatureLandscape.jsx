import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import { IconLayoutGrid, IconChartBar, IconChartDonut } from '@tabler/icons-react';
import { useFeatureLandscape, useRtmOverview } from 'api/rtm';

const MOD_COLORS = { PCU: '#4af', LVP: '#00d68f', SYR: '#f5a623', PCA: '#a855f7', ETCO2: '#ff4757', 'Auto-ID': '#06d6a0', SPO2: '#38bdf8' };

function KpiCard({ label, value, sub, color }) {
  return (
    <Card sx={{ height: '100%', borderTop: `2px solid ${color}` }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mt: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function covColor(pct) {
  if (pct >= 20) return '#00d68f';
  if (pct >= 10) return '#f5a623';
  if (pct > 0) return '#ff4757';
  return '#484e6a';
}

/* ═══════════════════════════════════════════════════════════════ */
/* VIEW A: TIERED CARDS                                          */
/* ═══════════════════════════════════════════════════════════════ */
function TreemapTile({ feature, total, coverage_pct, sub_feature_count, module_count, modules, maxTotal }) {
  const cc = covColor(coverage_pct);
  const weight = Math.log2(total + 1) / Math.log2(maxTotal + 1);
  return (
    <Tooltip arrow title={
      <Box sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
        <strong>{feature}</strong><br />
        {total.toLocaleString()} requirements &middot; {coverage_pct}% coverage<br />
        {sub_feature_count} sub-features &middot; {module_count} modules<br />
        {modules.join(', ')}
      </Box>
    }>
      <Box sx={{
        flex: `${Math.max(weight * 10, 1.5)} 0 0`, minWidth: 100, maxWidth: weight > 0.7 ? 320 : 220, height: 80,
        bgcolor: `${cc}10`, border: `1px solid ${cc}30`, borderRadius: 1, p: 1.25,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        cursor: 'default', overflow: 'hidden', transition: 'border-color .15s, background-color .15s',
        '&:hover': { borderColor: `${cc}88`, bgcolor: `${cc}18` },
      }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#e8eaf0', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {feature}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{total.toLocaleString()}</Typography>
            <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,.4)' }}>reqs</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 30, height: 4, bgcolor: 'rgba(255,255,255,.06)', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${Math.max(coverage_pct, 2)}%`, bgcolor: cc, borderRadius: 1 }} />
            </Box>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 600, color: cc, minWidth: 28, textAlign: 'right' }}>{coverage_pct}%</Typography>
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
}

function TieredCardsView({ allItems, maxCount }) {
  const tier1 = allItems.filter(f => f.total >= 200);
  const tier2 = allItems.filter(f => f.total >= 50 && f.total < 200);
  const tier3 = allItems.filter(f => f.total < 50);
  const tiers = [
    { label: `Large Features — 200+ requirements (${tier1.length})`, items: tier1 },
    { label: `Medium Features — 50–199 requirements (${tier2.length})`, items: tier2 },
    { label: `Small Features — under 50 requirements (${tier3.length})`, items: tier3 },
  ];
  return (
    <Card>
      <CardContent>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 0.5, display: 'block' }}>
          Feature Landscape
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2, fontSize: '0.68rem' }}>
          Sized by requirement count · Colored by coverage:{' '}
          <Box component="span" sx={{ color: '#00d68f' }}>20%+</Box> /{' '}
          <Box component="span" sx={{ color: '#f5a623' }}>10-19%</Box> /{' '}
          <Box component="span" sx={{ color: '#ff4757' }}>1-9%</Box> /{' '}
          <Box component="span" sx={{ color: '#484e6a' }}>0%</Box>
        </Typography>
        {tiers.map((tier, ti) => tier.items.length > 0 && (
          <Box key={ti}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: .8, textTransform: 'uppercase', color: 'text.disabled', mb: 1, mt: ti > 0 ? 1.5 : 0, display: 'flex', alignItems: 'center', gap: 1, '&::after': { content: '""', flex: 1, height: '1px', bgcolor: 'divider' } }}>
              {tier.label}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {tier.items.map(f => <TreemapTile key={f.feature} {...f} maxTotal={maxCount} />)}
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* VIEW B: RANKED BARS                                           */
/* ═══════════════════════════════════════════════════════════════ */
function RankedBarsView({ allItems }) {
  const [sortBy, setSortBy] = useState('count');
  const sorted = [...allItems].sort((a, b) => {
    if (sortBy === 'coverage') return b.coverage_pct - a.coverage_pct;
    if (sortBy === 'subs') return b.sub_feature_count - a.sub_feature_count;
    return b.total - a.total;
  });
  const maxT = Math.max(...sorted.map(d => d.total));
  const top = sorted.slice(0, 15);
  const rest = sorted.slice(15);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mr: 1 }}>Sort by</Typography>
          {[['count', 'Req Count'], ['coverage', 'Coverage %'], ['subs', 'Sub-Features']].map(([k, label]) => (
            <Button key={k} size="small" variant={sortBy === k ? 'contained' : 'outlined'} onClick={() => setSortBy(k)}
              sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 80, py: 0.3 }}>{label}</Button>
          ))}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
            {[['Covered', '#00d68f', .8], ['Partial', '#f5a623', .5], ['Missing', '#ff4757', .3]].map(([l, c, o]) => (
              <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: c, opacity: o }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr 55px 45px 45px', gap: 1.5, px: 1.5, pb: 0.5, fontSize: '0.6rem', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', color: 'text.disabled' }}>
          <span>Feature</span><span>Requirements</span><span style={{ textAlign: 'right' }}>Cov</span><span style={{ textAlign: 'right' }}>Subs</span><span style={{ textAlign: 'right' }}>Mods</span>
        </Box>

        {top.map((d, i) => <BarRow key={d.feature} d={d} i={i} maxT={maxT} />)}

        {rest.length > 0 && (
          <>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: .8, textTransform: 'uppercase', color: 'text.disabled', px: 1.5, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1, '&::after': { content: '""', flex: 1, height: '1px', bgcolor: 'divider' } }}>
              Remaining {rest.length} features
            </Typography>
            <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
              {rest.map((d, i) => <BarRow key={d.feature} d={d} i={i + 15} maxT={maxT} />)}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BarRow({ d, i, maxT }) {
  const cc = covColor(d.coverage_pct);
  const covW = d.covered / d.total * 100;
  const partW = d.partial / d.total * 100;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr 55px 45px 45px', gap: 1.5, alignItems: 'center', px: 1.5, py: 0.6, borderRadius: '4px', '&:hover': { bgcolor: 'rgba(68,170,255,.03)' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'text.disabled', width: 22, textAlign: 'right', flexShrink: 0 }}>{i + 1}</Typography>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.feature}</Typography>
      </Box>
      <Box sx={{ bgcolor: 'rgba(255,255,255,.03)', borderRadius: '3px', height: 18, overflow: 'hidden', display: 'flex', position: 'relative' }}>
        <Box sx={{ height: '100%', width: `${covW}%`, bgcolor: '#00d68f', opacity: .8 }} />
        <Box sx={{ height: '100%', width: `${partW}%`, bgcolor: '#f5a623', opacity: .5 }} />
        <Box sx={{ height: '100%', flex: 1, bgcolor: '#ff4757', opacity: .3 }} />
        <Typography sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.5)' }}>
          {d.total.toLocaleString()}
        </Typography>
      </Box>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 600, textAlign: 'right', color: cc }}>{d.coverage_pct}%</Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', textAlign: 'right', color: 'text.secondary' }}>{d.sub_feature_count}</Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', textAlign: 'right', color: 'text.secondary' }}>{d.module_count}</Typography>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* VIEW C: SUNBURST RING                                         */
/* ═══════════════════════════════════════════════════════════════ */
function SunburstView({ allItems }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!chartRef.current) return;
    let cancelled = false;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (cancelled) return;
      if (chartInstance.current) chartInstance.current.destroy();

      const top20 = allItems.slice(0, 20);
      const otherItems = allItems.slice(20);
      const otherTotal = otherItems.reduce((s, d) => s + d.total, 0);
      const otherCov = otherItems.reduce((s, d) => s + d.covered, 0);
      const ringData = [...top20];
      if (otherItems.length) ringData.push({ feature: `Other (${otherItems.length})`, total: otherTotal, coverage_pct: 0, sub_feature_count: 0, module_count: 0, modules: [], covered: otherCov, partial: otherTotal - otherCov, missing: 0 });

      chartInstance.current = new Chart(chartRef.current, {
        type: 'doughnut',
        data: {
          labels: ringData.map(d => d.feature),
          datasets: [
            {
              label: 'Requirements',
              data: ringData.map(d => d.total),
              backgroundColor: ringData.map(d => `${covColor(d.coverage_pct)}44`),
              borderColor: ringData.map(d => covColor(d.coverage_pct)),
              borderWidth: 1.5, hoverBorderWidth: 3, hoverOffset: 8, weight: 2,
            },
            {
              label: 'Covered',
              data: ringData.map(d => d.covered),
              backgroundColor: ringData.map(() => 'rgba(0,214,143,.6)'),
              borderWidth: 0, weight: 1,
            },
            {
              label: 'Partial',
              data: ringData.map(d => d.partial),
              backgroundColor: ringData.map(() => 'rgba(245,166,35,.2)'),
              borderWidth: 0, weight: 1,
            }
          ]
        },
        options: {
          cutout: '42%', radius: '95%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: ctx => ringData[ctx[0].dataIndex]?.feature,
                label: ctx => {
                  const d = ringData[ctx.dataIndex];
                  if (ctx.datasetIndex === 0) return `${d.total.toLocaleString()} reqs (${d.coverage_pct}% cov)`;
                  if (ctx.datasetIndex === 1) return `${d.covered} covered`;
                  return `${d.partial} partial`;
                }
              }
            }
          },
          onHover: (_, elements) => {
            if (elements.length > 0) setHovered(ringData[elements[0].index]);
          }
        }
      });
    });
    return () => { cancelled = true; if (chartInstance.current) chartInstance.current.destroy(); };
  }, [allItems]);

  const h = hovered;
  const hc = h ? covColor(h.coverage_pct) : '#484e6a';

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 3, alignItems: 'start' }}>
      <Card>
        <CardContent sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 440 }}>
          <canvas ref={chartRef} style={{ maxHeight: 440 }} />
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
              {allItems.reduce((s, f) => s + f.total, 0).toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', letterSpacing: .5, textTransform: 'uppercase' }}>Requirements</Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 2, display: 'block', fontSize: '0.6rem' }}>
            {h ? 'Feature Detail' : 'Hover a segment'}
          </Typography>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', mb: 0.5 }}>{h?.feature || 'Select a feature'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{h ? h.modules.join(' · ') : 'Hover over any ring segment'}</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
            {[
              ['Requirements', h?.total?.toLocaleString() || '—'],
              ['Coverage', h ? <Box component="span" sx={{ color: hc }}>{h.coverage_pct}%</Box> : '—'],
              ['Sub-Features', h?.sub_feature_count ?? '—'],
              ['Modules', h?.module_count ?? '—'],
            ].map(([l, v], i) => (
              <Box key={i} sx={{ bgcolor: 'rgba(255,255,255,.03)', borderRadius: 1, p: 1.25 }}>
                <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, letterSpacing: .6, textTransform: 'uppercase', color: 'text.disabled' }}>{l}</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: '#fff', mt: 0.25 }}>{v}</Typography>
              </Box>
            ))}
          </Box>

          {h && h.modules.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {h.modules.map(m => (
                <Chip key={m} label={m} size="small" variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 22, borderColor: MOD_COLORS[m] || 'divider', color: MOD_COLORS[m] || 'text.secondary' }} />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {[['Covered', '#00d68f'], ['Partial', '#f5a623'], ['Missing', '#ff4757']].map(([l, c]) => (
              <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                */
/* ═══════════════════════════════════════════════════════════════ */
export default function FeatureLandscape({ projectId }) {
  const { landscape, loading } = useFeatureLandscape(projectId);
  const { overview } = useRtmOverview(projectId);
  const [viewMode, setViewMode] = useState('bars');

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  const allItems = landscape?.items || [];
  const maxCount = allItems[0]?.total || 1;
  const totalReqs = overview?.total_requirements || 0;
  const avgCoverage = allItems.length ? (allItems.reduce((s, i) => s + i.coverage_pct, 0) / allItems.length).toFixed(1) : 0;
  const maxSubFeatures = allItems.length ? Math.max(...allItems.map(i => i.sub_feature_count)) : 0;

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Total Features" value={allItems.length} sub={`${totalReqs.toLocaleString()} requirements`} color="#4af" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Avg Coverage" value={`${avgCoverage}%`} sub="Across all features" color="#00d68f" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Largest Feature" value={allItems[0]?.feature || '—'} sub={`${allItems[0]?.total?.toLocaleString() || 0} requirements`} color="#f5a623" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Most Sub-Features" value={maxSubFeatures} sub="Deepest feature hierarchy" color="#a855f7" /></Grid>
      </Grid>

      {/* View toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small"
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.5, gap: 0.5, color: 'text.secondary', borderColor: 'divider' }, '& .Mui-selected': { color: '#4af !important', bgcolor: 'rgba(68,170,255,.08) !important' } }}>
          <ToggleButton value="bars"><IconChartBar size={15} />Ranked Bars</ToggleButton>
          <ToggleButton value="cards"><IconLayoutGrid size={15} />Tiered Cards</ToggleButton>
          <ToggleButton value="ring"><IconChartDonut size={15} />Sunburst Ring</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewMode === 'cards' && <TieredCardsView allItems={allItems} maxCount={maxCount} />}
      {viewMode === 'bars' && <RankedBarsView allItems={allItems} />}
      {viewMode === 'ring' && <SunburstView allItems={allItems} />}
    </Box>
  );
}
