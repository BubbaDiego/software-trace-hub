import React, { useState, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import PageTitle from 'components/PageTitle';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { IconUpload, IconDatabase, IconCheck, IconX, IconShieldCheck, IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import { useRtmProjects, useRtmOverview, importRtmFile, importBundledRtm } from 'api/rtm';
import { useStaSummary, importStaFile, importBundledSta } from 'api/sta';

import ExecutiveOverview from './ExecutiveOverview';
import FeatureTraceability from './FeatureTraceability';
import ModuleCoverage from './ModuleCoverage';
import GapAnalysis from './GapAnalysis';
import TestEvidence from './TestEvidence';
import SoftwareTraceability from './SoftwareTraceability';

function ImportPanel({ onDone }) {
  const theme = useTheme();
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleBundled = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await importBundledRtm({ projectName: 'Alaris v12.6', projectVersion: '510k' });
      setSuccess(`Imported ${res.requirements_imported ?? 0} requirements`);
      onDone?.();
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const res = await importRtmFile(file, { projectName: file.name.replace(/\.xlsx?$/i, '') });
      setSuccess(`Imported ${res.requirements_imported ?? 0} requirements`);
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <PageTitle bold="RTM" accent="TRACKER" />
      <Typography variant="body1" color="text.secondary">
        Import an RTM Excel file to get started
      </Typography>

      {error && <Alert severity="error" sx={{ maxWidth: 500, width: '100%' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ maxWidth: 500, width: '100%' }}>{success}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Card variant="outlined" sx={{ width: 260 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 3 }}>
            <IconDatabase size={40} stroke={1.5} color={theme.palette.primary.main} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Load Bundled RTM</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Alaris v12.6 510k — 6,740 requirements
            </Typography>
            <Button
              variant="contained"
              onClick={handleBundled}
              disabled={importing}
              startIcon={importing ? <CircularProgress size={16} /> : null}
            >
              {importing ? 'Importing...' : 'Load'}
            </Button>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ width: 260 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 3 }}>
            <IconUpload size={40} stroke={1.5} color={theme.palette.info.main} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Upload Excel File</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              .xlsx RTM export from your project
            </Typography>
            <Button variant="outlined" component="label" disabled={importing}>
              {importing ? 'Importing...' : 'Choose File'}
              <input ref={fileRef} type="file" hidden accept=".xlsx,.xls" onChange={handleUpload} />
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function StaImportDialog({ open, onClose, projectId, onDone }) {
  const theme = useTheme();
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleBundled = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await importBundledSta(projectId);
      const matched = res.sw_trace?.matched ?? 0;
      setSuccess(`Enriched ${matched} SRDs with traceability data`);
      onDone?.();
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'STA import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const res = await importStaFile(projectId, file);
      const matched = res.sw_trace?.matched ?? 0;
      setSuccess(`Enriched ${matched} SRDs with traceability data`);
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'STA import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Enrich with Software Traceability Analysis
        <IconButton size="small" onClick={onClose}><IconX size={18} /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Links SRS specs, design outputs, unit tests, and version history to existing requirements via SRD ID matching
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Card variant="outlined" sx={{ width: 230 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 2.5 }}>
              <IconDatabase size={36} stroke={1.5} color={theme.palette.primary.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Load Bundled STA</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Alaris v12.6 Traceability Analysis
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleBundled}
                disabled={importing}
                startIcon={importing ? <CircularProgress size={14} /> : null}
              >
                {importing ? 'Importing...' : 'Load'}
              </Button>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ width: 230 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 2.5 }}>
              <IconUpload size={36} stroke={1.5} color={theme.palette.info.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Upload STA File</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                .xlsx Software Traceability Analysis
              </Typography>
              <Button variant="outlined" size="small" component="label" disabled={importing}>
                {importing ? 'Importing...' : 'Choose File'}
                <input ref={fileRef} type="file" hidden accept=".xlsx,.xls" onChange={handleUpload} />
              </Button>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

const TAB_LABELS = [
  'Executive Overview',
  'Feature Traceability',
  'Module Coverage',
  'Gap Analysis',
  'Test Evidence Explorer',
  'Software Traceability'
];

export default function RTMPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [projectId, setProjectId] = useState(null);
  const [staDialogOpen, setStaDialogOpen] = useState(false);

  const { projects, loading: projLoading, refresh: projRefresh } = useRtmProjects();
  const activeId = projectId ?? projects?.[0]?.id ?? null;
  const { overview, loading: ovLoading } = useRtmOverview(activeId);
  const { staSummary, refresh: staRefresh } = useStaSummary(activeId);

  const isStaEnriched = staSummary?.enriched === true;

  const activeProject = useMemo(
    () => projects?.find((p) => p.id === activeId) ?? null,
    [projects, activeId]
  );

  if (projLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!projects?.length) {
    return <ImportPanel onDone={() => projRefresh()} />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 1,
          py: 1.5,
          flexWrap: 'wrap'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0, mr: 1 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>RTM</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.5px', color: '#4af', lineHeight: 1, ml: 0.5 }}>TRACKER</Typography>
        </Box>
        {activeProject && (
          <Chip
            label={activeProject.version || activeProject.name}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
        {overview && (
          <Chip
            label={`${overview.total_requirements?.toLocaleString()} reqs`}
            size="small"
            variant="filled"
            sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200' }}
          />
        )}

        {isStaEnriched ? (
          <Chip
            icon={<IconCheck size={14} />}
            label="STA Enriched"
            size="small"
            color="success"
            variant="filled"
          />
        ) : activeId ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconUpload size={14} />}
            onClick={() => setStaDialogOpen(true)}
          >
            Enrich with STA
          </Button>
        ) : null}

        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <Tooltip title="IEC 62304 — Software Lifecycle">
            <IconButton size="small" onClick={() => navigate('/iec62304')} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              <IconShieldCheck size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="ISO 14971 — Risk Management">
            <IconButton size="small" onClick={() => navigate('/iso14971')} sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}>
              <IconAlertTriangle size={20} />
            </IconButton>
          </Tooltip>
        </Box>

        {projects.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 200, ml: 'auto' }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={activeId ?? ''}
              label="Project"
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} ({p.version})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40 }}
        >
          {TAB_LABELS.map((label, i) => (
            <Tab
              key={label}
              label={
                i === 5 && isStaEnriched ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {label}
                    <Chip label="NEW" size="small" color="success" sx={{ height: 16, fontSize: 9, ml: 0.5 }} />
                  </Box>
                ) : label
              }
              sx={{ textTransform: 'none', minHeight: 40, py: 1 }}
              disabled={i === 5 && !isStaEnriched}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ pt: 2 }}>
        {ovLoading && !overview ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tab === 0 && <ExecutiveOverview projectId={activeId} overview={overview} staSummary={staSummary} />}
            {tab === 1 && <FeatureTraceability projectId={activeId} overview={overview} />}
            {tab === 2 && <ModuleCoverage projectId={activeId} />}
            {tab === 3 && <GapAnalysis projectId={activeId} />}
            {tab === 4 && <TestEvidence projectId={activeId} />}
            {tab === 5 && isStaEnriched && <SoftwareTraceability projectId={activeId} staSummary={staSummary} />}
          </>
        )}
      </Box>

      {/* STA Import Dialog */}
      <StaImportDialog
        open={staDialogOpen}
        onClose={() => setStaDialogOpen(false)}
        projectId={activeId}
        onDone={() => {
          staRefresh();
          projRefresh();
          setStaDialogOpen(false);
        }}
      />
    </Box>
  );
}
