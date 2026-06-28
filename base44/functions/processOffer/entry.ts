import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Message } from 'npm:emailjs@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const {
      item_title,
      item_id,
      listed_price,
      offer_amount,
      customer_name,
      customer_email,
      customer_phone,
      message,
    } = await req.json();

    if (!item_title || listed_price == null || offer_amount == null || !customer_name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listed = Number(listed_price);
    const offer = Number(offer_amount);
    const pct = listed > 0 ? (offer / listed) * 100 : 0;
    const accepted = pct >= 75;

    // Persist the offer for admin review
    await base44.asServiceRole.entities.Offer.create({
      item_title,
      item_id: item_id || null,
      listed_price: listed,
      offer_amount: offer,
      offer_percent: Math.round(pct * 10) / 10,
      customer_name,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      message: message || null,
      status: accepted ? "considered" : "declined",
    });

    // Send an alert email to the builder's Gmail via the Gmail connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    let myEmail = null;
    try {
      const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        myEmail = profile.emailAddress;
      }
    } catch (e) {
      // continue — we'll still attempt to send to "me"
    }

    const subject = `${accepted ? "✅ Offer for Review" : "❌ Offer Declined"}: ${item_title} — $${offer.toFixed(2)} (${pct.toFixed(1)}%)`;
    const body = [
      `A new offer was submitted and ${accepted ? "ACCEPTED for review" : "AUTO-DECLINED"}.`,
      ``,
      `Item: ${item_title}`,
      `Listed Price: $${listed.toFixed(2)}`,
      `Offer: $${offer.toFixed(2)} (${pct.toFixed(1)}% of list)`,
      `Threshold: 75% — ${accepted ? "PASSED" : "BELOW THRESHOLD"}`,
      ``,
      `Customer: ${customer_name}`,
      `Email: ${customer_email || "—"}`,
      `Phone: ${customer_phone || "—"}`,
      `Message: ${message || "—"}`,
    ].join("\n");

    const mimeMessage = new Message({
      from: myEmail || "me",
      to: myEmail || "me",
      subject,
      text: body,
    });
    const raw = await mimeMessage.readAsync();

    const bytes = new TextEncoder().encode(raw);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    const b64url = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: b64url }),
    });

    return Response.json({
      status: accepted ? "considered" : "declined",
      percentage: Math.round(pct * 10) / 10,
      message: accepted
        ? "Your offer is being considered."
        : "We're unable to accept offers below 75% of the listed price.",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});