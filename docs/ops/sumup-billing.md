# SumUp billing

NIHAO uses SumUp hosted checkout for paid plans (`PRO`, `BUSINESS`). Free plan changes are not available via direct API in production.

## Configuration

Set in `.env` or environment:

| Variable | Description |
|----------|-------------|
| `BILLING_PROVIDER` | `sumup` (default) or `stub` for local plan assignment |
| `SUMUP_API_KEY` | SumUp API key (Bearer) |
| `SUMUP_MERCHANT_CODE` | Merchant code from SumUp dashboard |
| `SUMUP_WEBHOOK_SECRET` | HMAC secret for `x-payload-signature` verification |
| `SUMUP_REDIRECT_URL` | Return URL after hosted checkout |
| `SUMUP_PRICE_PRO_CENTS` | PRO price in cents (default 4900) |
| `SUMUP_PRICE_BUSINESS_CENTS` | BUSINESS price in cents (default 14900) |

When `SUMUP_API_KEY` is blank or `BILLING_PROVIDER=stub`, the backend uses stub checkout URLs and `POST /api/billing/stub-complete` (OWNER, local/test only).

## Flow

1. **Create checkout** — `POST /api/billing/checkouts` `{ "plan": "PRO" }` (OWNER)
2. Redirect user to `hostedCheckoutUrl`
3. SumUp sends webhook to `POST /api/billing/webhooks/sumup`
4. On `PAID` / `SUCCESSFUL`, checkout is marked paid and `organizations.billing_plan` is updated
5. Poll status — `GET /api/billing/checkouts/{reference}`

## Webhook

Register in SumUp dashboard:

```
https://<your-api-host>/api/billing/webhooks/sumup
```

Header: `x-payload-signature` = HMAC-SHA256 hex of raw body (when `SUMUP_WEBHOOK_SECRET` is set).

## Stub mode (dev/test)

```bash
BILLING_PROVIDER=stub
```

Creates fake checkout URL and allows:

```
POST /api/billing/stub-complete
{ "checkoutReference": "<reference from create checkout>" }
```

Direct `POST /api/billing/plan` remains available only when `BILLING_PROVIDER=stub` or Spring profile is `local` / `test`.
