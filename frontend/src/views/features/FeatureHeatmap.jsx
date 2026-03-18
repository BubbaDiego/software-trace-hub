import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { useRtmHeatmap } from 'api/rtm';

function heatColor(pct) {
  if (pct >= 50) return '#00d68f';
  if (pct >= 20) return '#f5a623';
  if (pct > 0) return '#ff4757';
  return 'transparent';
}

export default function FeatureHeatmap({ projectId }) {
  const { heatmap, loading } = useRtmHeatmap(projectId, 30);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  const { features = [], modules = [], cells = {} } = heatmap;

  return (
    <Card>
      <CardContent>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 2, display: 'block' }}>
          Feature × Module Coverage Heatmap — {features.length} features × {modules.length} modules
        </Typography>

        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ display: 'inline-block', minWidth: 600 }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', mb: 0.5 }}>
              <Box sx={{ width: 200, flexShrink: 0 }} />
              {modules.map(m => (
                <Box key={m} sx={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', transform: 'rotate(-35deg)', transformOrigin: 'bottom left', whiteSpace: 'nowrap', ml: 2, mb: 1 }}>
                    {m}
                  </Typography>
                </Box>
              ))}
              <Box sx={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', ml: 1 }}>Total</Typography>
              </Box>
            </Box>

            {/* Data rows */}
            {features.map((feature, fi) => {
              let featureTotal = 0;
              let featureCovered = 0;
              modules.forEach(m => {
                const cell = cells[`${feature}|${m}`];
                if (cell) {
                  featureTotal += cell.total;
                  featureCovered += cell.covered;
                }
              });
              const featurePct = featureTotal ? Math.round(featureCovered / featureTotal * 100) : 0;

              return (
                <Box key={feature} sx={{ display: 'flex', alignItems: 'center', mb: '2px', '&:hover': { bgcolor: 'rgba(255,255,255,.02)' } }}>
                  <Box sx={{ width: 200, flexShrink: 0, pr: 1 }}>
                    <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.primary' }}>{feature}</Typography>
                  </Box>
                  {modules.map(m => {
                    const cell = cells[`${feature}|${m}`];
                    const pct = cell?.pct ?? 0;
                    const total = cell?.total ?? 0;
                    const covered = cell?.covered ?? 0;
                    const bg = heatColor(pct);
                    const opacity = total === 0 ? 0.03 : Math.max(0.15, pct / 100);
                    return (
                      <Tooltip key={m} title={total ? `${feature} × ${m}: ${covered}/${total} (${pct}%)` : `${feature} × ${m}: no requirements`} arrow>
                        <Box sx={{
                          width: 70, height: 28, flexShrink: 0, mx: '1px',
                          bgcolor: total === 0 ? 'rgba(255,255,255,.02)' : `${bg}`,
                          opacity: total === 0 ? 1 : opacity,
                          borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'default', transition: 'opacity .15s',
                        }}>
                          {total > 0 && (
                            <Typography sx={{ fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 500, color: '#fff', opacity: .9 }}>
                              {total}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })}
                  <Box sx={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
                    <Typography sx={{
                      fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 600,
                      color: featurePct >= 30 ? '#00d68f' : featurePct >= 10 ? '#f5a623' : featurePct > 0 ? '#ff4757' : 'text.disabled'
                    }}>
                      {featurePct}%
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 3, mt: 2, ml: 25 }}>
              {[['0%', '#555a72'], ['1-19%', '#ff4757'], ['20-49%', '#f5a623'], ['50%+', '#00d68f']].map(([label, color]) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: color, borderRadius: '2px', opacity: color === '#555a72' ? 0.3 : 0.7 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
