# Stripe Webhook Implementation Guide

This document outlines the improved Stripe webhook implementation for The Greatest Deals application, following industry best practices and security standards.

## Overview

The webhook implementation handles Stripe events for subscription management, product/price synchronization, and customer data management. It's built with Next.js 14+ and uses Supabase for data persistence.

## Features

### ✅ Security Improvements
- **Webhook Signature Verification**: Validates all incoming webhooks using Stripe's signature verification
- **Environment Variable Validation**: Ensures all required environment variables are present
- **Proper Error Handling**: Returns appropriate HTTP status codes and error messages
- **Input Validation**: Validates webhook payload and required fields

### ✅ Code Quality Improvements
- **Latest Stripe API**: Uses Stripe API version `2024-12-18.acacia`
- **TypeScript Strict Typing**: Full type safety with proper interfaces
- **Structured Logging**: Comprehensive logging with different levels (info, warn, error)
- **Custom Error Classes**: Proper error handling with custom WebhookError class
- **HTTP Method Handling**: Proper handling of unsupported HTTP methods

### ✅ Webhook Event Handling
- **Idempotency**: Safe to retry webhook events
- **Event Filtering**: Only processes relevant events
- **Transaction Safety**: Proper database transaction handling
- **Retry Logic**: Configured retry behavior for Stripe API calls

## Supported Events

The webhook handles the following Stripe events:

| Event | Description | Action |
|-------|-------------|---------|
| `product.created` | New product created in Stripe | Sync to database |
| `product.updated` | Product updated in Stripe | Update database record |
| `price.created` | New price created in Stripe | Sync to database |
| `price.updated` | Price updated in Stripe | Update database record |
| `checkout.session.completed` | Checkout completed | Create/update subscription |
| `customer.subscription.created` | New subscription created | Create subscription record |
| `customer.subscription.updated` | Subscription updated | Update subscription record |
| `customer.subscription.deleted` | Subscription cancelled/deleted | Update subscription status |

## Environment Variables

Required environment variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY_LIVE=sk_live_...  # For production
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Database Schema

The implementation uses the following Supabase tables:

### `customers`
Maps Supabase user IDs to Stripe customer IDs.

### `products`
Stores product information synced from Stripe.

### `prices`
Stores pricing information synced from Stripe.

### `subscriptions`
Stores subscription data with status tracking.

### `users`
Stores user billing information and payment methods.

## API Endpoints

### POST `/api/webhooks`
Main webhook endpoint that processes Stripe events.

**Headers Required:**
- `stripe-signature`: Stripe webhook signature

**Response:**
- `200`: Event processed successfully
- `400`: Invalid signature or bad request
- `405`: Method not allowed
- `500`: Internal server error

## Error Handling

### Webhook Errors
- **Invalid Signature**: Returns 400 with error message
- **Missing Webhook Secret**: Returns 500 with configuration error
- **Unsupported Events**: Returns 200 (event ignored)
- **Processing Errors**: Returns appropriate error status with details

### Database Errors
- **Connection Issues**: Logged and retried
- **Constraint Violations**: Proper error messages
- **Transaction Failures**: Rollback and error reporting

## Logging

The implementation uses structured logging with the following levels:

### Info Level
- Webhook verification success
- Event processing start/completion
- Database operations success
- Customer creation/retrieval

### Warning Level
- Missing billing details
- Non-subscription checkouts
- Customer lookup failures

### Error Level
- Signature verification failures
- Database operation failures
- Stripe API errors
- Processing exceptions

## Security Best Practices

### 1. Webhook Signature Verification
```typescript
// Always verify webhook signatures
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### 2. Environment Variable Validation
```typescript
// Validate required environment variables at startup
if (!webhookSecret) {
  throw new Error('Missing webhook secret');
}
```

### 3. Input Validation
```typescript
// Validate required fields before processing
if (!subscriptionId || !checkoutSession.customer) {
  logWebhookEvent('checkout_missing_data', { subscriptionId, customerId: checkoutSession.customer }, 'warn');
}
```

### 4. Error Sanitization
```typescript
// Don't expose sensitive information in error responses
return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
```

## Monitoring and Debugging

### Webhook Monitoring
1. **Stripe Dashboard**: Monitor webhook delivery status
2. **Application Logs**: Check structured logs for processing status
3. **Database Logs**: Monitor Supabase query performance

### Common Issues

#### Webhook Not Receiving Events
1. Check webhook endpoint URL in Stripe dashboard
2. Verify webhook secret configuration
3. Check application logs for signature verification errors

#### Database Sync Issues
1. Verify Supabase connection
2. Check service role key permissions
3. Review database schema compatibility

#### Subscription Status Mismatch
1. Check webhook event processing logs
2. Verify subscription data in Stripe dashboard
3. Review database subscription records

## Testing

### Local Testing
Use Stripe CLI to forward webhooks to local development:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks

# Test specific events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### Production Testing
1. Use Stripe test mode for initial testing
2. Monitor webhook delivery in Stripe dashboard
3. Check application logs for processing status
4. Verify database records are updated correctly

## Performance Considerations

### Database Operations
- Use upsert operations for idempotency
- Batch operations where possible
- Monitor query performance

### API Rate Limits
- Stripe API has rate limits (100 requests/second by default)
- Implement retry logic with exponential backoff
- Monitor rate limit headers

### Memory Usage
- Process webhook body as stream for large payloads
- Avoid storing large objects in memory
- Use proper garbage collection

## Deployment

### Environment Setup
1. Set all required environment variables
2. Configure webhook endpoint in Stripe dashboard
3. Test webhook delivery
4. Monitor application logs

### Health Checks
Implement health check endpoint to verify:
- Database connectivity
- Stripe API connectivity
- Environment variable configuration

## Troubleshooting

### Webhook Signature Issues
```bash
# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Check signature header
curl -H "stripe-signature: ..." -X POST /api/webhooks
```

### Database Connection Issues
```bash
# Test Supabase connection
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/rest/v1/
```

### Stripe API Issues
```bash
# Test Stripe API connectivity
curl -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  https://api.stripe.com/v1/customers
```

## Future Improvements

### Planned Enhancements
1. **Webhook Retry Logic**: Implement exponential backoff for failed webhooks
2. **Event Queuing**: Use message queue for high-volume webhook processing
3. **Metrics Collection**: Add Prometheus metrics for monitoring
4. **Webhook Testing**: Automated webhook testing suite
5. **Audit Logging**: Comprehensive audit trail for all operations

### Security Enhancements
1. **Rate Limiting**: Implement webhook rate limiting
2. **IP Whitelisting**: Restrict webhook sources to Stripe IPs
3. **Request Validation**: Additional payload validation
4. **Encryption**: Encrypt sensitive data at rest

## Support

For issues or questions:
1. Check application logs for error details
2. Review Stripe webhook documentation
3. Consult Supabase documentation
4. Contact development team

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Stripe API Version**: 2024-12-18.acacia 