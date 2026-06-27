"""SEC Form ADV (IAPD) connector — regulatory adviser data for US-registered managers.

Every SEC-registered investment adviser files **Form ADV Part 1A**; Item 5 carries hard,
regulator-filed figures: Regulatory Assets Under Management (RAUM), employee counts, and the
number of accounts/clients. Source of record: the SEC IAPD report
`https://reports.adviserinfo.sec.gov/reports/ADV/<CRD>/PDF/<CRD>.pdf` and the SEC's bulk Form
ADV dataset (both free, regulatory-grade).

IMPORTANT METHODOLOGY — entity scope. Form ADV is filed PER LEGAL ENTITY, not per brand. Large
complexes split assets/staff across many registered advisers (e.g. BlackRock's ~$14tn AUM spans
BlackRock Fund Advisors, BlackRock Advisors LLC, BlackRock International, …; BlackRock Fund
Advisors alone reports $4.28tn RAUM and 128 employees — the iShares index arm). So:
  • RAUM ≠ the firm's marketed AUM — it is the single adviser entity's regulatory AUM.
  • Form ADV employees ≠ firm headcount — they are the one entity's staff (under-counts the brand).
Therefore this connector emits Form ADV figures as DISTINCT, clearly-labelled metrics
(`raum`, `ria_employees`, `ria_accounts`) and NEVER overwrites `aum_total` or `headcount`. They
are a regulatory cross-check and texture layer, with each entity's CRD on every value.

To refresh: re-pull each CRD's report PDF (or the SEC bulk dataset), re-read Item 5.F (RAUM),
5.A (employees), 5.F(2) (accounts); update the verified figures below with the new filing date.
"""
from __future__ import annotations

from .schema import MetricObservation


def report_url(crd: str) -> str:
    return f"https://reports.adviserinfo.sec.gov/reports/ADV/{crd}/PDF/{crd}.pdf"


# competitor_id -> the firm's PRIMARY US registered adviser entity, read verbatim from its latest
# Form ADV Part 1A (Item 5). raum/employees/accounts are for THAT entity only (see methodology).
ADV: dict[str, dict] = {
    "BL":            dict(entity="BlackRock Fund Advisors", crd="105247", sec_file="801-22609", filed="2026-05-15", raum=4_282_224_366_957, employees=128, advisory=122, accounts=556),
    "PIMCO":         dict(entity="Pacific Investment Management Company LLC", crd="104559", sec_file="801-48187", filed="2026-05-18", raum=3_666_935_101_247, employees=1_968, advisory=628, accounts=2_835),
    "Fidelity":      dict(entity="Fidelity Management & Research Company LLC", crd="108281", sec_file="801-7884", filed="2026-03-30", raum=5_685_041_930_529, employees=1_427, advisory=744, accounts=37_227),
    "Vanguard":      dict(entity="The Vanguard Group, Inc.", crd="105958", sec_file="801-11953", filed="2026-05-18", raum=11_092_665_107_962, employees=1_702, advisory=19, accounts=228),
    "MS":            dict(entity="Morgan Stanley Investment Management Inc.", crd="110353", sec_file="801-15757", filed="2026-05-29", raum=702_248_681_596, employees=670, advisory=250, accounts=22_803),
    "Goldman Sachs": dict(entity="Goldman Sachs Asset Management, L.P.", crd="107738", sec_file="801-37591", filed="2026-05-26", raum=2_648_902_942_827, employees=2_059, advisory=1_379, accounts=249_499),
    "JPM":           dict(entity="J.P. Morgan Investment Management Inc.", crd="107038", sec_file="801-21011", filed="2026-05-08", raum=3_519_414_511_755, employees=3_194, advisory=2_260, accounts=132_150),
    "PGIM":          dict(entity="PGIM, Inc.", crd="105676", sec_file="801-22808", filed="2026-04-28", raum=1_131_638_605_327, employees=1_990, advisory=1_350, accounts=938),
    "SSgA":          dict(entity="SSGA Funds Management, Inc.", crd="111242", sec_file="801-60103", filed="2026-03-31", raum=1_420_653_842_286, employees=241, advisory=220, accounts=287),
    "UBS":           dict(entity="UBS Asset Management (Americas) LLC", crd="106838", sec_file="801-49972", filed="2026-03-31", raum=588_219_618_121, employees=574, advisory=260, accounts=433_784),
    "Capital Group": dict(entity="Capital Research and Management Company", crd="110885", sec_file="801-8273", filed="2026-05-29", raum=3_753_542_800_892, employees=1_417, advisory=393, accounts=22_833),
}


def build(competitor_id: str, now_iso: str) -> list[MetricObservation]:
    spec = ADV.get(competitor_id)
    if not spec:
        return []
    url = report_url(spec["crd"])
    tag = f"{spec['entity']} (CRD {spec['crd']}, Form ADV filed {spec['filed']})"

    def _obs(key, value, unit, quote, conf):
        return MetricObservation(
            competitor_id=competitor_id, metric_key=key, value=float(value), unit=unit,
            currency="USD" if unit == "USD" else None, period_type="FY", period_end="2025-12-31",
            basis="reported", definition_note="SEC Form ADV Part 1A, Item 5 (single adviser entity).",
            source_doc="SEC Form ADV", source_url=url, source_section=quote, confidence=conf,
            extracted_by="form-adv", extracted_at=now_iso,
        )

    return [
        _obs("raum", spec["raum"], "USD",
             f"Item 5.F regulatory AUM ${spec['raum']:,} — {tag}. NB: single-entity RAUM, not brand AUM.", 0.95),
        _obs("ria_employees", spec["employees"], "count",
             f"Item 5.A employees {spec['employees']:,} ({spec['advisory']:,} advisory) — {tag}. Entity-scoped, not firm headcount.", 0.95),
        _obs("ria_accounts", spec["accounts"], "count",
             f"Item 5.F(2) accounts {spec['accounts']:,} — {tag}.", 0.9),
    ]
