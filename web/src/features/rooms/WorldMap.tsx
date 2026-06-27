// Reusable country-footprint map. Highlights the competitor's office countries on a world map
// (d3-geo natural-earth projection + world-atlas topology). Dependency-light, dark-mode safe.
import { useMemo } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldAtlas from 'world-atlas/countries-110m.json'

// Computed once: the country features + a fitted projection path.
const FEATURES = (feature(worldAtlas as never, (worldAtlas as never as { objects: { countries: never } }).objects.countries) as unknown as { features: { properties: { name: string }; type: string }[] }).features
const PROJECTION = geoNaturalEarth1().fitSize([640, 320], { type: 'FeatureCollection', features: FEATURES } as never)
const PATH = geoPath(PROJECTION)

export function WorldMap({ highlight }: { highlight: string[] }) {
  const set = useMemo(() => new Set(highlight), [highlight])
  return (
    <svg viewBox="0 0 640 320" width="100%" role="img" aria-label={`Country footprint — ${highlight.length} highlighted`} style={{ display: 'block' }}>
      {FEATURES.map((c, i) => {
        const on = set.has(c.properties.name)
        return (
          <path key={i} d={PATH(c as never) || ''} fill={on ? 'var(--teal)' : 'var(--surface-2)'}
            stroke="var(--bg)" strokeWidth={0.4} />
        )
      })}
    </svg>
  )
}
