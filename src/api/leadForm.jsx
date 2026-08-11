import React, { useCallback, useId, useRef, useState } from "react";
import { startLeadTimer, submitLead } from "@/api/leadClient";

export const CONTACT_PHONE = "412-969-7757";
export const CONTACT_PHONE_HREF = "tel:4129697757";

// The honeypot has to be a real, focusable input a bot will happily fill.
// `type="hidden"` and `display:none` are the two things a form-filling script
// checks for, so it is moved off-screen instead — visually gone, still in the
// DOM, still submittable.
const HONEYPOT_WRAPPER_STYLE = {
  position: "absolute",
  left: "-9999px",
  width: "1px",
  height: "1px",
  overflow: "hidden",
};

const ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT || undefined;

/**
 * Everything a form needs to speak the lead contract: the mount timestamp, the
 * honeypot input, and a `submit` that carries both.
 *
 * `elapsedMs` is measured from mount, not from submit — it is a spam signal the
 * server has no other way to obtain, and a timer started at submit measures
 * nothing.
 */
export function useLeadForm() {
  const fieldId = useId();
  const mountedAt = useRef(0);
  if (mountedAt.current === 0) mountedAt.current = startLeadTimer();

  const [honeypot, setHoneypot] = useState("");

  const honeypotField = (
    <div style={HONEYPOT_WRAPPER_STYLE} aria-hidden="true">
      <label htmlFor={fieldId}>Company website</label>
      <input
        id={fieldId}
        name="company_website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />
    </div>
  );

  const submit = useCallback(
    (formId, fields) =>
      submitLead({
        formId,
        fields,
        mountedAt: mountedAt.current,
        honeypot,
        endpoint: ENDPOINT,
      }),
    [honeypot]
  );

  return { honeypotField, submit };
}
