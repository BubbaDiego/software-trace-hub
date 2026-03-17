import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

import { useFmeaProductMatrix } from 'api/fmea';

const PROD_COLORS = { PCU: '#4fc3f7', LVP: '#66bb6a', SYR: '#ffa726', PCA: '#fdd835', ETCO2: '#ab47bc', AUTOID: '#26a69a' };
const HAZ_LABELS = { 'IDE-01': 'Overinfusion', 'IDE-02': 'Underinfusion', 'IDE-03': 'Delay', 'IDE-04': 'Interruption', 'IT-04 ': 'Monitoring', 'E-07 I': 'Infection' };
const HAZ_COLORS = { 'IDE-01': '#ff4757', 'IDE-02': '#ff7b42', 'IDE-03': '#ffa726', 'IDE-04': '#fdd835', 'IT-04 ': '#ab47bc', 'E-07 I': '#26a69a' };

export default function FmeaByProduct() {
  const { products, matrix, matrixLoading } = useFmeaProductMatrix();

  // Build heatmap: hazard_cat x product
  const heatData = useMemo(() => {
    const hazCats = [...new Set(matrix.map((m) => m.hazard_cat))];
    const prods = [...new Set(matrix.map((m) => m.product))];
    const grid = {};
    matrix.forEach((m) => { grid[`${m.hazard_cat}|${m.product}`] = m.count; });
    return { hazCats, prods, grid };
  }, [matrix]);

  if (matrixLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {products.map((p) => {
          const col = PROD_COLORS[p.product] || '#4fc3f7';
          // Get hazard breakdown for this product
          const prodMatrix = matrix.filter((m) => m.product === p.product);
          const totalHz = prodMatrix.reduce((a, b) => a + b.count, 0) || 1;
          return (
            <Grid key={p.product} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#000' }}>
                      {p.product}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{p.product}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.total} FMEA records</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>Failure Modes</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{p.failure_modes}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>Critical</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff4757' }}>{p.critical}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>RCMs</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#66bb6a' }}>{p.total}</Typography>
                    </Box>
                  </Box>
                  {/* Mini hazard bar */}
                  <Box sx={{ display: 'flex', height: 6, borderRadius: 1, overflow: 'hidden', gap: '1px' }}>
                    {prodMatrix.map((m, i) => (
                      <Box key={i} sx={{ width: `${(m.count / totalHz) * 100}%`, bgcolor: HAZ_COLORS[m.hazard_cat] || '#8899aa', borderRadius: '2px' }} title={`${HAZ_LABELS[m.hazard_cat] || m.hazard_cat}: ${m.count}`} />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {prodMatrix.map((m, i) => (
                      <Typography key={i} sx={{ fontSize: '0.6rem', color: HAZ_COLORS[m.hazard_cat] || 'text.secondary' }}>
                        {HAZ_LABELS[m.hazard_cat] || m.hazard_cat} ({m.count})
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Cross-product heatmap */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Cross-Product Hazard Heatmap</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: `140px repeat(${heatData.prods.length}, 1fr)`, gap: '3px', fontSize: '0.7rem' }}>
            <Box />
            {heatData.prods.map((p) => (
              <Box key={p} sx={{ textAlign: 'center', color: PROD_COLORS[p] || 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', py: 0.5 }}>{p}</Box>
            ))}
            {heatData.hazCats.map((hz) => (
              <>
                <Box key={`l-${hz}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1, color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem' }}>
                  {HAZ_LABELS[hz] || hz}
                </Box>
                {heatData.prods.map((p) => {
                  const val = heatData.grid[`${hz}|${p}`] || 0;
                  const col = HAZ_COLORS[hz] || '#4fc3f7';
                  const alpha = val > 0 ? Math.min(0.4, val / 50 + 0.08) : 0.03;
                  return (
                    <Box
                      key={`${hz}-${p}`}
                      sx={{
                        bgcolor: val > 0 ? `${col}${Math.round(alpha * 255).toString(16).padStart(2, '0')}` : 'rgba(136,153,170,.04)',
                        borderRadius: '4px',
                        p: 1,
                        textAlign: 'center',
                        fontWeight: val > 0 ? 600 : 400,
                        color: val > 0 ? col : 'text.secondary',
                        '&:hover': val > 0 ? { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-1px' } : {},
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
    </Box>
  );
}
