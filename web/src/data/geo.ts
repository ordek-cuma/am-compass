// Per-competitor geographic footprint — the countries a firm operates in, by world-atlas
// country name (so the Workforce map can highlight them). Add a competitor's countries here as
// they're read from its annual report / 10-K; the map + count light up automatically.
// BlackRock: APAC list verbatim from the FY2025 10-K ("offices in India, Singapore, Hong Kong,
// Japan, Australia, China, Taiwan, Korea, New Zealand, and the Philippines"); Americas + EMEA
// are its principal-office countries.
export const OFFICE_COUNTRIES: Record<string, string[]> = {
  BL: [
    'United States of America', 'Canada', 'Brazil', 'Mexico',
    'United Kingdom', 'France', 'Germany', 'Switzerland', 'Netherlands', 'Italy', 'Spain', 'United Arab Emirates',
    'India', 'Singapore', 'Hong Kong', 'Japan', 'Australia', 'China', 'Taiwan', 'South Korea', 'New Zealand', 'Philippines',
  ],
}

export function countriesFor(code: string): string[] {
  return OFFICE_COUNTRIES[code] ?? []
}
