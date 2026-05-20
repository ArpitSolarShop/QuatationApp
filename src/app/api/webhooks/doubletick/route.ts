import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This endpoint receives Webhooks from DoubleTick
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.log('\n--- 🔔 DOUBLETICK WEBHOOK RECEIVED ---');
    console.log(JSON.stringify(payload, null, 2));
    
    // DoubleTick event types usually look like "MESSAGE_STATUS_UPDATE"
    if (payload.event === 'MESSAGE_STATUS_UPDATE') {
      const status = payload.data?.status; // e.g. "failed", "delivered", "read"
      // Strip out the country code if it starts with 91, or just search loosely
      let recipient = payload.data?.recipient || ""; 
      
      if (status?.toLowerCase() === 'failed') {
        const errorReason = payload.data?.error?.message || payload.data?.errorReason || 'Unknown error';
        console.error(`🚨 WhatsApp Delivery Failed to ${recipient}: ${errorReason}`);
        
        // Remove '91' from the beginning of the phone number if it exists to match the database
        if (recipient.startsWith('91') && recipient.length === 12) {
            recipient = recipient.substring(2);
        }

        // Update the database
        const { error } = await supabase
            .from('quotations')
            .update({ status: 'Failed Delivery' })
            .eq('customer_phone', recipient);
            
        if (error) {
            console.error("Failed to update Supabase status:", error);
        } else {
            console.log(`✅ Updated quotation status to 'Failed Delivery' for phone ${recipient}`);
        }
      }
    }

    // Always return 200 OK to acknowledge receipt of the webhook
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 200 });
  }
}
