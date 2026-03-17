import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import { MONTHS, PROJECTS, TEAMS } from './resourceData';

function TimelineGrid({ data, maxVal }) {
  const peak = maxVal || Math.max(...Object.values(data).flat(), 1);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '140px repeat(12, 1fr)', gap: '3px', fontSize: 11 }}>
      {/* Header */}
      <Box />
      {MONTHS.map((m) => (
        <Box key={m} sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 600, fontSize: 10, py: 0.5 }}>
          {m}
        </Box>
      ))}
      {/* Rows */}
      {Object.entries(data).map(([name, vals]) => [
        <Box
          key={`${name}-l`}
          sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600, textAlign: 'right', pr: 1, lineHeight: '28px' }}
        >
          {name}
        </Box>,
        ...vals.map((v, i) => {
          const alpha = v > 0 ? Math.max(0.15, v / peak) : 0;
          return (
            <Box
              key={`${name}-${i}`}
              sx={{
                textAlign: 'center',
                borderRadius: '3px',
                height: 28,
                lineHeight: '28px',
                fontWeight: 600,
                bgcolor: v > 0 ? `rgba(79,195,247,${alpha})` : 'action.hover',
                color: v > 0 ? 'text.primary' : 'text.disabled'
              }}
            >
              {v > 0 ? v.toFixed(1) : '\u2014'}
            </Box>
          );
        })
      ])}
    </Box>
  );
}

export default function ResourceTimeline() {
  const [view, setView] = useState('project');

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Resource Timeline</strong> &mdash; Gantt-style view showing monthly FTE allocation. Cell intensity reflects allocation level
        relative to peak.
      </Alert>

      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(_, v) => {
            if (v !== null) setView(v);
          }}
        >
          <ToggleButton value="project">By Project</ToggleButton>
          <ToggleButton value="team">By Team</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {view === 'project' ? 'Project Allocation Timeline' : 'Team Allocation Timeline'}
          </Typography>
          <TimelineGrid data={view === 'project' ? PROJECTS : TEAMS} />
        </CardContent>
      </Card>
    </Box>
  );
}
