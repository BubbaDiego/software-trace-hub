import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * Consistent page title matching the TRACEHUB sidebar branding.
 * bold (white, 800) + accent (cyan #4af, 300)
 *
 * Usage: <PageTitle bold="RTM" accent="TRACKER" />
 */
export default function PageTitle({ bold, accent, sub }) {
  return (
    <Box sx={{ mb: sub ? 0.5 : 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>
          {bold}
        </Typography>
        {accent && (
          <Typography sx={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.5px', color: '#4af', lineHeight: 1, ml: 0.5 }}>
            {accent}
          </Typography>
        )}
      </Box>
      {sub && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2, fontSize: '0.8rem' }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}
