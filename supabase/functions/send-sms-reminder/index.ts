
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reminder, phone } = await req.json();
    console.log(`Processing SMS reminder request: ${JSON.stringify(reminder)} to ${phone}`);

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!;

    console.log('Using Twilio configuration:', { 
      accountSid: twilioAccountSid ? 'Set' : 'Not Set', 
      authToken: twilioAuthToken ? 'Set' : 'Not Set',
      phoneNumber: twilioPhoneNumber 
    });

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        },
        body: new URLSearchParams({
          'From': twilioPhoneNumber,
          'To': phone,
          'Body': `Reminder: ${reminder.title}\n${reminder.message}\nScheduled time: ${reminder.time}`
        })
      }
    );

    const responseData = await twilioResponse.json();
    console.log('Twilio response:', responseData);

    return new Response(JSON.stringify({ success: true, twilioResponse: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('SMS sending error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
