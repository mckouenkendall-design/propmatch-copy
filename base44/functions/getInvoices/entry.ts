import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's Stripe customer ID from UserProfile
    const profiles = await base44.asServiceRole.entities.UserProfile.list();
    const profile = profiles.find(p => p.user_email === caller.email);

    if (!profile || !profile.stripe_customer_id) {
      return Response.json({ invoices: [] });
    }

    // Fetch invoices from Stripe
    const res = await fetch(
      `https://api.stripe.com/v1/invoices?customer=${profile.stripe_customer_id}&limit=24`,
      {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('Stripe error:', err);
      return Response.json({ invoices: [] });
    }

    const data = await res.json();

    const invoices = (data.data || []).map(inv => ({
      id: inv.id,
      date: inv.created,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      pdf: inv.invoice_pdf,
      description: inv.lines && inv.lines.data && inv.lines.data[0]
        ? inv.lines.data[0].description
        : 'PropMatch Subscription',
    }));

    return Response.json({ invoices });
  } catch (error) {
    console.error('getInvoices error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});