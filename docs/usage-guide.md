# Usage Guide

## Home
Open `/` and choose one action:
- Book a Meeting
- Become a Client
- Leave a Message

## Booking Flow
1. Go to `/book`.
2. Select meeting type and date.
3. Click **Find times**.
4. Pick an available slot.
5. Enter name, phone, email.
6. Confirm consent checkbox.
7. Submit.

Expected result:
- Booking stored in `Bookings` tab.
- Calendar event created with summary:
  - `Meeting - <FirstName> - <Phone>`
- Confirmation email to requester.
- Notification email to Ernest.

## Lead Capture Flow
1. Go to `/become-client`.
2. Enter contact details and topic.
3. Enter preferred callback time.
4. Confirm consent checkbox.
5. Submit.

Expected result:
- Row appended to `Leads`.
- Notification email sent to Ernest.

## Message Flow
1. Go to `/leave-message`.
2. Enter details and message reason.
3. Choose urgency and preferred callback time.
4. Confirm consent checkbox.
5. Submit.

Expected result:
- Row appended to `Messages`.
- If urgency is High, or reason contains keywords (`fraud`, `claim deadline`, `death`, `accident`, `debit order`):
  - `flaggedUrgent=true`
  - email subject starts with `URGENT:`

## Admin Dashboard
1. Open `/admin/login`.
2. Login with admin credentials from env vars.
3. Open `/admin`.

Dashboard includes:
- Recent Leads
- Recent Messages
- Recent Bookings
- Hume AI Assistant (admin voice panel)
- CSV export buttons for each

## Hume Assistant Flow
1. Ensure these env vars are set: `HUME_API_KEY`, `HUME_SECRET_KEY`, `HUME_CONFIG_ID`.
2. Open `/admin`.
3. In **Hume AI Assistant (Admin)** click **Start voice session**.
4. Allow microphone permissions when prompted.
5. Use voice or text input.
6. Click **End voice session** when done.

## Privacy Guardrails to Verify
- No policy/account processing.
- No calendar event detail reading for availability.
- Only free/busy usage.
- ID-like number masking in stored free text fields.
- Consent required and timestamp saved.
