# Email Notifications Implementation

## Overview

Agent Studio now has a complete email notification system that sends alerts when agent runs complete or fail. Notifications are configured per-user and can be customized for success and failure events.

## Features Implemented

✅ **Email Service Integration**
- Support for SendGrid and Mailgun
- Fallback error handling
- Async email sending

✅ **Database Support**
- `Notification` table for notification history
- `UserSettings` updated with:
  - `notification_email`: Email address to send notifications to
  - `notify_on_success`: Boolean to enable success notifications
  - `notify_on_failure`: Boolean to enable failure notifications

✅ **Triggers**
- Automatic notifications on agent run completion
- Automatic notifications on agent run failure
- Notifications sent to agent owner

✅ **Notification Queue**
- Async notification processing
- Notification status tracking (pending, sent, failed)
- Error logging for failed notifications

## Setup Instructions

### 1. Choose Your Email Provider

#### Option A: SendGrid (Recommended)

```bash
# Get your SendGrid API key from https://app.sendgrid.com/settings/api_keys
# Add to .env file:
SENDGRID_API_KEY=your-sendgrid-api-key-here
EMAIL_PROVIDER=sendgrid
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Agent Studio
```

#### Option B: Mailgun

```bash
# Get your Mailgun API key and domain from https://app.mailgun.com
# Add to .env file:
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_PROVIDER=mailgun
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Agent Studio
```

### 2. Update Database

Run migrations to create new tables:

```bash
cd backend
python -m alembic upgrade head
```

Or manually create the tables by restarting the backend (it will auto-create on init).

### 3. Configure User Notifications

Users can configure notifications in Settings:

1. Go to **Settings** page
2. Turn on **Email Notifications** toggle
3. Enter your email address
4. Check the notification types you want:
   - ✅ Notify when runs complete successfully
   - ✅ Notify when runs fail

## How It Works

### Notification Flow

```
Agent Run Completes
    ↓
Chat endpoint saves run with status
    ↓
notification_service.send_run_notification() called
    ↓
Check user notification preferences
    ↓
Create Notification record in database
    ↓
Send email via SendGrid/Mailgun
    ↓
Update notification status (sent/failed)
```

### Email Template

Users receive professional HTML emails with:
- Clear status (✅ Success or ❌ Failed)
- Agent name
- Run ID for reference
- Link to view details in Agent Studio
- Unsubscribe information

## API Changes

### Settings Endpoint Updated

**GET/PATCH `/api/settings/user/{user_id}`**

Now includes:
```json
{
  "id": "...",
  "user_id": "...",
  "theme": "light",
  "notifications_enabled": true,
  "notification_email": "user@example.com",
  "notify_on_success": false,
  "notify_on_failure": true,
  "has_api_key": false,
  "created_at": "...",
  "updated_at": "..."
}
```

## Frontend Updates

### Settings Page

New "Email Notifications" section with:
- Master toggle to enable/disable notifications
- Email input field
- Checkboxes for notification types
- Real-time persistence to backend

## Testing

### Test Email Sending

```bash
# In Python shell or test script
from app.services.email import email_service
import asyncio

result = await email_service.send_email(
    to_email="test@example.com",
    subject="Test Email",
    html_body="<h1>Test</h1>",
    text_body="Test"
)
print(result)  # {'success': True} or {'success': False, 'error': '...'}
```

### Test Notification Trigger

1. Go to Agents page
2. Select any agent and run it
3. On completion, check email inbox
4. Notification should be delivered if:
   - User has notification email configured
   - Notification type is enabled (success/failure)
   - Email provider is configured

## Database Schema

### Notification Table

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    run_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(36) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, failed
    error_message TEXT,
    sent_at VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (run_id) REFERENCES runs(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);
```

### UserSettings Updates

```sql
ALTER TABLE user_settings ADD COLUMN notification_email VARCHAR(255);
ALTER TABLE user_settings ADD COLUMN notify_on_success BOOLEAN DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN notify_on_failure BOOLEAN DEFAULT TRUE;
```

## Environment Variables

```env
# Email Provider (sendgrid or mailgun)
EMAIL_PROVIDER=sendgrid

# SendGrid
SENDGRID_API_KEY=your-api-key

# Mailgun
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=mg.yourdomain.com

# Email Configuration
FROM_EMAIL=noreply@agentstudio.local
FROM_NAME=Agent Studio
```

## Troubleshooting

### Emails not sending?

1. **Check email address is configured**
   - Go to Settings and verify notification email is set

2. **Check notifications are enabled**
   - Toggle should be ON
   - At least one notification type should be checked

3. **Check email provider configuration**
   - Verify API key is correct in .env
   - For Mailgun, verify domain is configured
   - Check error logs in Notification table

4. **Check notification history**
   - Query notifications table for status and error messages
   - Notification records show success/failure and why

### Test with dummy notifications

```python
# In backend shell
from app.services.notification import notification_service
from app.services.email import email_service

# Test email service directly
result = await email_service.send_email(
    to_email="your@email.com",
    subject="Test from Agent Studio",
    html_body="<h1>This is a test</h1>",
    text_body="This is a test"
)
print("Email result:", result)
```

## Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Slack/Teams webhook notifications
- [ ] Notification digest (daily/weekly summary)
- [ ] Notification templates per agent type
- [ ] Bulk notification preferences per workspace
- [ ] Notification scheduling (only during business hours)
- [ ] Do-not-disturb schedules

## Security Considerations

- Email addresses are stored in plaintext (consider encryption in production)
- API keys should be in environment variables, never committed
- Notification history is auditable for compliance
- Consider rate limiting to prevent email spam
