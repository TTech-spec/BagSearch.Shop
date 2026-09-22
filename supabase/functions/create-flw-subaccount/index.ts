/**
 * Supabase Edge Function: create-flw-subaccount
 *
 * 1. Verifies the account number via Flutterwave's resolve endpoint
 * 2. Creates a Flutterwave split-payment subaccount
 * 3. Saves everything back to seller_bank_details in Supabase
 *
 * Deploy:  supabase functions deploy create-flw-subaccount
 * Secrets: supabase secrets set FLUTTERWAVE_SECRET_KEY=FLWSECK-...
 *          supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth check ─────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { bank_code, account_number, bank_name } = await req.json();

    if (!bank_code || !account_number) {
      return new Response(JSON.stringify({ error: 'bank_code and account_number are required' }), { status: 400, headers: corsHeaders });
    }

    const FLW_SECRET = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    if (!FLW_SECRET) {
      return new Response(JSON.stringify({ error: 'Flutterwave secret key not configured on server' }), { status: 500, headers: corsHeaders });
    }

    const flwHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FLW_SECRET}`,
    };

    // ── Step 1: Resolve / verify the account number ─────────────────────────
    console.log(`Resolving account: bank=${bank_code} number=${account_number}`);

    const resolveRes = await fetch(
      `https://api.flutterwave.com/v3/accounts/resolve`,
      {
        method: 'POST',
        headers: flwHeaders,
        body: JSON.stringify({
          account_number,
          account_bank: bank_code,
        }),
      }
    );

    const resolveData = await resolveRes.json();
    console.log('FLW resolve response:', JSON.stringify(resolveData));

    if (resolveData.status !== 'success') {
      return new Response(JSON.stringify({
        success: false,
        step: 'resolve',
        error: resolveData.message || 'Could not verify your account number. Please check your bank and account number are correct.',
      }), { status: 200, headers: corsHeaders });
    }

    // Use the verified name from Flutterwave — more accurate than what the seller typed
    const verifiedAccountName: string = resolveData.data?.account_name || '';
    console.log('Account verified:', verifiedAccountName);

    // ── Step 2: Create Flutterwave subaccount ───────────────────────────────
    console.log('Creating subaccount for:', verifiedAccountName);

    const subRes = await fetch('https://api.flutterwave.com/v3/subaccounts', {
      method: 'POST',
      headers: flwHeaders,
      body: JSON.stringify({
        account_bank:   bank_code,
        account_number,
        business_name:  verifiedAccountName,
        business_email: user.email,
        country:        'NG',
        split_type:     'percentage',
        split_value:    0,   // seller keeps 100%
      }),
    });

    const subData = await subRes.json();
    console.log('FLW subaccount response:', JSON.stringify(subData));

    if (subData.status !== 'success') {
      return new Response(JSON.stringify({
        success: false,
        step: 'subaccount',
        error: subData.message || 'Account verified but subaccount setup failed. Your details have been saved.',
        account_name: verifiedAccountName,
      }), { status: 200, headers: corsHeaders });
    }

    const subaccountId: string = String(subData.data?.id ?? subData.data?.subaccount_id ?? '');
    console.log('Subaccount created, id:', subaccountId);

    // ── Step 3: Save everything to Supabase ─────────────────────────────────
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set');
      // Return success — client will save with the data we return
      return new Response(JSON.stringify({
        success: true,
        subaccount_id: subaccountId,
        account_name: verifiedAccountName,
        warning: 'Service role key missing — client will save locally',
      }), { status: 200, headers: corsHeaders });
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);

    const { error: dbErr } = await adminClient
      .from('seller_bank_details')
      .upsert({
        user_id:                    user.id,
        bank_name:                  bank_name || bank_code,
        bank_code,
        account_number,
        account_name:               verifiedAccountName,
        flutterwave_subaccount_id:  subaccountId,
        is_verified:                true,
        updated_at:                 new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbErr) {
      console.error('DB upsert failed:', JSON.stringify(dbErr));
      return new Response(JSON.stringify({
        success: true,
        subaccount_id: subaccountId,
        account_name: verifiedAccountName,
        warning: `DB write failed: ${dbErr.message}`,
      }), { status: 200, headers: corsHeaders });
    }

    console.log('All done. Saved for user:', user.id);

    return new Response(JSON.stringify({
      success: true,
      subaccount_id: subaccountId,
      account_name: verifiedAccountName,
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), { status: 500, headers: corsHeaders });
  }
});
