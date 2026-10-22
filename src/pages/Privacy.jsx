import React from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/api/leadForm";
import { LEGAL_NAME, TRADING_NAME, ADDRESS_LINE, CONTACT_EMAIL } from "@/lib/business";
import PlainPage, { PlainSection } from "@/components/layout/PlainPage";

export default function Privacy() {
  usePageMeta({
    title: "Privacy Policy",
    description: "How Cash 4 It Now collects, uses and protects your information, including text message opt-ins.",
  });

  return (
    <PlainPage kicker="Effective October 22, 2026" title="Privacy Policy">
      <p>
        This policy explains how {LEGAL_NAME} ("{TRADING_NAME}", "we", "us") collects, uses and protects information
        through www.cash4itnow.com, our coupon pages and our text messages.
      </p>

      <PlainSection title="What we collect">
        <p>
          What you give us: your name, phone number, email address and details of a property or the items in it, when
          you ask for an evaluation, contact us, sign up for sale notices, claim a coupon or chat with us through the
          chat widget.
        </p>
        <p>
          What your browser tells us: standard technical information such as your IP address, browser type and the pages
          you visit, recorded by the servers that host our site. Items you save as favorites are kept in your own
          browser, not sent to us.
        </p>
      </PlainSection>

      <PlainSection title="How we use it">
        <p>
          To answer your enquiry, evaluate and run estate sales and cleanouts, send you the sale notices, coupons and
          text messages you asked for, and keep our website working and secure.
        </p>
      </PlainSection>

      <PlainSection title="Who we share it with">
        <p>
          We do not sell your information. We share it only with service providers who run our systems for us, such as
          our website host and our customer messaging and CRM platform (LeadConnector / HighLevel), and only so they can
          provide that service to us. We may also disclose information when the law requires it.
        </p>
      </PlainSection>

      <PlainSection title="Text messages">
        <p>
          If you opt in to text messages on our{" "}
          <Link to="/text-alerts" className="text-accent font-bold hover:underline">Text Alerts</Link> page, we use your
          mobile number to send the messages you agreed to. Message frequency varies, message and data rates may apply,
          and you can reply STOP to opt out or HELP for help at any time.
        </p>
        <p className="font-bold text-foreground">
          No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.
          Information sharing to subcontractors in support services, such as customer service, is permitted. All other
          use case categories exclude text messaging originator opt-in data and consent; this information will not be
          shared with any third parties.
        </p>
      </PlainSection>

      <PlainSection title="Your choices">
        <p>
          You can opt out of texts by replying STOP, and out of emails with the unsubscribe link in any email. To see,
          correct or delete the information we hold about you, contact us using the details below.
        </p>
      </PlainSection>

      <PlainSection title="How long we keep it">
        <p>
          We keep your information for as long as we need it for the purposes above, or as long as the law requires,
          and then delete it.
        </p>
      </PlainSection>

      <PlainSection title="Children">
        <p>Our website and messages are not directed to children under 13, and we do not knowingly collect their information.</p>
      </PlainSection>

      <PlainSection title="Changes">
        <p>If we change this policy, we will post the new version here with a new effective date.</p>
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
