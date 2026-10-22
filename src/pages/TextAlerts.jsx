import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import { LEGAL_NAME, ADDRESS_LINE } from "@/lib/business";
import { SMS_OPT_IN_PATH, SMS_WIDGET } from "@/lib/smsOptIn";
import { isSnapshot } from "@/api/salesWire";
import PlainPage, { PlainSection } from "@/components/layout/PlainPage";

/**
 * The SMS opt-in page. See src/lib/smsOptIn.js for why the widget lives here and nowhere else.
 *
 * Arriving by a full page load, the widget is already on its way: the prerender wrote GoHighLevel's
 * tag into this page's HTML. Arriving by a link inside the site, nothing loaded it, so this does.
 * Never during the prerender itself (isSnapshot): the widget would draw itself into the
 * snapshot, and every visitor would get a dead copy of it baked into the HTML.
 *
 * Leaving by a link inside the site reloads the page you were going to. The widget leaves its
 * element, scripts and styles in the document, and the next page has forms of its own; a fresh
 * load is the only removal that does not depend on how GoHighLevel builds the widget this month.
 */
export default function TextAlerts() {
  usePageMeta({
    title: "Text Alerts",
    description: "Sign up for text alerts about upcoming Cash 4 It Now estate sales and coupons for them.",
  });

  useEffect(() => {
    if (!isSnapshot() && !document.querySelector(`script[data-widget-id="${SMS_WIDGET.id}"]`)) {
      const tag = document.createElement("script");
      tag.src = SMS_WIDGET.loader;
      tag.dataset.resourcesUrl = SMS_WIDGET.resources;
      tag.dataset.widgetId = SMS_WIDGET.id;
      tag.dataset.source = "WEB_USER";
      document.body.appendChild(tag);
    }
    return () => {
      if (window.location.pathname !== SMS_OPT_IN_PATH) window.location.reload();
    };
  }, []);

  return (
    <PlainPage
      kicker="Estate Sale Alerts"
      title="Text Alerts"
      intro="Get a text when we announce an estate sale, with coupons for our sales."
    >
      <PlainSection title="How to sign up">
        <p>
          Tap the chat button in the bottom-right corner of this page. Enter your name and mobile number, then tick the
          box to receive marketing text messages from {LEGAL_NAME}. The box is never ticked for you, and signing up is
          optional.
        </p>
      </PlainSection>

      <PlainSection title="What we send">
        <p>
          Announcements of our upcoming public estate sales (the dates, the town and a link to the sale page) and
          discount coupons for those sales. Message frequency varies with our sale calendar.
        </p>
      </PlainSection>

      <PlainSection title="The small print">
        <p>
          Message and data rates may apply. Reply STOP to any message to opt out, or HELP for help. Consent to receive
          texts is not a condition of any purchase. Carriers are not liable for delayed or undelivered messages.
        </p>
        <p>
          We never sell or share your mobile number or your opt-in with third parties for their marketing. Read our{" "}
          <Link to="/privacy" className="text-accent font-bold hover:underline">Privacy Policy</Link> and{" "}
          <Link to="/terms" className="text-accent font-bold hover:underline">Terms of Service</Link>.
        </p>
      </PlainSection>

      <PlainSection title="Questions">
        <p>
          Call{" "}
          <a href={CONTACT_PHONE_HREF} className="text-accent font-bold hover:underline">{CONTACT_PHONE}</a>, or write to{" "}
          {LEGAL_NAME}, {ADDRESS_LINE}.
        </p>
      </PlainSection>
    </PlainPage>
  );
}
