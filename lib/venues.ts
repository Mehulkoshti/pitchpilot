/** FIFA World Cup 2026 host venues. */

/** A FIFA World Cup 2026 host venue. */
export interface Venue {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly country: 'USA' | 'Canada' | 'Mexico';
  /**
   * Approximate seating capacity in tournament configuration. Published figures
   * vary by source and match setup, so these are rounded. Display-only — no
   * engine computes anything from a capacity.
   */
  readonly capacity: number;
}

/** All sixteen host venues (11 USA, 3 Mexico, 2 Canada), largest capacity first. */
export const VENUES: readonly Venue[] = [
  { id: 'att', name: 'AT&T Stadium', city: 'Dallas', country: 'USA', capacity: 94000 },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 83000,
  },
  {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'New York / New Jersey',
    country: 'USA',
    capacity: 82500,
  },
  {
    id: 'mercedes-benz',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'USA',
    capacity: 75000,
  },
  {
    id: 'arrowhead',
    name: 'Arrowhead Stadium',
    city: 'Kansas City',
    country: 'USA',
    capacity: 73000,
  },
  { id: 'nrg', name: 'NRG Stadium', city: 'Houston', country: 'USA', capacity: 72000 },
  {
    id: 'levis',
    name: "Levi's Stadium",
    city: 'San Francisco Bay Area',
    country: 'USA',
    capacity: 71000,
  },
  {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    capacity: 70000,
  },
  { id: 'lumen', name: 'Lumen Field', city: 'Seattle', country: 'USA', capacity: 69000 },
  {
    id: 'lincoln-financial',
    name: 'Lincoln Financial Field',
    city: 'Philadelphia',
    country: 'USA',
    capacity: 69000,
  },
  {
    id: 'gillette',
    name: 'Gillette Stadium',
    city: 'Boston',
    country: 'USA',
    capacity: 65000,
  },
  {
    id: 'hard-rock',
    name: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'USA',
    capacity: 65000,
  },
  {
    id: 'bc-place',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54000,
  },
  {
    id: 'bbva',
    name: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    capacity: 53500,
  },
  {
    id: 'akron',
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    capacity: 48000,
  },
  { id: 'bmo', name: 'BMO Field', city: 'Toronto', country: 'Canada', capacity: 45000 },
];
