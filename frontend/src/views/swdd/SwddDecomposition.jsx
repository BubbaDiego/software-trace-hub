import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { useSwddArchitecture } from 'api/swdd';

export default function SwddDecomposition() {
  const { archData, loading } = useSwddArchitecture();
  const [openSections, setOpenSections] = useState({ 'DETAILED DESIGN': true, 'DESIGN OVERVIEWS': true });
  const [openItems, setOpenItems] = useState({});

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  const tree = archData?.tree || {};

  const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }));
  const toggleItem = (id) => setOpenItems(p => ({ ...p, [id]: !p[id] }));

  return (
    <Card>
      <CardContent>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, mb: 2, display: 'block' }}>
          Architecture Decomposition — Software Items → Units
        </Typography>

        {Object.entries(tree).map(([parent, items]) => {
          const isOpen = !!openSections[parent];
          return (
            <Box key={parent} sx={{ mb: 2 }}>
              {/* Parent section header */}
              <Box
                onClick={() => toggleSection(parent)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1,
                  cursor: 'pointer', borderBottom: '1px solid', borderColor: 'divider',
                  '&:hover': { bgcolor: 'rgba(68,170,255,.03)' },
                }}
              >
                {isOpen ? <IconChevronDown size={14} color="#7e84a0" /> : <IconChevronRight size={14} color="#7e84a0" />}
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', color: 'text.secondary' }}>
                  {parent}
                </Typography>
                <Chip label={`${items.length} items`} size="small" sx={{ fontSize: '0.6rem', height: 18, color: 'text.disabled' }} />
              </Box>

              <Collapse in={isOpen}>
                <Box sx={{ pl: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                  {items.map((item) => {
                    const itemKey = `${parent}-${item.id}`;
                    const itemOpen = !!openItems[itemKey];
                    const units = item.units || [];
                    const hasUnits = units.length > 0;

                    return (
                      <Box key={item.id}>
                        {/* Item row */}
                        <Box
                          onClick={() => hasUnits && toggleItem(itemKey)}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1, py: 0.7, px: 1,
                            cursor: hasUnits ? 'pointer' : 'default',
                            borderBottom: '1px solid rgba(255,255,255,.02)',
                            position: 'relative',
                            '&:hover': { bgcolor: 'rgba(68,170,255,.02)' },
                            '&::before': {
                              content: '""', position: 'absolute', left: -16, top: '50%',
                              width: 12, height: '1px', bgcolor: 'divider',
                            },
                          }}
                        >
                          {hasUnits ? (
                            itemOpen ? <IconChevronDown size={12} color="#4af" /> : <IconChevronRight size={12} color="#484e6a" />
                          ) : (
                            <Box sx={{ width: 12 }} />
                          )}
                          {item.asdd_ref && (
                            <Chip
                              label={item.asdd_ref}
                              size="small"
                              sx={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 600, height: 18, bgcolor: 'rgba(68,170,255,.1)', color: '#4af', flexShrink: 0 }}
                            />
                          )}
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, flex: 1 }}>{item.name}</Typography>
                          {hasUnits && (
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'text.disabled' }}>
                              {units.length} units
                            </Typography>
                          )}
                        </Box>

                        {/* Units */}
                        {hasUnits && (
                          <Collapse in={itemOpen}>
                            <Box sx={{ pl: 3.5, borderLeft: '1px dashed rgba(68,170,255,.15)' }}>
                              {units.map((unit) => (
                                <Box
                                  key={unit.id}
                                  sx={{
                                    py: 0.4, px: 1, position: 'relative',
                                    '&::before': {
                                      content: '""', position: 'absolute', left: -28, top: '50%',
                                      width: 24, height: '1px', bgcolor: 'rgba(68,170,255,.1)',
                                    },
                                  }}
                                >
                                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                    {unit.name}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Collapse>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}
