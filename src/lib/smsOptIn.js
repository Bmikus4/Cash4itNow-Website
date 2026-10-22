/**
 * The SMS opt-in: GoHighLevel's chat widget, on a page of its own.
 *
 * Carriers approve the texting number only if this widget is the ONLY thing collecting a phone
 * number or SMS consent on the page it sits on. Every other page has a form (the hero's free
 * evaluation, the coupon signup, the footer's newsletter), so the widget lives at
 * SMS_OPT_IN_PATH alone, the footer hides its form there, and the page reloads on the way out so
 * the widget never follows a visitor onto a page with another form.
 *
 * Plain JS with no imports: scripts/prerender.mjs reads it under Node to write the tag into
 * that page's static HTML, where a compliance scanner that does not run scripts can find it.
 */
export const SMS_OPT_IN_PATH = "/text-alerts";

export const SMS_WIDGET = {
  loader: "https://widgets.leadconnectorhq.com/loader.js",
  resources: "https://widgets.leadconnectorhq.com/chat-widget/loader.js",
  id: "6ad9f51bc5fa6117303e1eef",
};

/** GoHighLevel's embed, attribute for attribute as it issued it. */
export const smsWidgetTag = () =>
  `<script src="${SMS_WIDGET.loader}" data-resources-url="${SMS_WIDGET.resources}" data-widget-id="${SMS_WIDGET.id}" data-source="WEB_USER"></script>`;
