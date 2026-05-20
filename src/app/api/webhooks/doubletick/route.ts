import { NextResponse } from 'next/server';

// This endpoint receives Webhooks from DoubleTick
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.log('\n--- 🔔 DOUBLETICK WEBHOOK RECEIVED ---');
    console.log(JSON.stringify(payload, null, 2));
    
    // DoubleTick event types usually look like "MESSAGE_STATUS_UPDATE"
    if (payload.event === 'MESSAGE_STATUS_UPDATE') {
      const status = payload.data?.status; // e.g. "failed", "delivered", "read"
      const recipient = payload.data?.recipient;
      
      if (status?.toLowerCase() === 'failed') {
        const errorReason = payload.data?.error?.message || payload.data?.errorReason || 'Unknown error';
        console.error(`🚨 WhatsApp Delivery Failed to ${recipient}: ${errorReason}`);
        
        // TODO: Here you can update your database using Supabase
        // Example:
        // await supabase.from('quotations').update({ whatsapp_status: 'failed' }).eq('customer_phone', recipient);
      }
    }

    // Always return 200 OK to acknowledge receipt of the webhook
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Even on error, return 200 to prevent DoubleTick from retrying infinitely
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 200 });
  }
}
