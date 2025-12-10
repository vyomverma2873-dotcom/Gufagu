# Rate Limiting Configuration

## Overview
This document explains the rate limiting configuration for the Guftagu application.

## Rate Limit Settings

### 1. OTP Requests (`otpLimiter`)
- **Window**: 1 minute
- **Limit**: 50 requests per minute (increased from 3)
- **Applied to**: `/api/auth/send-otp`
- **Whitelisted emails**: Bypass rate limiting completely

### 2. Authentication (`authLimiter`)
- **Window**: 15 minutes
- **Limit**: 100 requests per 15 minutes (increased from 20)
- **Applied to**: `/api/auth/verify-otp`
- **Whitelisted emails**: Bypass rate limiting completely

### 3. General API (`apiLimiter`)
- **Window**: 15 minutes
- **Limit**: 100 requests per 15 minutes
- **Applied to**: All API routes globally

## Email Whitelist

The following emails bypass all rate limiting:
- `vyomverma2873@gmail.com` (Admin email)

### Adding More Whitelisted Emails

Edit `/guftagu-backend/middleware/rateLimit.js`:

```javascript
const emailWhitelist = [
  'vyomverma2873@gmail.com',
  'another-email@example.com', // Add here
];
```

## Brevo API Limits

**Free Tier Limits:**
- 300 emails per day
- Rate limits apply per API key

**Note:** The application-level rate limiting is separate from Brevo's API limits. Even with whitelisted emails, you're still subject to Brevo's daily quota.

## Error Messages

### Application Rate Limit
```json
{
  "error": "Too many OTP requests. Please wait before requesting again.",
  "retryAfter": 60
}
```

### Brevo API Rate Limit (429)
```json
{
  "error": "Email service rate limit exceeded. Please try again in a few minutes."
}
```

## Monitoring

Check backend logs for rate limiting events:
```
[Rate Limit] Bypassing OTP rate limit for whitelisted email: vyomverma2873@gmail.com
[Brevo] OTP email sent successfully to vyomverma2873@gmail.com. Message ID: xxx
```

## Production Recommendations

1. **Monitor email usage** to stay within Brevo's daily quota
2. **Consider upgrading** Brevo plan if sending more than 300 emails/day
3. **Implement email queuing** for high-volume scenarios
4. **Add more specific whitelisting** based on user roles (admin, premium users)
5. **Track rate limit hits** in application monitoring/analytics

## Troubleshooting

### Issue: "Too many requests" error
**Solution:** 
1. Check if email is in whitelist
2. Wait for the time window to reset
3. Verify Brevo API quota hasn't been exceeded

### Issue: Emails not being sent
**Solution:**
1. Check Brevo API key is valid
2. Verify sender email is configured
3. Check backend logs for detailed error messages
4. Confirm Brevo account is active and not suspended

## Configuration Files

- Rate limiting logic: `/guftagu-backend/middleware/rateLimit.js`
- Email service: `/guftagu-backend/utils/brevo.js`
- Auth routes: `/guftagu-backend/routes/auth.js`
