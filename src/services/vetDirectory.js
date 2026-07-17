import { CENTER } from './seedData'

const offset = (dLat, dLng) => ({
  latitude: CENTER.latitude + dLat,
  longitude: CENTER.longitude + dLng,
})

// Placeholder clinics for local/demo use. Phone numbers use the reserved
// NANP 555 range so they can never resolve to a real number.
export const VET_CLINICS = [
  {
    id: 'vet-1',
    name: 'Mission Emergency Vet Care',
    address: '1420 Valencia St',
    phone: '(415) 555-0101',
    ...offset(0.001, -0.0015),
  },
  {
    id: 'vet-2',
    name: 'Bay Area 24/7 Animal Hospital',
    address: '2200 Bryant St',
    phone: '(415) 555-0142',
    ...offset(-0.0025, 0.002),
  },
  {
    id: 'vet-3',
    name: 'Guerrero Street Veterinary ER',
    address: '900 Guerrero St',
    phone: '(415) 555-0187',
    ...offset(0.003, 0.001),
  },
  {
    id: 'vet-4',
    name: 'Potrero Pet Emergency Clinic',
    address: '600 Potrero Ave',
    phone: '(415) 555-0163',
    ...offset(0.0015, 0.0045),
  },
  {
    id: 'vet-5',
    name: 'SF Feral Cat & Wildlife Vet',
    address: '3100 Mission St',
    phone: '(415) 555-0129',
    ...offset(-0.0045, -0.0008),
  },
  {
    id: 'vet-6',
    name: 'Castro Companion Animal Hospital',
    address: '4400 18th St',
    phone: '(415) 555-0175',
    ...offset(-0.006, -0.004),
  },
]
