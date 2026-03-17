import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { useRtmRequirements, useRtmRequirementDetail } from 'api/rtm';

const MODULES = ['', 'PCU', 'LVP', 'SYR', 'PCA', 'EtCO2', 'SPO2', 'Auto-ID'];
const EVIDENCE_FILTERS = [
  { value: '', label: 'All Evidence' },
  { value: 'full', label: 'Manual + CATS' },
  { value: 'partial', label: 'Partial' },
  { value: 'missing', label: 'No Evidence' }
];

function statusChip(status) {
  const map = {
    full: { label: 'Full', color: 'success' },
    partial: { label: 'Partial', color: 'warning' },
    missing: { label: 'Missing', color: 'error' }
  };
  const s = map[status] || { label: status, color: 'default' };
  return <Chip label={s.label} size="small" color={s.color} variant="filled" />;
}

function evidenceTypeLabel(type) {
  const map = {
    spec_manual: 'SPEC (Manual)',
    req_manual: 'REQ (Manual)',
    module_lvp_manual: 'LVP (Manual)',
    module_syr_manual: 'SYR (Manual)',
    module_pca_manual: 'PCA (Manual)',
    module_pcu_manual: 'PCU (Manual)',
    module_etco2_manual: 'EtCO2 (Manual)',
    module_autoid_manual: 'Auto-ID (Manual)',
    module_spo2_manual: 'SPO2 (Manual)',
    cats_spec: 'SPEC (CATS)',
    cats_req: 'REQ (CATS)',
    cats_module_lvp: 'LVP (CATS)',
    cats_module_syr: 'SYR (CATS)',
    cats_module_pca: 'PCA (CATS)',
    scenario_manual: 'Scenario (Manual)',
    scenario_cats: 'Scenario (CATS)'
  };
  return map[type] || type;
}

function StaEnrichmentSection({ detail }) {
  const staSpec = detail.sta_spec_refs || [];
  const staEvidence = detail.sta_module_evidence || [];
  const staDesign = detail.sta_design_outputs || [];
  const staVersions = detail.sta_version_history || [];

  const spec = staSpec[0] || {};
  const design = staDesign[0] || {};
  const designRefs = JSON.parse(design.design_refs_json || '[]');
  const utFiles = JSON.parse(design.unit_test_files_json || '[]');
  const moduleEv = staEvidence.filter((e) => e.module_name !== 'TOTAL');

  return (
    <>
      <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 2, pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip label="STA Enriched" size="small" color="success" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Software Traceability Analysis</Typography>
        </Box>

        <Grid container spacing={2}>
          {/* SRS Spec Refs */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              SRS Spec References
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '3px 8px', mt: 1, fontSize: 12 }}>
              <Typography variant="caption" color="text.secondary">ASWS</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{spec.asws_ref || '\u2014'}</Typography>
              <Typography variant="caption" color="text.secondary">ASWUI</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{spec.aswui_ref || '\u2014'}</Typography>
              <Typography variant="caption" color="text.secondary">ASWIS</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{spec.aswis_ref || '\u2014'}</Typography>
            </Box>
            {spec.prd_section && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">PRD Section</Typography>
                <Typography variant="body2" sx={{ fontSize: 12 }}>{spec.prd_section}</Typography>
              </Box>
            )}
          </Grid>

          {/* STA Module Evidence */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              STA Module Evidence
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1, maxHeight: 160, overflow: 'auto' }}>
              {moduleEv.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>No module evidence</Typography>
              ) : moduleEv.map((e, i) => {
                const ids = JSON.parse(e.tc_ids_json || '[]');
                return (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <Typography variant="body2" sx={{ fontSize: 12 }}>{e.module_name}</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }} noWrap>
                      {ids.slice(0, 3).join(', ')}{ids.length > 3 ? ` +${ids.length - 3}` : ''}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Grid>

          {/* Design Outputs + Unit Tests */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Design Outputs
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 1.5 }}>
              {designRefs.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>None</Typography>
              ) : (
                <>
                  {designRefs.slice(0, 6).map((r, i) => (
                    <Chip key={i} label={r} size="small" variant="outlined" color="secondary" sx={{ fontSize: 10, height: 20 }} />
                  ))}
                  {designRefs.length > 6 && (
                    <Chip label={`+${designRefs.length - 6}`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                  )}
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Unit Tests
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
              {utFiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>None</Typography>
              ) : (
                <>
                  {utFiles.slice(0, 4).map((f, i) => (
                    <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{f}</Typography>
                  ))}
                  {utFiles.length > 4 && (
                    <Typography variant="caption" color="text.disabled">+{utFiles.length - 4} more</Typography>
                  )}
                </>
              )}
            </Box>
          </Grid>

          {/* Version History */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Version History
            </Typography>
            {staVersions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mt: 1 }}>No version data</Typography>
            ) : (
              <Box sx={{ mt: 1, maxHeight: 160, overflow: 'auto' }}>
                {staVersions.map((v, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, fontSize: 11 }}>
                    <Chip
                      label={v.version_label}
                      size="small"
                      color={v.test_ref && v.ter_ref ? 'success' : 'warning'}
                      sx={{ fontSize: 10, height: 20, minWidth: 55 }}
                    />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 10 }} noWrap>
                      {v.test_ref?.length > 20 ? v.test_ref.slice(0, 18) + '...' : v.test_ref || '\u2014'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

function DetailPanel({ requirementId }) {
  const { detail, loading } = useRtmRequirementDetail(requirementId);

  if (loading) return <Box sx={{ py: 2, pl: 6 }}><CircularProgress size={20} /></Box>;
  if (!detail) return null;

  const manualEvidence = detail.evidence?.filter((e) => e.evidence_type.includes('manual')) || [];
  const catsEvidence = detail.evidence?.filter((e) => e.evidence_type.includes('cats')) || [];

  return (
    <Box sx={{ py: 2, px: 3, bgcolor: 'action.hover' }}>
      <Grid container spacing={3}>
        {/* Left: Requirement Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Requirement Detail</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '4px 12px', fontSize: 13 }}>
            <Typography variant="caption" color="text.secondary">SRD ID</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{detail.srd_id}</Typography>
            <Typography variant="caption" color="text.secondary">Feature</Typography>
            <Typography variant="body2">{detail.feature}</Typography>
            <Typography variant="caption" color="text.secondary">Sub-Feature</Typography>
            <Typography variant="body2">{detail.sub_feature || '\u2014'}</Typography>
            <Typography variant="caption" color="text.secondary">Function</Typography>
            <Typography variant="body2">{detail.software_function || '\u2014'}</Typography>
            <Typography variant="caption" color="text.secondary">Modules</Typography>
            <Typography variant="body2">{detail.impacted_modules}</Typography>
            <Typography variant="caption" color="text.secondary">Spec ID</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{detail.spec_id || '\u2014'}</Typography>
            <Typography variant="caption" color="text.secondary">Hazard ID</Typography>
            <Typography variant="body2">{detail.hazard_id || '\u2014'}</Typography>
          </Box>

          {/* Trace Path */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            {detail.sta_enriched ? 'Full Trace Path' : 'Trace Path'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip label={detail.srd_id} size="small" color="primary" />
            {detail.sta_spec_refs?.length > 0 && (detail.sta_spec_refs[0].asws_ref || detail.sta_spec_refs[0].aswui_ref || detail.sta_spec_refs[0].aswis_ref) && (
              <>
                <Typography variant="caption" color="text.secondary">&rarr;</Typography>
                <Chip label="SRS" size="small" variant="outlined" color="info" />
              </>
            )}
            {detail.spec_id && (
              <>
                <Typography variant="caption" color="text.secondary">&rarr;</Typography>
                <Chip label={detail.spec_id} size="small" variant="outlined" />
              </>
            )}
            {detail.sta_design_outputs?.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary">&rarr;</Typography>
                <Chip
                  label={`${JSON.parse(detail.sta_design_outputs[0].design_refs_json || '[]').length} SDD`}
                  size="small" variant="outlined" color="secondary"
                />
              </>
            )}
            {detail.sta_design_outputs?.length > 0 && JSON.parse(detail.sta_design_outputs[0].unit_test_files_json || '[]').length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary">&rarr;</Typography>
                <Chip
                  label={`${JSON.parse(detail.sta_design_outputs[0].unit_test_files_json || '[]').length} UT`}
                  size="small" variant="outlined" color="success"
                />
              </>
            )}
            <Typography variant="caption" color="text.secondary">&rarr;</Typography>
            <Chip label={`${manualEvidence.length} Manual`} size="small" variant="outlined" color="primary" />
            <Chip label={`${catsEvidence.length} CATS`} size="small" variant="outlined" color="info" />
          </Box>

          {/* Gaps */}
          {detail.gaps?.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>Gaps ({detail.gaps.length})</Typography>
              {detail.gaps.map((g, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip label={g.priority} size="small" color={g.priority === 'P1' ? 'error' : g.priority === 'P2' ? 'warning' : 'default'} />
                  <Typography variant="body2">{g.gap_type?.replace(/_/g, ' ')}</Typography>
                </Box>
              ))}
            </>
          )}
        </Grid>

        {/* Middle: Manual Evidence */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Manual Test Cases ({manualEvidence.reduce((s, e) => s + e.tc_count, 0)})
          </Typography>
          {manualEvidence.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No manual evidence</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 200, overflow: 'auto' }}>
              {manualEvidence.map((e, i) => {
                const ids = JSON.parse(e.tc_ids_json || '[]');
                return (
                  <Box key={i} sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{evidenceTypeLabel(e.evidence_type)}</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {ids.slice(0, 5).join(', ')}{ids.length > 5 ? ` +${ids.length - 5} more` : ''}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Grid>

        {/* Right: CATS Evidence */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            CATS Automated ({catsEvidence.reduce((s, e) => s + e.tc_count, 0)})
          </Typography>
          {catsEvidence.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No CATS evidence</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 200, overflow: 'auto' }}>
              {catsEvidence.map((e, i) => {
                const ids = JSON.parse(e.tc_ids_json || '[]');
                return (
                  <Box key={i} sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{evidenceTypeLabel(e.evidence_type)}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {ids.slice(0, 8).map((id, j) => (
                        <Chip key={j} label={id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                      ))}
                      {ids.length > 8 && (
                        <Chip label={`+${ids.length - 8}`} size="small" color="info" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Grid>
      </Grid>

      {/* STA Enrichment Section */}
      {detail.sta_enriched && <StaEnrichmentSection detail={detail} />}
    </Box>
  );
}

export default function TestEvidence({ projectId }) {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [expandedId, setExpandedId] = useState(null);

  const { items, total, loading } = useRtmRequirements(projectId, {
    module: moduleFilter || undefined,
    traceStatus: statusFilter || undefined,
    search: search || undefined,
    limit: rowsPerPage,
    offset: page * rowsPerPage
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Search / Filter Bar */}
      <Card variant="outlined">
        <CardContent sx={{ pb: '12px !important' }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by SRD ID, Spec ID, TC number, feature name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ flex: 2, minWidth: 280 }}
            />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Module</InputLabel>
              <Select value={moduleFilter} label="Module" onChange={(e) => { setModuleFilter(e.target.value); setPage(0); }}>
                {MODULES.map((m) => <MenuItem key={m} value={m}>{m || 'All Modules'}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Evidence</InputLabel>
              <Select value={statusFilter} label="Evidence" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                {EVIDENCE_FILTERS.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {total.toLocaleString()} results
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card variant="outlined">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 560 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }} />
                    <TableCell sx={{ fontWeight: 600 }}>SNO</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Sub-Feature</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>SRD ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Spec ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Modules</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Evidence</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((r) => (
                    <React.Fragment key={r.id}>
                      <TableRow
                        hover
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ px: 0.5 }}>
                          <IconButton size="small">
                            {expandedId === r.id ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.sno}</TableCell>
                        <TableCell>{r.feature}</TableCell>
                        <TableCell>{r.sub_feature || '\u2014'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.srd_id}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.spec_id || '\u2014'}</TableCell>
                        <TableCell>{r.impacted_modules}</TableCell>
                        <TableCell align="center">
                          <Chip label={r.evidence?.length || 0} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">{statusChip(r.trace_status)}</TableCell>
                      </TableRow>
                      {expandedId === r.id && (
                        <TableRow>
                          <TableCell colSpan={9} sx={{ p: 0 }}>
                            <Collapse in={expandedId === r.id}>
                              <DetailPanel requirementId={r.id} />
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
