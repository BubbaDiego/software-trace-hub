import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { PEOPLE } from './resourceData';

const AVATAR_COLORS = ['#4fc3f7', '#ab47bc', '#66bb6a', '#ffa726', '#ec407a', '#26a69a', '#ef5350', '#fdd835'];

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('');
}

export default function PeopleDirectory() {
  const [filter, setFilter] = useState('all');

  const sorted = useMemo(() => [...PEOPLE].sort((a, b) => a.name.localeCompare(b.name)), []);

  const filtered = useMemo(() => {
    if (filter === 'all') return sorted;
    if (filter === 'FTE' || filter === 'Contractor') return sorted.filter((p) => p.type === filter);
    return sorted.filter((p) => p.loc === filter);
  }, [filter, sorted]);

  const counts = useMemo(
    () => ({
      all: sorted.length,
      FTE: sorted.filter((p) => p.type === 'FTE').length,
      Contractor: sorted.filter((p) => p.type === 'Contractor').length,
      'US San Diego': sorted.filter((p) => p.loc === 'US San Diego').length,
      'IND Bangalore': sorted.filter((p) => p.loc === 'IND Bangalore').length
    }),
    [sorted]
  );

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          size="small"
          onChange={(_, v) => {
            if (v !== null) setFilter(v);
          }}
        >
          <ToggleButton value="all">All ({counts.all})</ToggleButton>
          <ToggleButton value="FTE">FTE ({counts.FTE})</ToggleButton>
          <ToggleButton value="Contractor">Contractor ({counts.Contractor})</ToggleButton>
          <ToggleButton value="US San Diego">San Diego ({counts['US San Diego']})</ToggleButton>
          <ToggleButton value="IND Bangalore">Bangalore ({counts['IND Bangalore']})</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Resource Directory
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell align="center">Avg Alloc</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p, i) => {
                  const avg = p.alloc.reduce((a, b) => a + b, 0) / 12;
                  return (
                    <TableRow key={p.name} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: 10, bgcolor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                            {initials(p.name)}
                          </Avatar>
                          {p.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.type} size="small" color={p.type === 'FTE' ? 'primary' : 'warning'} variant="outlined" />
                      </TableCell>
                      <TableCell>{p.team}</TableCell>
                      <TableCell>{p.loc}</TableCell>
                      <TableCell>{p.mgr}</TableCell>
                      <TableCell>{p.project}</TableCell>
                      <TableCell>{p.activity}</TableCell>
                      <TableCell align="center">{avg > 0 ? avg.toFixed(2) : '\u2014'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
