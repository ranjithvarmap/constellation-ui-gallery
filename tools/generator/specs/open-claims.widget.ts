import { defineWidget, p } from '../define';

/**
 * Open claims, from tools/generator/specs/images/open-claims.png
 *
 * Seen: a card headed "Open claims"; a table with columns Claim, Status, Amount;
 *   claim IDs drawn as links (C-1042, C-1057, C-1063); statuses "Pending review",
 *   "Approved", "New"; amounts as money ($1,250.00, $480.00, $3,900.00).
 * Assumed: it sits beside a case (CASE) and lists claims related to it;
 *   the data page takes the case key as CaseInstanceKey;
 *   row fields are pyID, pyStatusWork and ClaimAmount, and each row also carries
 *   pzInsKey and pxObjClass so its claim can be opened;
 *   the currency is the author's choice, US dollars by default.
 * Not covered by the generator: claim IDs as links that open the claim;
 *   amounts formatted as currency.
 */
export default defineWidget({
  name: 'OpenClaims',
  label: 'Open claims',
  description: 'Claims still open for this case, with their status and amount.',
  subtype: 'CASE',
  properties: [p.text('currencyCode', 'Currency code', { defaultValue: 'USD' })],
  list: {
    columns: [
      { field: 'pyID', label: 'Claim' },
      { field: 'pyStatusWork', label: 'Status' },
      { field: 'ClaimAmount', label: 'Amount' },
    ],
    caseParameter: 'CaseInstanceKey',
  },
});
