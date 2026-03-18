import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { IconX } from '@tabler/icons-react';
import { TYPE_COLORS } from './traceLayout';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1 }}>
      <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
        {value}
      </Typography>
    </Box>
  );
}

function ListField({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <Box sx={{ mb: 1 }}>
      <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary', mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {items.map((item, i) => (
          <Chip key={i} label={item} size="small" variant="outlined"
            sx={{ fontSize: '0.65rem', height: 20, borderColor: 'divider' }} />
        ))}
      </Box>
    </Box>
  );
}

function RequirementDetail({ node }) {
  const d = node.data || {};
  return (
    <>
      {/* Description front and center */}
      {d.description && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(68,170,255,0.06)', border: '1px solid rgba(68,170,255,0.15)', borderRadius: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#4af', mb: 0.5 }}>
            Requirement Text
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#e0e6ed' }}>
            {d.description}
          </Typography>
        </Box>
      )}
      <Field label="SRD ID" value={d.srd_id} />
      <Field label="Feature" value={d.feature} />
      <Field label="Sub-Feature" value={d.sub_feature} />
      <Field label="Software Feature" value={d.software_feature} />
      <Field label="Software Function" value={d.software_function} />
      <Divider sx={{ my: 1 }} />
      <Field label="Impacted Modules" value={d.module} />
      <Field label="PRD Modules" value={d.prd_modules} />
      <Field label="Trace Status" value={d.trace_status} />
      <Field label="Composite Key" value={d.composite_key} />
      <Field label="Spec ID" value={d.spec_id} />
      <Field label="Tracker ID" value={d.tracker_id} />
      <Field label="Hazard ID" value={d.hazard_id} />
    </>
  );
}

function SpecDetail({ node }) {
  const d = node.data || {};
  return (
    <>
      <Field label="Spec Reference" value={node.label} />
      <Field label="Type" value={d.ref_type} />
      <Field label="Description" value={d.description} />
      <Field label="PRD Section" value={d.prd_section} />
      <Field label="Modules" value={d.modules} />
    </>
  );
}

function DesignDetail({ node }) {
  const d = node.data || {};
  return (
    <>
      <Field label="Design Reference" value={d.design_ref || node.label} />
      <ListField label="All Design Refs" items={d.all_refs} />

      {/* SWDD document content */}
      {d.swdd_description && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 1 }}>
            <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#a855f7', mb: 0.5 }}>
              SW Detailed Design — {d.swdd_name || d.design_ref}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#e0e6ed' }}>
              {d.swdd_description}
            </Typography>
          </Box>
          <Field label="Assumptions / Constraints" value={d.swdd_assumptions} />
          <Field label="Risks" value={d.swdd_risks} />
          <Field label="Major Test Areas" value={d.swdd_test_areas} />
          {d.swdd_unit_count > 0 && (
            <Field label="Software Units" value={`${d.swdd_unit_count} units`} />
          )}
          <ListField label="Unit Names" items={d.swdd_units} />
        </>
      )}
    </>
  );
}

function TestDetail({ node }) {
  const d = node.data || {};
  return (
    <>
      <Field label="Evidence Type" value={d.evidence_type} />
      <Field label="Module" value={d.module} />
      <Field label="Test Case Count" value={d.tc_count ? String(d.tc_count) : null} />
      <ListField label="Test Case IDs" items={d.tc_ids} />
      <Field label="Total Files" value={d.total_files ? String(d.total_files) : null} />
      <ListField label="Unit Test Files" items={d.files} />
    </>
  );
}

function GapDetail({ node }) {
  const d = node.data || {};
  return (
    <>
      <Field label="Gap Type" value={d.gap_type} />
      <Field label="Priority" value={d.priority} />
      <Field label="Assigned To" value={d.assigned_to} />
      <Field label="Feature" value={d.feature} />
      <Field label="Module" value={d.module} />
      <Field label="Notes" value={d.notes} />
    </>
  );
}

function FmeaDetail({ node }) {
  const d = node.data || {};
  return (
    <>
      <Field label="FMEA ID" value={node.label} />
      <Field label="Product" value={node.sub} />
      <Field label="Hazard" value={d.hazard} />
      <Field label="Failure Mode" value={d.failure_mode} />
      <Field label="Severity" value={d.severity} />
    </>
  );
}

function FeatureDetail({ node }) {
  const d = node.data || {};
  return (
    <>
      <Field label="Feature" value={node.label} />
      <Field label="Sub-Feature" value={d.sub_feature} />
      <Field label="Software Feature" value={d.software_feature} />
      <Field label="Software Function" value={d.software_function} />
    </>
  );
}

function VersionDetail({ node }) {
  return (
    <>
      <Field label="Versions Verified" value={node.label} />
      <Field label="Version List" value={node.sub} />
    </>
  );
}

const DETAIL_RENDERERS = {
  requirement: RequirementDetail,
  spec: SpecDetail,
  design: DesignDetail,
  test: TestDetail,
  gap: GapDetail,
  fmea: FmeaDetail,
  feature: FeatureDetail,
  version: VersionDetail,
  hazard: ({ node }) => <><Field label="Hazard ID" value={node.label} /><Field label="Detail" value={node.sub} /></>,
};

export default function TraceDetailPanel({ node, open, onClose }) {
  if (!node) return null;
  const type = node.type || 'requirement';
  const colors = TYPE_COLORS[type] || TYPE_COLORS.requirement;
  const Renderer = DETAIL_RENDERERS[type] || DETAIL_RENDERERS.requirement;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 380,
          bgcolor: 'background.paper',
          borderLeft: `2px solid ${colors.border}`,
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: colors.border, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: colors.text, opacity: 0.7 }}>
            {type}
          </Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text }}>
            {node.label}
          </Typography>
          {node.sub && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{node.sub}</Typography>}
        </Box>
        <IconButton size="small" onClick={onClose}><IconX size={18} /></IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
        <Renderer node={node} />
      </Box>
    </Drawer>
  );
}
