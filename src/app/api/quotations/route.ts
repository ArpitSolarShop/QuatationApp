import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { generateQuoteNumber, gstConfig, calculateSavings, getSubsidyForCapacity } from '@/lib/companyDetails';
import { sendKit19Enquiry } from '@/lib/kit19';

// GET - List all quotations
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const supabase = getServerSupabase();
        let query = supabase
            .from('quotations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as any).message, data: [] }, { status: 500 });
    }
}

// POST - Create new quotation
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            customer_name,
            customer_phone,
            customer_address,
            customer_email,
            system_type_id,
            system_type_name,
            capacity_kw,
            phase,
            brand,
            base_price,
            gst_rate,
            central_subsidy,
            state_subsidy,
            terms,
            components,
            salesperson,
            pdf_url,
            status,
        } = body;

        if (!customer_name) {
            return NextResponse.json({ success: false, message: 'Customer name is required' }, { status: 400 });
        }

        // Generate quote number from customer initials
        const initials = customer_name
            .split(' ')
            .map((n: string) => n.charAt(0).toUpperCase())
            .join('');
        const quote_number = generateQuoteNumber(initials);

        // Calculate GST and totals
        const effectiveGstRate = gst_rate || gstConfig.compositeRate;
        const baseAmount = base_price || 0;
        const gst_amount = +(baseAmount * (effectiveGstRate / 100)).toFixed(2);
        const total_amount = +(baseAmount + gst_amount).toFixed(2);

        // Calculate savings data
        const savings = calculateSavings(
            capacity_kw || 0,
            total_amount,
            central_subsidy,
            state_subsidy
        );

        // Resolve system_type_id if not provided but name is available
        const supabase = getServerSupabase();
        let effectiveSystemTypeId = system_type_id;

        if (!effectiveSystemTypeId && system_type_name) {
            const { data: typeData } = await supabase
                .from('system_types')
                .select('id')
                .eq('name', system_type_name)
                .single();

            if (typeData) {
                effectiveSystemTypeId = typeData.id;
            }
        }

        const { data, error } = await supabase
            .from('quotations')
            .insert([{
                quote_number,
                customer_name,
                customer_phone: customer_phone || null,
                customer_address: customer_address || null,
                customer_email: customer_email || null,
                system_type_id: effectiveSystemTypeId || null,
                capacity_kw: capacity_kw || null,
                phase: phase || 1,
                brand: brand || null,
                base_price: baseAmount,
                gst_rate: effectiveGstRate,
                gst_amount,
                total_amount,
                central_subsidy: central_subsidy ?? getSubsidyForCapacity(capacity_kw || 3).central,
                state_subsidy: state_subsidy ?? getSubsidyForCapacity(capacity_kw || 3).state,
                terms: terms || null,
                components: components || null,
                savings_data: savings,
                salesperson: salesperson || null,
                status: status || 'draft',
                pdf_url: pdf_url || null,
            }])
            .select()
            .single();
        if (error) throw error;

        // Send Enquiry to Kit19
        await sendKit19Enquiry({
            name: customer_name,
            phone: customer_phone || "",
            email: customer_email || "",
            address: customer_address || "",
            systemKw: capacity_kw || "",
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as any).message }, { status: 500 });
    }
}
