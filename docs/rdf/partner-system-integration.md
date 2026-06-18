# RDF Partner System Integration

This document explains how external partners work with RDF, how a partner account is paired with the RDF system, which API requests RDF accepts, which webhook requests RDF accepts, and which webhook responses RDF sends back to partner platforms.

RDF here means the standalone logistics/API layer inside the RMF ecosystem. RMF Market can be one partner, but RDF must also work for outside platforms such as shops, restaurants, pharmacies, marketplaces, and other apps that want delivery without building their own rider network.

---

## 1. Current repo facts used for this design

The current repository is a monorepo named `rmf-platform` with workspaces under `apps/*` and `packages/*`.

The currently inspected NestJS service is `apps/market-service`. It uses MongoDB/Mongoose, registers `ContractsModule` and `MarketModule`, and exposes its routes under the global prefix:

```txt
/api/v1
```

Current implemented public/system endpoints include:

```txt
GET  /api/v1/contracts
GET  /api/v1/contracts/active
GET  /api/v1/contracts/:version
GET  /api/v1/markets
GET  /api/v1/markets/agreement
GET  /api/v1/markets/slug/:slug
GET  /api/v1/markets/geocode/search?query=...
GET  /api/v1/markets/geocode/reverse?lat=...&lng=...
GET  /api/v1/markets/:id
```

Current protected/admin market endpoints include:

```txt
POST /api/v1/markets/upload-image
POST /api/v1/markets
PUT  /api/v1/markets/:id
POST /api/v1/markets/sync-imagery
POST /api/v1/markets/:id/penalties
```

The shared response shape already supports this standard pattern:

```ts
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}
```

The system already has useful enums for order, payment, and delivery states. Partner-facing APIs should reuse these meanings instead of inventing separate status names.

---

## 2. Partner role in RDF

A partner is any external business system that wants RDF to handle delivery operations.

Examples:

- RMF Market
- A restaurant ordering app
- A pharmacy app
- A supermarket
- A public-market seller platform
- A business with many branches
- A third-party ecommerce website

The partner owns the customer relationship and the order/business logic. RDF owns logistics execution.

### Partner responsibilities

The partner is responsible for:

1. Creating the customer order in its own system.
2. Collecting or confirming payment when RDF is not the payment owner.
3. Sending pickup and dropoff data to RDF.
4. Showing RDF quote results to the customer.
5. Confirming that a delivery should be created.
6. Receiving RDF status webhooks.
7. Updating its own order status based on RDF events.
8. Handling customer-facing support unless the issue is directly caused by RDF delivery.

### RDF responsibilities

RDF is responsible for:

1. Validating partner credentials.
2. Calculating delivery price.
3. Locking the quote for a limited time.
4. Applying route, distance, slope, rain, time-window, service-level, and eligibility rules.
5. Filtering riders by location, availability, verification, equipment, and restrictions.
6. Broadcasting the request to eligible riders.
7. Assigning a rider.
8. Tracking pickup, transit, and dropoff.
9. Sending reliable webhooks to the partner.
10. Managing delivery failure, cancellation, dispute, and evidence flows.
11. Preparing settlement/payout records if RDF controls payment or escrow.

---

## 3. Partner pairing with RDF

Partner pairing is the process of connecting a partner business account to RDF so API calls and webhooks can be trusted.

### Step 1: Partner application

The partner gives RDF:

```json
{
  "businessName": "Kimironko Fresh Foods",
  "businessType": "marketplace",
  "contactName": "Operations Manager",
  "contactPhone": "+250788000000",
  "contactEmail": "ops@example.rw",
  "websiteUrl": "https://partner.example.rw",
  "supportPhone": "+250788111111",
  "preferredSettlementMethod": "momo",
  "expectedDailyRequests": 120
}
```

RDF validates the partner, reviews risk, confirms service area, and assigns a `partnerId`.

### Step 2: Contract acceptance

The partner must accept the active RDF/RMF partner contract before production access.

Current repo contract endpoints already support reading contract versions:

```txt
GET /api/v1/contracts/active
GET /api/v1/contracts/:version
```

Recommended production endpoint to add:

```txt
POST /api/v1/partner-api/contracts/accept
```

Request:

```json
{
  "contractVersion": "3.0",
  "acceptedByName": "Divin Mahoro",
  "acceptedByRole": "Founder",
  "acceptedByEmail": "founder@partner.rw",
  "acceptedAt": "2026-06-18T13:00:00.000Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "partnerId": "ptr_01JY0000000000000000000000",
    "contractVersion": "3.0",
    "status": "accepted",
    "acceptedAt": "2026-06-18T13:00:00.000Z"
  }
}
```

### Step 3: Credential creation

RDF creates:

```json
{
  "partnerId": "ptr_01JY0000000000000000000000",
  "apiKeyId": "key_live_01JY0000000000000000000000",
  "apiSecret": "shown_once_only",
  "webhookSigningSecret": "shown_once_only",
  "environment": "production",
  "scopes": [
    "quotes:create",
    "requests:create",
    "requests:read",
    "requests:cancel",
    "webhooks:receive"
  ]
}
```

Secrets must be shown once, hashed in storage, and never returned again.

### Step 4: Webhook URL pairing

The partner registers webhook URLs:

```json
{
  "webhookUrl": "https://partner.example.rw/webhooks/rdf",
  "events": [
    "quote.expired",
    "delivery.requested",
    "rider.assigned",
    "rider.arrived_at_pickup",
    "pickup.confirmed",
    "delivery.in_transit",
    "delivery.delivered",
    "delivery.failed",
    "request.cancelled",
    "settlement.ready"
  ]
}
```

RDF sends a verification challenge:

```json
{
  "eventId": "evt_01JYVERIFY000000000000000",
  "eventType": "webhook.verification",
  "partnerId": "ptr_01JY0000000000000000000000",
  "data": {
    "challenge": "verify_5c29b4e4df"
  },
  "sentAt": "2026-06-18T13:05:00.000Z"
}
```

Partner must respond:

```json
{
  "success": true,
  "challenge": "verify_5c29b4e4df"
}
```

After this, the webhook endpoint becomes active.

---

## 4. Authentication and signing

All partner API calls should include:

```txt
Authorization: Bearer <partner-api-token>
X-RDF-Partner-Id: ptr_...
X-RDF-Key-Id: key_live_...
X-RDF-Timestamp: 2026-06-18T13:10:00.000Z
X-RDF-Signature: sha256=<hmac_signature>
X-Idempotency-Key: partner-generated-unique-key
Content-Type: application/json
```

Recommended signature base string:

```txt
METHOD\nPATH\nTIMESTAMP\nIDEMPOTENCY_KEY\nSHA256_BODY_HASH
```

Example:

```txt
POST
/api/v1/partner-api/quotes
2026-06-18T13:10:00.000Z
quote-rmf-20260618-0001
8a6f...
```

RDF should reject requests when:

- API key is unknown.
- Partner is inactive or suspended.
- Signature is missing or invalid.
- Timestamp is too old, for example older than 5 minutes.
- Idempotency key was already used with a different payload.
- Partner scope does not allow the requested action.

---

## 5. Partner API request/response rules

### Base URL

```txt
https://api.rdf.rw/api/v1/partner-api
```

For local development:

```txt
http://localhost:3002/api/v1/partner-api
```

### Standard success response

```json
{
  "success": true,
  "data": {}
}
```

### Standard error response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "The request signature is invalid.",
    "details": {
      "header": "X-RDF-Signature"
    }
  }
}
```

### Common error codes

| Code | Meaning |
|---|---|
| `INVALID_SIGNATURE` | HMAC or token validation failed. |
| `PARTNER_DISABLED` | Partner account is suspended or inactive. |
| `CONTRACT_NOT_ACCEPTED` | Partner has not accepted the active contract. |
| `INVALID_PAYLOAD` | Request body failed validation. |
| `OUTSIDE_SERVICE_AREA` | Pickup/dropoff is outside supported area. |
| `QUOTE_EXPIRED` | Quote lock expired before request creation. |
| `DUPLICATE_REFERENCE` | Partner order reference already exists. |
| `NO_RIDER_AVAILABLE` | RDF could not find eligible riders. |
| `RAIN_PROTECTION_REQUIRED` | Rain rules require protected riders only. |
| `RATE_LIMITED` | Partner exceeded allowed request rate. |
| `WEBHOOK_NOT_VERIFIED` | Partner webhook has not passed verification. |

---

## 6. Accepted API requests from partners

These are the main API requests partner systems should send to RDF.

## 6.1 Create delivery quote

```txt
POST /api/v1/partner-api/quotes
```

Purpose: calculate delivery fee, rider payout, company margin, route rules, and quote lock before the partner creates a real delivery request.

Request:

```json
{
  "partnerOrderReference": "ORD-20260618-0001",
  "serviceType": "PRODUCT_DELIVERY",
  "serviceLevel": "standard",
  "pickup": {
    "name": "Kimironko Market - Stall A12",
    "phone": "+250788111111",
    "address": "Kimironko Market, Kigali",
    "coordinates": {
      "lat": -1.9368,
      "lng": 30.1307
    },
    "notes": "Meet seller near Gate 2"
  },
  "dropoff": {
    "name": "Customer",
    "phone": "+250788222222",
    "address": "KG 11 Ave, Kigali",
    "coordinates": {
      "lat": -1.9499,
      "lng": 30.0920
    },
    "notes": "Call on arrival"
  },
  "package": {
    "category": "groceries",
    "description": "Vegetables and fruits",
    "declaredValueRwf": 15000,
    "weightKg": 4.5,
    "requiresColdChain": false,
    "fragile": false
  },
  "requestedPickupTime": "now",
  "paymentMode": "partner_collected",
  "customerPaidDeliveryFee": false
}
```

Response:

```json
{
  "success": true,
  "data": {
    "quoteId": "qt_01JYQUOTE0000000000000000",
    "partnerOrderReference": "ORD-20260618-0001",
    "currency": "RWF",
    "finalDeliveryFee": 1200,
    "riderPayout": 840,
    "companyMargin": 360,
    "pricingBreakdown": {
      "baseFee": 500,
      "distanceFee": 350,
      "slopeFee": 150,
      "timeWindowFee": 100,
      "rainFee": 0,
      "serviceLevelFee": 100
    },
    "route": {
      "distanceKm": 5.8,
      "estimatedMinutes": 23,
      "encodedPolyline": "optional_polyline",
      "slopeDifficultyScore": 0.34
    },
    "dispatchRules": {
      "strategy": "PROGRESSIVE_RADIUS",
      "initialRadiusMeters": 700,
      "stepMeters": 500,
      "maxRadiusMeters": 4000,
      "requiredRiderCapabilities": ["VERIFIED"],
      "rainProtectedOnly": false
    },
    "quoteLock": {
      "lockedUntil": "2026-06-18T13:25:00.000Z",
      "expiresInSeconds": 900
    }
  }
}
```

## 6.2 Create delivery request from quote

```txt
POST /api/v1/partner-api/requests
```

Purpose: turn a valid quote into a live RDF delivery request and begin rider matching.

Request:

```json
{
  "quoteId": "qt_01JYQUOTE0000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "customer": {
    "name": "Customer Name",
    "phone": "+250788222222"
  },
  "handover": {
    "pickupVerification": "SELLER_CONFIRMATION_AND_RIDER_PHOTO",
    "dropoffVerification": "CUSTOMER_PIN",
    "dropoffPinRequired": true
  },
  "metadata": {
    "partnerOrderUrl": "https://partner.example.rw/orders/ORD-20260618-0001",
    "branchId": "branch_kimironko",
    "notesForSupport": "Customer already paid partner"
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "requestId": "req_01JYREQ00000000000000000",
    "quoteId": "qt_01JYQUOTE0000000000000000",
    "partnerOrderReference": "ORD-20260618-0001",
    "status": "placed",
    "deliveryStatus": "assigned",
    "paymentStatus": "paid",
    "dispatch": {
      "strategy": "PROGRESSIVE_RADIUS",
      "broadcastCount": 1,
      "currentRadiusMeters": 700,
      "nextRadiusMeters": 1200
    },
    "trackingUrl": "https://rdf.rw/track/req_01JYREQ00000000000000000",
    "createdAt": "2026-06-18T13:11:00.000Z"
  }
}
```

## 6.3 Create delivery request without prior quote

```txt
POST /api/v1/partner-api/requests/direct
```

Purpose: allow trusted partners to create a request in one step. RDF still calculates and locks pricing internally.

Use this only for partners with pre-approved rules because the customer might not see the quote before dispatch.

Response should include the generated quote and request together:

```json
{
  "success": true,
  "data": {
    "quote": {
      "quoteId": "qt_01JYQUOTE0000000000000001",
      "finalDeliveryFee": 1200,
      "riderPayout": 840,
      "companyMargin": 360
    },
    "request": {
      "requestId": "req_01JYREQ00000000000000001",
      "status": "placed",
      "deliveryStatus": "assigned"
    }
  }
}
```

## 6.4 Get request status

```txt
GET /api/v1/partner-api/requests/:requestId
```

Response:

```json
{
  "success": true,
  "data": {
    "requestId": "req_01JYREQ00000000000000000",
    "partnerOrderReference": "ORD-20260618-0001",
    "status": "in_transit",
    "deliveryStatus": "en_route_to_dropoff",
    "paymentStatus": "paid",
    "rider": {
      "name": "Jean Rider",
      "phone": "+250788333333",
      "plateNumber": "RAA 123B"
    },
    "pickup": {
      "sellerConfirmed": true,
      "riderConfirmed": true,
      "pickedUpAt": "2026-06-18T13:28:00.000Z"
    },
    "dropoff": {
      "estimatedArrivalAt": "2026-06-18T13:48:00.000Z"
    },
    "route": {
      "distanceKm": 5.8,
      "estimatedMinutes": 23,
      "actualMinutes": null
    },
    "lastKnownLocation": {
      "lat": -1.9412,
      "lng": 30.1111,
      "recordedAt": "2026-06-18T13:36:00.000Z"
    },
    "updatedAt": "2026-06-18T13:36:00.000Z"
  }
}
```

## 6.5 Cancel request

```txt
POST /api/v1/partner-api/requests/:requestId/cancel
```

Request:

```json
{
  "reason": "CUSTOMER_CANCELLED",
  "cancelledBy": "partner",
  "note": "Customer cancelled before rider pickup."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "requestId": "req_01JYREQ00000000000000000",
    "status": "cancelled",
    "deliveryStatus": "failed",
    "cancellationFeeRwf": 0,
    "cancelledAt": "2026-06-18T13:20:00.000Z"
  }
}
```

## 6.6 Report issue or dispute

```txt
POST /api/v1/partner-api/requests/:requestId/disputes
```

Request:

```json
{
  "reason": "ITEM_DAMAGED",
  "description": "Customer reported damaged package after delivery.",
  "evidenceUrls": [
    "https://partner.example.rw/evidence/photo-1.jpg"
  ],
  "requestedResolution": "refund"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "disputeId": "dsp_01JYDISPUTE0000000000000",
    "requestId": "req_01JYREQ00000000000000000",
    "status": "open",
    "resolution": null,
    "createdAt": "2026-06-18T14:10:00.000Z"
  }
}
```

---

## 7. Webhook requests accepted by RDF

These are webhooks or server-to-server callbacks that RDF should accept from partner systems.

All incoming partner webhooks must use the same HMAC signing logic as API calls.

## 7.1 Partner payment confirmed

```txt
POST /api/v1/partner-webhooks/payment-confirmed
```

Purpose: partner tells RDF the customer has paid and delivery can continue.

Request:

```json
{
  "eventId": "p_evt_20260618_0001",
  "eventType": "partner.payment.confirmed",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "amountRwf": 16200,
  "deliveryFeeRwf": 1200,
  "paymentReference": "MOMO-PAY-998877",
  "paidAt": "2026-06-18T13:09:00.000Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "eventId": "p_evt_20260618_0001",
    "accepted": true,
    "requestId": "req_01JYREQ00000000000000000",
    "paymentStatus": "paid"
  }
}
```

## 7.2 Partner payment failed

```txt
POST /api/v1/partner-webhooks/payment-failed
```

Request:

```json
{
  "eventId": "p_evt_20260618_0002",
  "eventType": "partner.payment.failed",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "paymentReference": "MOMO-PAY-998877",
  "reason": "INSUFFICIENT_FUNDS",
  "failedAt": "2026-06-18T13:09:30.000Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "eventId": "p_evt_20260618_0002",
    "accepted": true,
    "paymentStatus": "failed",
    "deliveryRequestCreated": false
  }
}
```

## 7.3 Partner order cancelled

```txt
POST /api/v1/partner-webhooks/order-cancelled
```

Request:

```json
{
  "eventId": "p_evt_20260618_0003",
  "eventType": "partner.order.cancelled",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "reason": "CUSTOMER_CANCELLED",
  "cancelledAt": "2026-06-18T13:12:00.000Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "eventId": "p_evt_20260618_0003",
    "accepted": true,
    "requestStatus": "cancelled",
    "deliveryStatus": "failed"
  }
}
```

## 7.4 Partner store or pickup unavailable

```txt
POST /api/v1/partner-webhooks/pickup-unavailable
```

Request:

```json
{
  "eventId": "p_evt_20260618_0004",
  "eventType": "partner.pickup.unavailable",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "reason": "SELLER_NOT_READY",
  "availableAfter": "2026-06-18T13:45:00.000Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "eventId": "p_evt_20260618_0004",
    "accepted": true,
    "requestStatus": "preparing",
    "deliveryAction": "pause_or_rebroadcast_later"
  }
}
```

---

## 8. Webhooks RDF sends to partners

RDF sends webhooks to the partner webhook URL registered during pairing.

### RDF webhook headers

```txt
X-RDF-Event-Id: evt_01JY...
X-RDF-Event-Type: rider.assigned
X-RDF-Partner-Id: ptr_...
X-RDF-Timestamp: 2026-06-18T13:21:00.000Z
X-RDF-Signature: sha256=<hmac_signature>
Content-Type: application/json
```

The partner must return HTTP `2xx` quickly. Recommended response:

```json
{
  "success": true,
  "received": true
}
```

RDF should retry failed webhook delivery with backoff:

1. 1 minute
2. 5 minutes
3. 15 minutes
4. 1 hour
5. 6 hours
6. 24 hours

After final failure, mark the webhook as `dead_lettered` and show it in the admin dashboard.

## 8.1 delivery.requested

Sent when RDF accepts the partner request and creates the delivery workflow.

```json
{
  "eventId": "evt_01JY0000000000000000000001",
  "eventType": "delivery.requested",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "status": "placed",
    "deliveryStatus": "assigned",
    "trackingUrl": "https://rdf.rw/track/req_01JYREQ00000000000000000"
  },
  "sentAt": "2026-06-18T13:11:05.000Z"
}
```

## 8.2 rider.assigned

Sent when a verified rider accepts the delivery.

```json
{
  "eventId": "evt_01JY0000000000000000000002",
  "eventType": "rider.assigned",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "deliveryStatus": "assigned",
    "rider": {
      "name": "Jean Rider",
      "phone": "+250788333333",
      "plateNumber": "RAA 123B",
      "vehicleType": "moto"
    },
    "estimatedPickupAt": "2026-06-18T13:25:00.000Z",
    "estimatedDropoffAt": "2026-06-18T13:48:00.000Z"
  },
  "sentAt": "2026-06-18T13:16:00.000Z"
}
```

## 8.3 rider.arrived_at_pickup

```json
{
  "eventId": "evt_01JY0000000000000000000003",
  "eventType": "rider.arrived_at_pickup",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "deliveryStatus": "pending_handover",
    "arrivedAt": "2026-06-18T13:24:00.000Z"
  },
  "sentAt": "2026-06-18T13:24:05.000Z"
}
```

## 8.4 pickup.confirmed

```json
{
  "eventId": "evt_01JY0000000000000000000004",
  "eventType": "pickup.confirmed",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "status": "picked_up",
    "deliveryStatus": "picked_up",
    "pickup": {
      "sellerConfirmed": true,
      "riderConfirmed": true,
      "pickupPhotoUrl": "https://cdn.rdf.rw/pickups/photo.jpg",
      "pickedUpAt": "2026-06-18T13:28:00.000Z"
    }
  },
  "sentAt": "2026-06-18T13:28:05.000Z"
}
```

## 8.5 delivery.in_transit

```json
{
  "eventId": "evt_01JY0000000000000000000005",
  "eventType": "delivery.in_transit",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "status": "in_transit",
    "deliveryStatus": "en_route_to_dropoff",
    "lastKnownLocation": {
      "lat": -1.9412,
      "lng": 30.1111,
      "recordedAt": "2026-06-18T13:36:00.000Z"
    },
    "estimatedDropoffAt": "2026-06-18T13:48:00.000Z"
  },
  "sentAt": "2026-06-18T13:36:05.000Z"
}
```

## 8.6 delivery.delivered

```json
{
  "eventId": "evt_01JY0000000000000000000006",
  "eventType": "delivery.delivered",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "status": "delivered",
    "deliveryStatus": "delivered",
    "deliveredAt": "2026-06-18T13:49:00.000Z",
    "proof": {
      "dropoffPinVerified": true,
      "deliveryPhotoUrl": "https://cdn.rdf.rw/dropoffs/photo.jpg"
    },
    "financials": {
      "deliveryFee": 1200,
      "riderPayout": 840,
      "companyMargin": 360
    }
  },
  "sentAt": "2026-06-18T13:49:05.000Z"
}
```

## 8.7 delivery.failed

```json
{
  "eventId": "evt_01JY0000000000000000000007",
  "eventType": "delivery.failed",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "status": "cancelled",
    "deliveryStatus": "failed",
    "reason": "CUSTOMER_UNREACHABLE",
    "failedAt": "2026-06-18T13:55:00.000Z",
    "nextAction": "partner_contact_customer_or_request_redelivery"
  },
  "sentAt": "2026-06-18T13:55:05.000Z"
}
```

## 8.8 request.cancelled

```json
{
  "eventId": "evt_01JY0000000000000000000008",
  "eventType": "request.cancelled",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "status": "cancelled",
    "deliveryStatus": "failed",
    "cancelledBy": "partner",
    "reason": "CUSTOMER_CANCELLED",
    "cancellationFeeRwf": 0,
    "cancelledAt": "2026-06-18T13:20:00.000Z"
  },
  "sentAt": "2026-06-18T13:20:05.000Z"
}
```

## 8.9 settlement.ready

Sent when the delivery is completed and RDF has prepared the payout/settlement state.

```json
{
  "eventId": "evt_01JY0000000000000000000009",
  "eventType": "settlement.ready",
  "partnerId": "ptr_01JY0000000000000000000000",
  "partnerOrderReference": "ORD-20260618-0001",
  "requestId": "req_01JYREQ00000000000000000",
  "data": {
    "settlementStatus": "release_pending",
    "currency": "RWF",
    "sellerPayout": 15000,
    "riderPayout": 840,
    "platformCommission": 360,
    "releaseAvailableAt": "2026-06-18T14:49:00.000Z"
  },
  "sentAt": "2026-06-18T13:50:00.000Z"
}
```

---

## 9. Status mapping for partners

Partner systems should store RDF statuses exactly as received, then map them to customer-friendly words in their own UI.

### Order status values

```txt
scheduled
awaiting_quote
quote_sent
placed
confirmed
preparing
ready_for_pickup
cancelled
picked_up
in_transit
awaiting_confirmation
delivered
disputed
resolved
```

### Payment status values

```txt
pending
paid
failed
refunded
```

### Delivery status values

```txt
assigned
en_route_to_pickup
pending_handover
picked_up
en_route_to_dropoff
delivered
failed
```

---

## 10. Idempotency rules

Every partner mutation must include `X-Idempotency-Key`.

Examples of mutation endpoints:

```txt
POST /api/v1/partner-api/quotes
POST /api/v1/partner-api/requests
POST /api/v1/partner-api/requests/direct
POST /api/v1/partner-api/requests/:requestId/cancel
POST /api/v1/partner-api/requests/:requestId/disputes
POST /api/v1/partner-webhooks/payment-confirmed
POST /api/v1/partner-webhooks/payment-failed
POST /api/v1/partner-webhooks/order-cancelled
```

If the same idempotency key is reused with the same payload, RDF returns the original result.

If the same idempotency key is reused with a different payload, RDF returns:

```json
{
  "success": false,
  "error": {
    "code": "IDEMPOTENCY_CONFLICT",
    "message": "This idempotency key was already used with a different request body."
  }
}
```

---

## 11. Partner data model to add

Recommended new schemas:

### Partner

```ts
type Partner = {
  partnerId: string;
  businessName: string;
  businessType: 'marketplace' | 'restaurant' | 'pharmacy' | 'shop' | 'enterprise' | 'other';
  status: 'pending_review' | 'active' | 'suspended' | 'disabled';
  contractVersionAccepted?: string;
  webhookUrl?: string;
  webhookVerifiedAt?: Date;
  allowedOrigins?: string[];
  allowedIps?: string[];
  scopes: string[];
  settlementMethod?: 'momo' | 'bank' | 'wallet';
  createdAt: Date;
  updatedAt: Date;
};
```

### PartnerApiKey

```ts
type PartnerApiKey = {
  keyId: string;
  partnerId: string;
  hashedSecret: string;
  environment: 'sandbox' | 'production';
  scopes: string[];
  lastUsedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
};
```

### PartnerQuote

```ts
type PartnerQuote = {
  quoteId: string;
  partnerId: string;
  partnerOrderReference: string;
  pickup: object;
  dropoff: object;
  package: object;
  finalDeliveryFee: number;
  riderPayout: number;
  companyMargin: number;
  pricingBreakdown: object;
  dispatchRules: object;
  lockedUntil: Date;
  status: 'active' | 'expired' | 'converted' | 'cancelled';
  createdAt: Date;
};
```

### PartnerDeliveryRequest

```ts
type PartnerDeliveryRequest = {
  requestId: string;
  partnerId: string;
  partnerOrderReference: string;
  quoteId?: string;
  transactionId?: string;
  deliveryId?: string;
  status: string;
  deliveryStatus: string;
  paymentStatus: string;
  metadata?: object;
  createdAt: Date;
  updatedAt: Date;
};
```

### WebhookDeliveryAttempt

```ts
type WebhookDeliveryAttempt = {
  eventId: string;
  partnerId: string;
  eventType: string;
  payload: object;
  status: 'pending' | 'delivered' | 'failed' | 'dead_lettered';
  attempts: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  lastStatusCode?: number;
  lastError?: string;
  createdAt: Date;
};
```

---

## 12. Implementation modules to add

Recommended backend modules:

```txt
apps/market-service/src/partner-api/
  partner-api.module.ts
  partner-api.controller.ts
  partner-api.service.ts
  dto/
    create-quote.dto.ts
    create-request.dto.ts
    cancel-request.dto.ts
    dispute-request.dto.ts
  guards/
    partner-auth.guard.ts
    partner-signature.guard.ts
  services/
    partner-pricing.service.ts
    partner-dispatch.service.ts
    partner-idempotency.service.ts
    partner-webhook-dispatcher.service.ts

apps/market-service/src/partner-webhooks/
  partner-webhooks.module.ts
  partner-webhooks.controller.ts
  partner-webhooks.service.ts
```

Recommended shared types:

```txt
packages/shared-types/src/partner-api.ts
packages/shared-types/src/partner-webhooks.ts
packages/shared-types/src/partner-status.ts
```

Recommended database schemas:

```txt
packages/database/src/schemas/partner.schema.ts
packages/database/src/schemas/partner-api-key.schema.ts
packages/database/src/schemas/partner-quote.schema.ts
packages/database/src/schemas/partner-delivery-request.schema.ts
packages/database/src/schemas/webhook-delivery-attempt.schema.ts
packages/database/src/schemas/idempotency-key.schema.ts
```

---

## 13. Minimum launch checklist

Before RDF partner API can be considered production-ready, complete these items:

1. Add Partner and API key schemas.
2. Add partner authentication guard.
3. Add HMAC request signing.
4. Add idempotency key storage.
5. Add quote creation endpoint.
6. Add delivery request creation endpoint.
7. Add request status endpoint.
8. Add cancel endpoint.
9. Add partner inbound webhook endpoints.
10. Add outbound webhook dispatcher with retries.
11. Add admin screen for partner status, keys, webhooks, and failed events.
12. Add sandbox partner seed.
13. Add integration tests for signature, quote, request, cancellation, webhook delivery, and idempotency conflict.
14. Add rate limiting per partner.
15. Add audit logs for all partner actions.

---

## 14. Simple end-to-end flow

```txt
Partner creates customer order
        ↓
Partner asks RDF for quote
        ↓
RDF calculates delivery fee, rider payout, company margin, route rules
        ↓
Partner shows/accepts quote
        ↓
Partner creates RDF delivery request
        ↓
RDF broadcasts to eligible verified riders
        ↓
Rider accepts
        ↓
RDF sends rider.assigned webhook
        ↓
Rider reaches pickup
        ↓
RDF sends rider.arrived_at_pickup webhook
        ↓
Seller/rider confirms pickup
        ↓
RDF sends pickup.confirmed webhook
        ↓
Rider delivers to customer
        ↓
RDF sends delivery.delivered webhook
        ↓
RDF prepares settlement/payout
        ↓
RDF sends settlement.ready webhook
        ↓
Partner closes order in its own system
```

---

## 15. Important product rule

The partner should not directly choose riders. RDF must own rider filtering and assignment because rider eligibility depends on:

- verification status
- current location
- route direction
- availability
- distance to pickup
- required equipment
- rain protection
- night eligibility
- rejection/fraud history
- active penalties
- service area

Partners only request the delivery. RDF decides which rider can safely and fairly receive it.
