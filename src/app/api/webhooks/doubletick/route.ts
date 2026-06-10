import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint receives Webhooks from DoubleTick
// Tracks full message lifecycle: enqueued → sent → delivered → read / failed
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.log('\n--- 🔔 DOUBLETICK WEBHOOK RECEIVED ---');
    console.log('Event:', payload.event);
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    if (payload.event === 'MESSAGE_STATUS_UPDATE') {
      const status = payload.data?.status?.toLowerCase() || '';
      let recipient = payload.data?.recipient || payload.data?.to || "";
      const messageId = payload.data?.messageId || payload.data?.id || "";
      const errorReason = payload.data?.error?.message || payload.data?.errorReason || '';
      const timestamp = new Date().toISOString();

      // Log every status transition for debugging
      console.log(`📱 [${timestamp}] Message ${messageId} to ${recipient}: STATUS = ${status}`);
      if (errorReason) {
        console.log(`   ⚠️ Error: ${errorReason}`);
      }

      // Normalize phone number - strip country code for DB lookup
      if (recipient.startsWith('+91')) {
        recipient = recipient.substring(3);
      } else if (recipient.startsWith('91') && recipient.length === 12) {
        recipient = recipient.substring(2);
      }

      // Map DoubleTick status to our database status
      let dbStatus: string | null = null;
      switch (status) {
        case 'enqueued':
        case 'queued':
          dbStatus = 'Queued';
          console.log(`📤 Message queued for delivery to ${recipient}`);
          break;
        case 'sent':
          dbStatus = 'Sent';
          console.log(`✉️ Message sent to WhatsApp servers for ${recipient}`);
          break;
        case 'delivered':
          dbStatus = 'Delivered';
          console.log(`✅ Message delivered to ${recipient}'s device`);
          break;
        case 'read':
          dbStatus = 'Read';
          console.log(`👀 Message read by ${recipient}`);
          break;
        case 'failed':
        case 'undeliverable':
          dbStatus = 'Failed Delivery';
          console.error(`🚨 WhatsApp Delivery FAILED to ${recipient}: ${errorReason}`);
          break;
        default:
          console.log(`❓ Unknown status "${status}" for ${recipient}`);
          break;
      }

      // Update database with delivery status
      if (dbStatus && recipient) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);

          // Try to update by phone number (last 10 digits)
          const last10 = recipient.slice(-10);
          const { error, count } = await supabase
            .from('quotations')
            .update({
              status: dbStatus,
              // Store the last webhook update for debugging
            })
            .or(`customer_phone.eq.${last10},customer_phone.eq.+91${last10},customer_phone.eq.91${last10}`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error("Failed to update Supabase status:", (error as any).message);
          } else {
            console.log(`✅ Updated quotation status to '${dbStatus}' for phone ending ${last10} (rows: ${count || 'unknown'})`);
          }
        } else {
          console.warn("⚠️ Missing Supabase environment variables - cannot update DB status");
        }
      }
    }

    // Handle incoming messages (optional - useful for debugging)
    if (payload.event === 'INCOMING_MESSAGE') {
      const from = payload.data?.from || '';
      const text = payload.data?.text || payload.data?.body || '';
      console.log(`📩 Incoming message from ${from}: ${text.substring(0, 100)}`);
    }

    // Always return 200 OK to acknowledge receipt of the webhook
    return NextResponse.json({ received: true, timestamp: new Date().toISOString() }, { status: 200 });

  } catch (error: unknown) {
    console.error('Webhook processing error:', (error as Error)?.message || error);
    // Still return 200 to prevent DoubleTick from retrying
    return NextResponse.json({ error: 'Failed to process webhook', received: true }, { status: 200 });
  }
}

// Support GET for webhook verification (some providers require this)
export async function GET() {
  return NextResponse.json({
    status: 'active',
    webhook: 'doubletick',
    timestamp: new Date().toISOString()
  });
}
