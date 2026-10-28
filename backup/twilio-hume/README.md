# Twilio and Hume backup

Taken out of the live phone path on 28 October 2026. These copies are not imported by the site. The live receptionist is Grok only.

What was backed up:

- Twilio voice webhook, outbound TwiML, and call status webhook
- Hume webhook and the Hume access-token route
- The old admin outbound route that dialled through Twilio and could hand the call to Hume
- The Twilio dialler
- The admin Hume voice widget

Old environment variable names, not the secret values:

- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER was +27110108328
- HUME_API_KEY
- HUME_SECRET_KEY
- HUME_CONFIG_ID
- HUME_API_HOST
- HUME_CONFIG_VERSION
- HUME_PHONE_NUMBER

The Twilio account was not active when this backup was taken. Do not put it back on the call path.
