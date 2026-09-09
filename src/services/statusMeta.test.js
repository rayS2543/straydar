import { describe, expect, it } from 'vitest'
import { STATUS_META, TEMPERAMENT_LABELS, statusColor, statusLabel } from './statusMeta'

describe('statusColor', () => {
  it('returns the configured color for each known status', () => {
    for (const [status, meta] of Object.entries(STATUS_META)) {
      expect(statusColor(status)).toBe(meta.color)
    }
  })

  it('falls back to a default color for unknown statuses', () => {
    expect(statusColor('made-up-status')).toBe('#64748b')
    expect(statusColor(undefined)).toBe('#64748b')
  })
})

describe('statusLabel', () => {
  it('returns the configured label for each known status', () => {
    for (const [status, meta] of Object.entries(STATUS_META)) {
      expect(statusLabel(status)).toBe(meta.label)
    }
  })

  it('falls back to echoing the raw status when unknown', () => {
    expect(statusLabel('made-up-status')).toBe('made-up-status')
  })
})

describe('TEMPERAMENT_LABELS', () => {
  it('has a label for every temperament value used elsewhere in the app', () => {
    expect(TEMPERAMENT_LABELS).toMatchObject({
      friendly: 'Friendly',
      skittish: 'Skittish',
      feral: 'Feral',
      unknown: 'Unknown',
    })
  })
})
