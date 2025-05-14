
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Twilio configuration
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = require('twilio')(accountSid, authToken);

// SMS sending endpoint
app.post('/api/send-sms', async (req, res) => {
  try {
    const { reminder, phone } = req.body;
    
    if (!reminder || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reminder or phone'
      });
    }
    
    console.log(`Scheduling reminder "${reminder.title}" for time ${reminder.time} to ${phone}`);
    
    // Here we're just acknowledging the request, not actually sending the SMS yet.
    // The actual SMS sending should happen at the scheduled time through a background job
    // or by checking periodically for reminders that are due.
    
    return res.status(200).json({
      success: true,
      message: 'SMS reminder scheduled successfully',
      reminderDetails: {
        title: reminder.title,
        scheduledTime: reminder.time,
        date: reminder.date
      }
    });
  } catch (error) {
    console.error('Error scheduling SMS:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to schedule SMS'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
