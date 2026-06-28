import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Gather inventory listed in the last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const items = await base44.asServiceRole.entities.Inventory.filter(
      { created_date: { $gte: since } },
      'created_date',
      200
    );

    const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.list();

    if (subscribers.length === 0) {
      return Response.json({ message: 'No subscribers to send to', sent: 0, itemCount: items.length });
    }

    if (items.length === 0) {
      return Response.json({ message: 'No new listings this week', sent: 0, itemCount: 0, subscriberCount: subscribers.length });
    }

    const listingLines = items
      .map((it, i) => {
        const price = it.price != null ? ` — $${Number(it.price).toFixed(2)}` : '';
        const category = it.category ? ` [${it.category}]` : '';
        const cond = it.condition ? ` (${it.condition})` : '';
        return `${i + 1}. ${it.title}${price}${category}${cond}`;
      })
      .join('\n');

    const subject = `Weekly New Listings — ${items.length} item${items.length === 1 ? '' : 's'} just added`;
    const body = [
      `Hi there,`,
      ``,
      `Here's what's new on the site this week:`,
      ``,
      listingLines,
      ``,
      `Browse everything and make an offer at: https://cash4itnow.com/for-sale`,
      ``,
      `Thanks for following along,`,
      `Cash4ItNow`,
    ].join('\n');

    let sent = 0;
    let failed = 0;
    for (const sub of subscribers) {
      if (!sub.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: sub.email,
          subject,
          body,
        });
        sent++;
      } catch (e) {
        failed++;
      }
    }

    return Response.json({
      sent,
      failed,
      itemCount: items.length,
      subscriberCount: subscribers.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});