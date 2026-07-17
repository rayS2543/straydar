export const STATUS_META = {
  lost: { label: 'Lost Cat', color: '#c8362b' },
  stray_resident: { label: 'Stray Resident / Colony', color: '#29875f' },
  sighted_temporary: { label: 'Sighting (unverified)', color: '#c9a227' },
  found: { label: 'Found', color: '#2f5fd6' },
}

export const TEMPERAMENT_LABELS = {
  friendly: 'Friendly',
  skittish: 'Skittish',
  feral: 'Feral',
  unknown: 'Unknown',
}

export function statusColor(status) {
  return STATUS_META[status]?.color ?? '#64748b'
}

export function statusLabel(status) {
  return STATUS_META[status]?.label ?? status
}
