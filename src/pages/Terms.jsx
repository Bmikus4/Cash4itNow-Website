import React from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import { LEGAL_NAME, TRADING_NAME, ADDRESS_LINE, CONTACT_EMAIL } from "@/lib/business";
import PlainPage, { PlainSection } from "@/components/layout/PlainPage";

export default function Terms() {
  usePageMeta({
    title: "Terms of Service",
    description: "The terms for using the Cash 4 It Now website and our text message alerts.",
  });

  return (
    <PlainPage kicker="Effective October 22, 2026" title="Terms of Service">
      <p>
        These terms cover your use of www.cash4itnow.com and of the text messages sent by {LEGAL_NAME} ("{TRADING_NAME}",
        "we", "us"). By using the site or signing up for texts, you agree to them.
      </p>

      <PlainSection title="Using this website">
        <p>
          The information on this site, including items, prices and sale dates, is provided to help you plan, and it can
          change without notice. Items can sell before or during a sale. You agree not to misuse the site, interfere with
          how it works or copy its content for commercial use without our permission.
        </p>
      </PlainSection>

      <PlainSection title="Text message alerts">
        <p>
          <span className="font-bold text-foreground">Program:</span> Cash4itNow Text Alerts. When you opt in on our{" "}
          <Link to="/text-alerts" className="text-accent font-bold hover:underline">Text Alerts</Link> page, we send
          announcements of our upcoming estate sales and coupons for those sales to the mobile number you provide.
        </p>
        <p>
          <span className="font-bold text-foreground">Frequency:</span> message frequency varies with our sale calendar.
        </p>
        <p>
          <span className="font-bold text-foreground">Cost:</span> message and data rates may apply.
        </p>
        <p>
          <span className="font-bold text-foreground">Opt out:</span> reply STOP to any message to cancel. We will send one
          message confirming you have been unsubscribed, and then no more.
        </p>
        <p>
          <span className="font-bold text-foreground">Help:</span> reply HELP to any message, or call{" "}
          <a href={CONTACT_PHONE_HREF} className="text-accent font-bold hover:underline">{CONTACT_PHONE}</a>.
        </p>
        <p>
          Consent to receive texts is not a condition of any purchase. Carriers are not liable for delayed or undelivered
          messages. How we handle your number is set out in our{" "}
          <Link to="/privacy" className="text-accent font-bold hover:underline">Privacy Policy</Link>.
        </p>
      </PlainSection>

      <PlainSection title="Liability">
        <p>
          The site is provided as it is. To the extent the law allows, we are not liable for any indirect or
          consequential loss arising from your use of the site or our messages.
        </p>
      </PlainSection>

      <PlainSection title="Governing law">
        <p>These terms are governed by the laws of the Commonwealth of Pennsylvania.</p>
      </PlainSection>

      <PlainSection title="Changes">
        <p>If we change these terms, we will post the new version here with a new effective date.</p>
      </PlainSection>

      <PlainSection title="Contact us">
        <p>
          {LEGAL_NAME}, {ADDRESS_LINE}.
          <br />
          Phone: <a href={CONTACT_PHONE_HREF} className="text-accent font-bold hover:underline">{CONTACT_PHONE}</a>
          <br />
          Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent font-bold hover:underline">{CONTACT_EMAIL}</a>
        </p>
      </PlainSection>
    </PlainPage>
  );
}
