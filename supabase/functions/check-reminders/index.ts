
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const accountSid = Deno.env.get("ACCOUNT_SID");
const authToken = Deno.env.get("AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const handler = async (_req: Request): Promise<Response> => {
  try {
    const now = new Date();
    
    // Format current time to match the format we're storing in the database
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    
    console.log(`Checking reminders at current time: ${currentTimeStr}`);

    // Query for reminders that are due at the current time and not completed
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')
      .eq('completed', false)
      .eq('time', currentTimeStr);

    if (remindersError) {
      throw remindersError;
    }

    console.log(`Found ${reminders?.length || 0} reminders to process for time ${currentTimeStr}`);

    for (const reminder of reminders || []) {
      console.log(`Processing reminder: ${JSON.stringify(reminder)}`);
      
      if (reminder.sendSMS && reminder.phone) {
        try {
          const client = require('twilio')(accountSid, authToken);
          await client.messages.create({
            body: `Reminder: ${reminder.title}\n${reminder.message}`,
            from: twilioPhoneNumber,
            to: reminder.phone
          });
          console.log(`SMS sent for reminder: ${reminder.id} to ${reminder.phone}`);
        } catch (error) {
          console.error(`Failed to send SMS for reminder ${reminder.id}:`, error);
        }
      }

      // Mark reminder as completed
      const { error: updateError } = await supabase
        .from('reminders')
        .update({ completed: true })
        .eq('id', reminder.id);

      if (updateError) {
        console.error(`Failed to mark reminder ${reminder.id} as completed:`, updateError);
      } else {
        console.log(`Marked reminder ${reminder.id} as completed`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processedCount: reminders?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
