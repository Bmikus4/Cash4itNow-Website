/**
 * Commerce — cart, checkout, buy-now — is off for V1.
 *
 * The site cannot take money: there is no payment processor and no order
 * record, so every "buy" path ends in an email nobody can reconcile. The code
 * is kept rather than deleted because the decision is a scheduling one, not a
 * design one. Flip VITE_ENABLE_COMMERCE=1 to bring it back.
 *
 * Making an offer is NOT commerce and stays on: it is a lead, and it posts to
 * the lead endpoint like every other form.
 */
export const COMMERCE_ENABLED = import.meta.env.VITE_ENABLE_COMMERCE === "1";
