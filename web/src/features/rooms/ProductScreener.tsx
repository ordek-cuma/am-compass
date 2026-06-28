// Product Data Room — the full universe across all managers. Header + the shared ProductTable.
import { ModuleHeader } from '../../components/ModuleHeader'
import { ExportIcon } from '../../components/icons'
import { PRODUCTS, totalAum } from '../../data/products'
import { fnum } from '../../lib/format'
import { ProductTable } from './ProductTable'

export function ProductScreener() {
  return (
    <>
      <ModuleHeader
        crumb={
          <>
            Compass <b>›</b> Rooms <b>›</b> Product Data Room
          </>
        }
        title={
          <>
            Product <span className="em">Data Room</span>
          </>
        }
        sub={`${fnum(PRODUCTS.length)} real products — iShares ETFs (US + EMEA/UCITS) and BlackRock mutual funds (BGF/BSF SICAV + US) — $${(totalAum() / 1e6).toFixed(2)}T AUM. Filter and sort the universe, then open a product for its profile.`}
        actions={
          <>
            <button className="btn">
              <ExportIcon />
              Upload
            </button>
            <button className="btn pri">Request Access</button>
          </>
        }
      />
      <div className="view">
        <ProductTable products={PRODUCTS} />
      </div>
    </>
  )
}
