import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerInfo,
      selectedProduct,
      salespersonName,
      location,
      extraMargin,
      calculations,
    } = body || {};

    if (!selectedProduct) {
      return NextResponse.json({ success: false, message: 'selectedProduct is required' }, { status: 400 });
    }

    const {
      basePrice = 0,
      marginPrice = 0,
      wirePrice = 0,
      heightPrice = 0,
      outOfVnsPrice = 0,
      subtotal = 0,
      gstAmount = 0,
      total = 0,
      discount = 0,
      grandTotal,
    } = calculations || {};

    const computedGrand = typeof total === 'number' ? +(total - (discount || 0)).toFixed(2) : 0;

    // Map to DB columns (ensure a 'quotes' table exists with these columns)
    const row = {
      customer_name: customerInfo?.name ?? null,
      customer_phone: customerInfo?.phone ?? null,
      customer_address: customerInfo?.address ?? null,
      salesperson_name: salespersonName ?? null,
      location: location ?? null,
      kwp: selectedProduct?.kWp ?? null,
      phase: selectedProduct?.phase ?? null,
      module_watt: selectedProduct?.module ?? null,
      qty: selectedProduct?.qty ?? null,
      base_price: basePrice,
      extra_margin: typeof extraMargin === 'number' ? extraMargin : marginPrice,
      wire_price: wirePrice,
      height_price: heightPrice,
      out_of_vns_price: outOfVnsPrice,
      subtotal,
      gst_amount: gstAmount,
      total,
      discount,
      grand_total: typeof grandTotal === 'number' ? grandTotal : computedGrand,
      channel: body?.channel ?? 'whatsapp',
      tax_rate: typeof body?.taxRate === 'number' ? body.taxRate : 0.089,
      currency: body?.currency ?? 'INR',
      raw_payload: body ?? null,
    };

    const { error } = await supabase.from('internal_quotes').insert([row]);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Save quote error:', error);
    return NextResponse.json(
      { success: false, message: (error as Error)?.message || 'Failed to save quote' },
      { status: 500 }
    );
  }
}
