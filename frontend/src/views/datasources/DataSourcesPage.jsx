import { useState, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import {
  IconClipboardList,
  IconFileAnalytics,
  IconAlertTriangle,
  IconUsers,
  IconUpload,
  IconDatabase,
  IconCheck,
  IconX,
} from '@tabler/icons-react';

import { useRtmProjects, importRtmFile, importBundledRtm } from 'api/rtm';
import { importStaFile, importBundledSta, useStaSummary } from 'api/sta';
import { importFmeaFile, useFmeaSummary } from 'api/fmea';
import { importResourceFile, useResourceSummary } from 'api/resources';

// ---------------------------------------------------------------------------
// Data Sources — centralized upload hub for all input Excel files
// ---------------------------------------------------------------------------

const SOURCES = [
  {
    id: 'rtm',
    title: 'Requirements Trace Matrix',
    short: 'RTM',
    icon: IconClipboardList,
    color: '#4678d8',
    accept: '.xlsx,.xls',
    description: 'Upload the RTM Excel workbook containing requirements, features, modules, test evidence, and hazard IDs.',
    bundledLabel: 'Load Bundled Alaris v12.6',
    hasBundled: true,
  },
  {
    id: 'sta',
    title: 'Software Trace Analysis',
    short: 'STA',
    icon: IconFileAnalytics,
    color: '#00d68f',
    accept: '.xlsx,.xls',
    description: 'Upload the STA workbook to enrich the RTM with SRS spec links, design outputs, and version history.',
    bundledLabel: 'Load Bundled STA',
    hasBundled: true,
    requiresRtm: true,
  },
  {
    id: 'fmea',
    title: 'Software FMEA',
    short: 'FMEA',
    icon: IconAlertTriangle,
    color: '#ffaa00',
    accept: '.xlsx,.xls,.xlsm',
    description: 'Upload the Software FMEA workbook containing failure modes, severity, occurrence, detection, and RPN scores.',
    hasBundled: false,
  },
  {
    id: 'resources',
    title: 'Software Resources',
    short: 'Resources',
    icon: IconUsers,
    color: '#00d2d3',
    accept: '.xlsx,.xls,.xlsm',
    description: 'Upload the resource planning workbook with team allocations, project assignments, and FTE data.',
    hasBundled: false,
  },
];

function SourceCard({ source, status, onUpload, onBundled, loading, result }) {
  const fileRef = useRef(null);
  const { icon: Icon, color, title, short, description, accept, hasBundled, bundledLabel, comingSoon, requiresRtm } = source;

  const imported = status?.imported;
  const count = status?.count;
  const label = status?.label;
  const blocked = requiresRtm && !status?.rtmReady;

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) onUpload(source.id, file);
      e.target.value = '';
    },
    [onUpload, source.id]
  );

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${imported ? color + '44' : '#FFFFFF22'}`,
        opacity: comingSoon ? 0.7 : 1,
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon size={24} color={color} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              {title}
            </Typography>
          </Box>
          {imported ? (
            <Chip
              icon={<IconCheck size={14} />}
              label="Loaded"
              size="small"
              sx={{ bgcolor: color + '22', color, fontWeight: 600, fontSize: '0.7rem' }}
            />
          ) : comingSoon ? (
            <Chip label="Coming Soon" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
          ) : (
            <Chip
              icon={<IconX size={14} />}
              label="Empty"
              size="small"
              sx={{ bgcolor: 'rgba(255,71,87,0.12)', color: '#ff4757', fontWeight: 600, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
          {description}
        </Typography>

        {/* Stats */}
        {imported && (
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.04)',
              borderRadius: 1,
              p: 1.5,
              display: 'flex',
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>
                Records
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color }}>
                {typeof count === 'number' ? count.toLocaleString() : count}
              </Typography>
            </Box>
            {label && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>
                  Source
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                  {label}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Result message */}
        {result && (
          <Alert severity={result.error ? 'error' : 'success'} sx={{ fontSize: '0.8rem', py: 0.5 }}>
            {result.message}
          </Alert>
        )}

        {/* Blocked message for STA */}
        {blocked && !comingSoon && (
          <Alert severity="info" sx={{ fontSize: '0.8rem', py: 0.5 }}>
            Import an RTM first before uploading STA enrichment.
          </Alert>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Actions */}
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <input type="file" hidden ref={fileRef} accept={accept} onChange={handleFileChange} />
          <Button
            variant="outlined"
            size="small"
            startIcon={loading ? <CircularProgress size={14} /> : <IconUpload size={16} />}
            disabled={loading || comingSoon || blocked}
            onClick={() => fileRef.current?.click()}
            sx={{ textTransform: 'none', fontWeight: 500, flex: 1 }}
          >
            Upload Excel
          </Button>
          {hasBundled && (
            <Button
              variant="contained"
              size="small"
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <IconDatabase size={16} />}
              disabled={loading || blocked}
              onClick={() => onBundled(source.id)}
              sx={{ textTransform: 'none', fontWeight: 500, flex: 1 }}
            >
              {bundledLabel}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DataSourcesPage() {
  const { projects, projectsLoading } = useRtmProjects();
  const activeProject = projects?.[0];
  const { staSummary } = useStaSummary(activeProject?.id);
  const { fmeaSummary, refreshFmea } = useFmeaSummary();
  const { resourceSummary, refreshResources } = useResourceSummary();

  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});

  const setResult = (id, message, error = false) => {
    setResults((r) => ({ ...r, [id]: { message, error } }));
    if (!error) setTimeout(() => setResults((r) => ({ ...r, [id]: null })), 5000);
  };

  const handleUpload = useCallback(
    async (id, file) => {
      setLoading((l) => ({ ...l, [id]: true }));
      setResults((r) => ({ ...r, [id]: null }));
      try {
        if (id === 'rtm') {
          const res = await importRtmFile(file, { projectName: file.name.replace(/\.xlsx?$/i, '') });
          setResult('rtm', `Imported ${res.requirements_imported?.toLocaleString() ?? ''} requirements`);
        } else if (id === 'sta') {
          const res = await importStaFile(activeProject.id, file);
          setResult('sta', `Enriched ${res.sw_trace?.matched ?? 0} SRDs with traceability data`);
        } else if (id === 'fmea') {
          const res = await importFmeaFile(file);
          setResult('fmea', `Imported ${res.fmea_records ?? 0} FMEA records, ${res.common_causes ?? 0} common causes`);
          refreshFmea();
        } else if (id === 'resources') {
          const res = await importResourceFile(file);
          setResult('resources', `Imported ${res.people_imported ?? 0} people, ${res.allocation_rows?.toLocaleString() ?? 0} allocation rows`);
          refreshResources();
        }
      } catch (err) {
        setResult(id, err?.response?.data?.detail || err.message || 'Upload failed', true);
      } finally {
        setLoading((l) => ({ ...l, [id]: false }));
      }
    },
    [activeProject]
  );

  const handleBundled = useCallback(
    async (id) => {
      setLoading((l) => ({ ...l, [id]: true }));
      setResults((r) => ({ ...r, [id]: null }));
      try {
        if (id === 'rtm') {
          const res = await importBundledRtm();
          setResult('rtm', `Imported ${res.requirements_imported?.toLocaleString() ?? ''} requirements from bundled Alaris v12.6`);
        } else if (id === 'sta') {
          const res = await importBundledSta(activeProject.id);
          setResult('sta', `Enriched ${res.sw_trace?.matched ?? 0} SRDs from bundled STA`);
        }
      } catch (err) {
        setResult(id, err?.response?.data?.detail || err.message || 'Import failed', true);
      } finally {
        setLoading((l) => ({ ...l, [id]: false }));
      }
    },
    [activeProject]
  );

  // Build status for each source
  const statuses = {
    rtm: activeProject
      ? { imported: true, count: activeProject.requirements_count, label: activeProject.name }
      : { imported: false },
    sta: staSummary?.srs_count > 0
      ? { imported: true, count: staSummary.srs_count, label: 'STA Enrichment', rtmReady: !!activeProject }
      : { imported: false, rtmReady: !!activeProject },
    fmea: fmeaSummary?.imported
      ? { imported: true, count: fmeaSummary.fmea_records, label: `${fmeaSummary.common_causes} common causes` }
      : { imported: false },
    resources: resourceSummary?.imported
      ? { imported: true, count: resourceSummary.people_count, label: `${resourceSummary.allocation_rows?.toLocaleString()} allocations` }
      : { imported: false },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0, mb: 0.5 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>DATA</Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.5px', color: '#4af', lineHeight: 1, ml: 0.5 }}>SOURCES</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload and manage input Excel files that feed the traceability, compliance, and resource views.
      </Typography>

      <Grid container spacing={2}>
        {SOURCES.map((source) => (
          <Grid key={source.id} size={{ xs: 12, md: 6 }}>
            <SourceCard
              source={source}
              status={statuses[source.id]}
              onUpload={handleUpload}
              onBundled={handleBundled}
              loading={!!loading[source.id]}
              result={results[source.id]}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
