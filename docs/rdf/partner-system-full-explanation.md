# RDF Partner System Full Explanation

This file explains the RDF partner system in a full, simple, and developer-ready way.

The other file, `partner-system-integration.md`, is more like a technical API contract. This file explains the idea behind it: why it exists, how partners behave, how the system pairs with them, what RDF controls, what the partner controls, and how requests/webhooks move between both systems.

---

## 1. What RDF is in this context

RDF is the delivery/logistics side of the RMF ecosystem.

RMF can be the marketplace where buyers order products from sellers. RDF is the delivery engine that can also serve other businesses outside RMF.

That means RDF should not only deliver RMF orders. It should be able to receive delivery requests from external partners such as:

- online shops
- supermarkets
- restaurants
- pharmacies
- market seller platforms
- ecommerce websites
- business branches
- other apps that need riders

The partner already has customers and orders. RDF gives them verified delivery execution.

In simple words:

```txt
Partner owns the order.
RDF owns the delivery.
```

---

## 2. Why the partner system is needed

Without a partner system, RDF can only work inside its own app.

With a partner system, RDF becomes a logistics platform. Other businesses can connect their systems to RDF and request deliveries automatically.

For example, imagine a pharmacy app receives an order. Instead of calling a rider manually, the pharmacy app sends a delivery request to RDF through an API. RDF calculates the delivery price, finds an eligible rider, tracks the trip, and sends updates back to the pharmacy app.

This makes RDF useful as a business-to-business logistics service, not only as a marketplace feature.

---

## 3. The main idea

A partner sends RDF a delivery job.

RDF answers with price, route, rider assignment, tracking, and status updates.

The partner uses those answers to update its own app.

The flow looks like this:

```txt
Customer orders from partner
        ↓
Partner asks RDF for delivery quote
        ↓
RDF calculates price and rules
        ↓
Partner accepts quote
        ↓
Partner creates delivery request
        ↓
RDF finds a rider
        ↓
Rider picks up package
        ↓
Rider delivers package
        ↓
RDF sends updates to partner
        ↓
Partner updates customer order
```

---

## 4. What a partner is

A partner is a business or platform allowed to use RDF through APIs.

A partner can be:

1. **Internal partner**
   - Example: RMF Market itself.
   - It uses RDF to deliver marketplace orders.

2. **External partner**
   - Example: a restaurant, pharmacy, supermarket, or ecommerce store.
   - Their own system sends delivery requests to RDF.

3. **Enterprise partner**
   - Example: a company with many branches.
   - It may have special pricing, monthly settlement, branch accounts, and stronger reporting.

---

## 5. What the partner controls

The partner controls its own business logic.

The partner decides:

- which products/services it sells
- customer account handling
- customer payment flow, unless RDF is responsible for payment
- order confirmation
- product preparation
- whether to show RDF quote to the customer
- customer support for the original order
- refund policy for product problems
- its own internal order status

Example:

A restaurant receives a food order. The restaurant still controls food preparation. RDF only controls the delivery from the restaurant to the customer.

---

## 6. What RDF controls

RDF controls the delivery side.

RDF decides:

- delivery price
- rider payout
- company margin
- route distance
- slope difficulty
- time-window pricing
- rain surcharge and rain rider eligibility
- night rider restrictions
- rider filtering
- rider broadcast radius
- rider assignment
- pickup confirmation
- dropoff confirmation
- tracking
- delivery failure handling
- delivery-related dispute evidence
- delivery settlement state

Most importantly, the partner should not choose the rider directly.

The partner asks for delivery. RDF decides which rider is safe, close, verified, available, and eligible.

---

## 7. Why partners should not directly choose riders

This is very important.

If partners choose riders directly, the system can become unsafe and unfair.

RDF must control rider assignment because RDF knows:

- which riders are verified
- which riders are active
- where riders are located
- which riders are close enough
- which riders rejected too many jobs
- which riders are penalized
- which riders can work at night
- which riders have rain protection
- which riders are allowed for special deliveries
- which route direction makes sense
- which riders are already busy

So the partner gives RDF the job. RDF chooses the correct rider.

---

## 8. Partner pairing explained

Partner pairing means connecting a partner business to RDF so both systems can trust each other.

It is like registering the partner into RDF and giving it secure credentials.

The pairing process has these stages:

```txt
Partner applies
        ↓
RDF reviews partner
        ↓
Partner accepts contract
        ↓
RDF creates API credentials
        ↓
Partner registers webhook URL
        ↓
RDF verifies webhook
        ↓
Partner can send real delivery requests
```

---

## 9. Step 1: Partner application

The partner gives RDF basic business information.

Example:

```json
{
  "businessName": "Kimironko Fresh Foods",
  "businessType": "marketplace",
  "contactName": "Operations Manager",
  "contactPhone": "+250788000000",
  "contactEmail": "ops@example.rw",
  "websiteUrl": "https://partner.example.rw",
  "supportPhone": "+250788111111",
  "expectedDailyRequests": 120
}
```

RDF checks if the business is real, safe, and allowed to use the delivery network.

---

## 10. Step 2: Contract acceptance

Before production access, the partner must accept RDF's active partner contract.

The contract explains:

- what RDF does
- what the partner must do
- payment responsibilities
- dispute responsibilities
- data privacy
- delivery rules
- cancellation rules
- payout rules
- suspension rules

The repo already has contract endpoints in the market service, so the partner system should reuse contract version tracking instead of ignoring it.

The partner should not get live API access until it accepts the latest active contract.

---

## 11. Step 3: API credentials

After approval, RDF gives the partner credentials.

The partner receives:

```json
{
  "partnerId": "ptr_01JY0000000000000000000000",
  "apiKeyId": "key_live_01JY0000000000000000000000",
  "apiSecret": "shown_once_only",
  "webhookSigningSecret": "shown_once_only",
  "environment": "production"
}
```

The `apiSecret` and `webhookSigningSecret` must be shown only once.

RDF should never store the raw secret. It should store a hashed version.

---

## 12. Step 4: Webhook URL setup

The partner gives RDF a webhook URL.

A webhook URL is an endpoint on the partner system where RDF sends updates.

Example:

```txt
https://partner.example.rw/webhooks/rdf
```

RDF sends events to that URL, such as:

- rider assigned
- rider arrived at pickup
- pickup confirmed
- delivery in transit
- delivery delivered
- delivery failed
- settlement ready

The partner uses those events to update its own system.

---

## 13. Step 5: Webhook verification

RDF should not trust a webhook URL until it verifies it.

RDF sends a challenge to the partner webhook URL.

Example:

```json
{
  "eventType": "webhook.verification",
  "data": {
    "challenge": "verify_5c29b4e4df"
  }
}
```

The partner must return the same challenge.

Example response:

```json
{
  "success": true,
  "challenge": "verify_5c29b4e4df"
}
```

After this, RDF marks the webhook as verified.

---

## 14. API security explained simply

Every partner request must prove that it really came from that partner.

This is done using:

1. Partner ID
2. API key ID
3. Bearer token or API token
4. Timestamp
5. HMAC signature
6. Idempotency key

Example headers:

```txt
Authorization: Bearer <partner-api-token>
X-RDF-Partner-Id: ptr_...
X-RDF-Key-Id: key_live_...
X-RDF-Timestamp: 2026-06-18T13:10:00.000Z
X-RDF-Signature: sha256=<hmac_signature>
X-Idempotency-Key: unique-request-key
Content-Type: application/json
```

This prevents fake systems from creating fake deliveries.

---

## 15. What HMAC signature means

HMAC signature is a security proof.

The partner uses its secret key to sign the request body. RDF uses the stored secret to verify that signature.

If the body changes, the signature becomes invalid.

That means attackers cannot secretly change:

- pickup location
- dropoff location
- delivery fee
- order reference
- customer phone
- payment status

If the signature is wrong, RDF rejects the request.

---

## 16. What idempotency means

Idempotency prevents duplicate deliveries.

Sometimes a partner sends the same request twice because of a network problem.

Without idempotency, RDF might create two delivery requests for one order.

So every important partner request must include:

```txt
X-Idempotency-Key: unique-request-key
```

If the same key and same body are sent again, RDF returns the first response instead of creating a duplicate.

If the same key is used with a different body, RDF rejects it.

---

## 17. Main API requests partners send to RDF

The partner mainly sends these requests:

```txt
POST /api/v1/partner-api/quotes
POST /api/v1/partner-api/requests
POST /api/v1/partner-api/requests/direct
GET  /api/v1/partner-api/requests/:requestId
POST /api/v1/partner-api/requests/:requestId/cancel
POST /api/v1/partner-api/requests/:requestId/disputes
```

Each endpoint has a specific purpose.

---

## 18. Quote request explained

Before a delivery starts, the partner should ask RDF for a quote.

The quote tells the partner:

- final delivery fee
- rider payout
- RDF/company margin
- distance
- estimated time
- slope difficulty
- rain rule
- night rule
- rider requirements
- quote expiry time

Example:

```txt
Partner: How much to deliver this package from A to B?
RDF: It costs 1,200 RWF. This price is locked for 15 minutes.
```

The partner can then show the fee to the customer or accept it automatically.

---

## 19. Why quote locking is needed

Delivery prices can change because of:

- rain
- night time
- rider availability
- route distance
- route difficulty
- service level
- temporary restrictions

So RDF should lock a quote for a short period, for example 15 minutes.

During that time, the partner can create a delivery request using that quote.

If the quote expires, the partner must request a new one.

---

## 20. Delivery request explained

After the quote is accepted, the partner creates a delivery request.

That means:

```txt
Partner: I accept the quote. Start delivery.
RDF: Delivery request created. I will find a rider.
```

RDF then begins rider matching.

The request stores:

- partner ID
- partner order reference
- quote ID
- pickup details
- dropoff details
- package details
- customer phone
- delivery verification rules
- tracking URL
- status

---

## 21. Direct delivery request explained

Some trusted partners may not want to create a quote first.

They may want one request that creates the quote and delivery together.

That is the purpose of:

```txt
POST /api/v1/partner-api/requests/direct
```

This should only be allowed for trusted partners because the customer may not see the delivery fee before dispatch.

---

## 22. Delivery status check explained

The partner can check the status of a delivery.

Example:

```txt
GET /api/v1/partner-api/requests/req_123
```

RDF responds with:

- current order status
- current delivery status
- payment status
- rider details if assigned
- last known location
- pickup confirmation state
- dropoff estimate

This is useful if the partner missed a webhook or wants to refresh its dashboard.

---

## 23. Cancellation explained

The partner can cancel a delivery request if allowed.

Cancellation rules depend on the stage.

Example:

- Before rider accepts: usually free cancellation.
- After rider accepts: possible small fee.
- After pickup: cancellation may become delivery failure or return flow.
- After delivery: cannot cancel, must open dispute/refund flow.

RDF should return the cancellation result and any fee.

---

## 24. Dispute explained

A dispute is used when something went wrong.

Examples:

- item damaged
- item missing
- customer says package was not delivered
- rider says customer was unreachable
- seller gave wrong package
- delivery took too long

The partner can open a dispute with evidence.

RDF then investigates only the delivery part.

If the problem is from the product itself, the partner handles it.

If the problem is from the delivery, RDF handles it.

---

## 25. Webhooks explained simply

A webhook is an automatic message from one system to another.

Instead of the partner asking RDF every second, RDF sends important updates to the partner when they happen.

Example:

```txt
Rider accepted delivery.
RDF sends rider.assigned webhook to partner.
Partner updates its order screen.
```

Webhooks make the system faster and cleaner.

---

## 26. Webhooks RDF accepts from partners

RDF should accept these partner webhooks:

```txt
POST /api/v1/partner-webhooks/payment-confirmed
POST /api/v1/partner-webhooks/payment-failed
POST /api/v1/partner-webhooks/order-cancelled
POST /api/v1/partner-webhooks/pickup-unavailable
```

These are messages from the partner to RDF.

---

## 27. Partner payment confirmed webhook

This is used when the partner collected payment and wants RDF to continue.

Example:

```txt
Partner: Customer paid. Delivery may continue.
RDF: Payment confirmed. I can dispatch/continue delivery.
```

This is useful when the partner owns the payment flow.

---

## 28. Partner payment failed webhook

This is used when payment fails.

Example:

```txt
Partner: Customer payment failed.
RDF: I will not create or continue delivery.
```

RDF should mark the delivery/payment state as failed or keep the request inactive.

---

## 29. Partner order cancelled webhook

This is used when the customer cancels from the partner app.

Example:

```txt
Partner: Customer cancelled the order.
RDF: I will cancel the delivery if possible.
```

RDF should check the current delivery stage before cancelling.

---

## 30. Partner pickup unavailable webhook

This is used when the pickup location is not ready.

Example:

```txt
Partner: Seller is not ready yet.
RDF: I will pause, delay, or rebroadcast later.
```

This prevents riders from wasting time at a pickup point where the package is not ready.

---

## 31. Webhooks RDF sends to partners

RDF should send these events:

```txt
delivery.requested
rider.assigned
rider.arrived_at_pickup
pickup.confirmed
delivery.in_transit
delivery.delivered
delivery.failed
request.cancelled
settlement.ready
quote.expired
```

These events keep the partner system updated.

---

## 32. delivery.requested explained

RDF sends this when it accepts the partner delivery request.

Meaning:

```txt
RDF has created the delivery workflow.
```

The partner should update its order to something like:

```txt
Delivery requested
```

---

## 33. rider.assigned explained

RDF sends this when a rider accepts the job.

The payload includes rider details such as:

- rider name
- phone number
- plate number
- vehicle type
- estimated pickup time
- estimated dropoff time

The partner can show this to the customer.

---

## 34. rider.arrived_at_pickup explained

RDF sends this when the rider reaches the pickup point.

The partner can show:

```txt
Rider has arrived at pickup.
```

If the seller is not ready, the partner should act quickly.

---

## 35. pickup.confirmed explained

RDF sends this when pickup is confirmed.

Pickup can be confirmed by:

- seller confirmation
- rider confirmation
- photo proof
- QR scan
- PIN or handover code

After this, the delivery is truly in progress.

---

## 36. delivery.in_transit explained

RDF sends this when the rider is going toward the customer.

The partner can show:

```txt
Your order is on the way.
```

The event can include last known rider location and estimated arrival time.

---

## 37. delivery.delivered explained

RDF sends this when the package reaches the customer.

The event can include:

- delivery time
- proof photo
- customer PIN verification
- final delivery fee
- rider payout
- company margin

The partner should close the order or mark it delivered.

---

## 38. delivery.failed explained

RDF sends this if the delivery cannot be completed.

Reasons may include:

- customer unreachable
- wrong address
- rider issue
- package unavailable
- unsafe route
- weather restriction
- pickup failed

The partner should decide whether to contact the customer, retry, refund, or request redelivery.

---

## 39. settlement.ready explained

RDF sends this when money/payout information is ready.

This matters when RDF is involved in escrow or settlement.

It may include:

- seller payout
- rider payout
- platform commission
- release time
- settlement status

---

## 40. Partner response to RDF webhook

When RDF sends a webhook, the partner should respond quickly.

Recommended response:

```json
{
  "success": true,
  "received": true
}
```

If the partner does not respond with HTTP 2xx, RDF should retry later.

---

## 41. Webhook retry rules

Webhook delivery can fail because:

- partner server is down
- network problem
- timeout
- signature validation problem
- partner app bug

RDF should retry failed webhooks.

Recommended retry schedule:

```txt
1 minute
5 minutes
15 minutes
1 hour
6 hours
24 hours
```

If all retries fail, RDF should mark the event as dead-lettered and show it to admins.

---

## 42. Pricing explained

RDF delivery pricing should consider:

- base fee
- distance
- slope/elevation difficulty
- time window
- rain
- night restrictions
- service level
- package type
- waiting risk
- urgent delivery premium

Example breakdown:

```json
{
  "baseFee": 500,
  "distanceFee": 350,
  "slopeFee": 150,
  "timeWindowFee": 100,
  "rainFee": 0,
  "serviceLevelFee": 100,
  "finalDeliveryFee": 1200
}
```

The partner should receive the final price and breakdown.

---

## 43. Rider payout explained

RDF should calculate how much goes to the rider and how much remains for the company/platform.

Example:

```json
{
  "finalDeliveryFee": 1200,
  "riderPayout": 840,
  "companyMargin": 360
}
```

The exact split can change based on RDF policy, but the API should expose the final locked numbers.

---

## 44. Rain rule explained

If rain is detected on the route, RDF should only allow riders with rain protection.

Rain protection can include:

- raincoat
- protected delivery bag
- bike/moto umbrella if allowed
- waterproof package handling

Rain deliveries may receive higher payout because the rider is taking more difficulty and risk.

If no protected rider is available, RDF can return:

```txt
RAIN_PROTECTION_REQUIRED
```

or delay the request.

---

## 45. Night rule explained

Night delivery should not be treated the same as daytime delivery.

RDF can use rules like:

- evening: small increase
- night: bigger increase
- deep night: restricted or disabled
- only verified night riders may receive night jobs

This protects riders, customers, and the platform.

---

## 46. Slope rule explained

Kigali and Rwanda have many hills.

A route that is short but steep can be harder than a longer flat route.

So RDF should not price only by distance.

RDF should consider:

- elevation gain
- steep segments
- slope difficulty score
- uphill distance
- route difficulty

This makes rider payment fairer.

---

## 47. Dispatch explained

Dispatch is how RDF finds a rider.

Recommended strategy:

```txt
PROGRESSIVE_RADIUS
```

That means RDF starts with nearby riders, then expands the search radius if no rider accepts.

Example:

```txt
Start radius: 700m
Next radius: 1200m
Next radius: 1700m
Max radius: 4000m
```

This avoids showing every job to every rider in the city.

---

## 48. Rider filtering explained

Before broadcasting, RDF filters riders.

A rider can receive the job only if they pass checks like:

- active status
- verification status
- distance to pickup
- not already busy
- allowed service type
- equipment requirements
- rain protection if needed
- night approval if needed
- not suspended
- not blocked by penalties
- acceptable rejection history

This keeps the system efficient.

---

## 49. Tracking explained

RDF stores rider tracking points during delivery.

A tracking point can include:

```json
{
  "lat": -1.9412,
  "lng": 30.1111,
  "recordedAt": "2026-06-18T13:36:00.000Z"
}
```

The partner can receive tracking updates through webhooks or request status endpoint.

---

## 50. Pickup proof explained

Pickup proof protects the seller, rider, customer, and RDF.

Pickup proof can include:

- seller confirmation
- rider confirmation
- pickup photo
- QR scan
- pickup code
- timestamp
- location check

This helps prevent false pickup claims.

---

## 51. Dropoff proof explained

Dropoff proof confirms the customer received the package.

Dropoff proof can include:

- customer PIN
- delivery photo
- customer confirmation
- location check
- timestamp

For higher-value orders, PIN should be required.

---

## 52. Cancellation stages

Cancellation must depend on delivery stage.

Suggested rules:

| Stage | Cancellation handling |
|---|---|
| Before rider assignment | Cancel freely. |
| Rider assigned but not arrived | Cancel with possible small fee. |
| Rider arrived at pickup | Cancel with rider compensation. |
| Picked up | Convert to failed/return/redelivery flow. |
| Delivered | Cannot cancel; open dispute. |

---

## 53. Dispute responsibility split

Not every problem is RDF's fault.

### Partner handles

- wrong product selected
- bad product quality
- seller packed wrong item
- missing item before pickup
- customer refund for product issue

### RDF handles

- rider picked up and damaged item
- rider failed delivery without valid reason
- rider delivered to wrong person
- route/tracking issue
- delivery proof issue
- rider misconduct

Some issues may require both RDF and partner support.

---

## 54. Settlement explained

Settlement is the money side after delivery.

Depending on the agreement, money can flow in different ways.

### Model 1: Partner collects all money

The partner collects product price and delivery fee from customer.

Then the partner later pays RDF, or RDF invoices the partner.

### Model 2: RDF collects delivery fee only

Partner collects product price. RDF collects delivery fee.

### Model 3: RDF escrow

RDF collects total amount, holds money, then releases payouts to seller/rider/platform.

The partner setup should define which model is used.

---

## 55. Data RDF should store for partner requests

For each request, RDF should store:

- request ID
- partner ID
- partner order reference
- quote ID
- pickup details
- dropoff details
- package details
- customer phone
- price breakdown
- rider assignment
- delivery status
- payment status
- settlement status
- webhook delivery history
- idempotency key
- audit logs

This makes debugging and support easier.

---

## 56. Admin dashboard needs

Admins should be able to see:

- all partners
- partner status
- accepted contract version
- API keys
- webhook URL
- webhook verification status
- failed webhooks
- delivery requests by partner
- quote/request conversion rate
- rider assignment success rate
- cancellation rate
- dispute rate
- settlement status
- partner suspension controls

This is important because partner integrations can fail silently if there is no admin visibility.

---

## 57. Sandbox environment

Partners should test in sandbox before production.

Sandbox should allow:

- fake API keys
- fake riders
- fake payment success/failure
- fake webhook testing
- fake delivery status progression
- test quote generation
- test cancellation
- test disputes

Sandbox helps partners integrate without affecting real riders or customers.

---

## 58. Production environment

Production should require:

- approved partner
- accepted contract
- verified webhook
- active API key
- rate limits
- signing enabled
- audit logs
- admin monitoring
- real rider dispatch
- real pricing
- real settlement logic

No partner should be allowed to send production requests before these conditions are met.

---

## 59. Rate limiting

RDF should limit how many requests a partner can send.

Example limits:

```txt
Quotes: 120 per minute
Requests: 60 per minute
Status checks: 300 per minute
Webhook callbacks: 120 per minute
```

Limits should depend on partner tier.

This protects RDF from accidental overload or abusive partners.

---

## 60. Audit logs

Every important partner action should create an audit log.

Examples:

- API key created
- API key revoked
- contract accepted
- webhook URL changed
- quote created
- request created
- request cancelled
- payment confirmed
- dispute opened
- partner suspended

Audit logs help answer the question:

```txt
Who did what, when, and why?
```

---

## 61. Minimum implementation plan

To build this system, implement in phases.

### Phase 1: Partner foundation

- Partner schema
- Partner API key schema
- Contract acceptance endpoint
- Partner admin approval
- API key generation

### Phase 2: Security

- Partner auth guard
- HMAC signature guard
- Timestamp validation
- Idempotency storage
- Rate limiting

### Phase 3: Quote API

- Create quote endpoint
- Pricing breakdown
- Route calculation
- Slope/time/rain rules
- Quote lock/expiry

### Phase 4: Request API

- Create delivery request
- Direct request endpoint
- Get request status
- Cancel request
- Dispute endpoint

### Phase 5: Dispatch integration

- Rider filtering
- Progressive radius broadcast
- Rider accept flow
- Rider assignment webhook

### Phase 6: Webhooks

- Partner inbound webhooks
- RDF outbound webhooks
- Webhook signing
- Webhook retries
- Dead-letter queue

### Phase 7: Admin and monitoring

- Partner dashboard
- Failed webhook viewer
- Request viewer
- Settlement viewer
- Logs and metrics

### Phase 8: Sandbox and testing

- Sandbox partner
- Fake riders
- Fake payments
- Integration tests
- API documentation

---

## 62. Example complete journey

A restaurant partner receives an order.

1. Customer orders food from the restaurant app.
2. Restaurant confirms the food can be prepared.
3. Restaurant app sends quote request to RDF.
4. RDF calculates 1,200 RWF delivery fee.
5. Restaurant app accepts quote.
6. Restaurant app sends delivery request to RDF.
7. RDF filters nearby verified riders.
8. RDF broadcasts to eligible riders.
9. Rider accepts.
10. RDF sends `rider.assigned` webhook to restaurant.
11. Rider arrives at restaurant.
12. RDF sends `rider.arrived_at_pickup` webhook.
13. Restaurant gives food to rider.
14. Rider confirms pickup with photo/code.
15. RDF sends `pickup.confirmed` webhook.
16. Rider travels to customer.
17. RDF sends `delivery.in_transit` webhook.
18. Customer receives order and gives PIN.
19. RDF sends `delivery.delivered` webhook.
20. RDF prepares settlement.
21. RDF sends `settlement.ready` webhook.
22. Restaurant closes the order as delivered.

---

## 63. Best simple explanation

The partner system turns RDF into a delivery engine that other platforms can use.

The partner says:

```txt
I have an order. Please deliver it.
```

RDF says:

```txt
Here is the price, I found a rider, here is tracking, pickup is confirmed, delivery is done.
```

The partner keeps control of its customer and order.

RDF keeps control of delivery, riders, route, proof, and delivery safety.

That separation is what makes the system scalable.

---

## 64. Golden rule

The most important rule is:

```txt
Partners request delivery. RDF controls delivery execution.
```

This means partners should not manually choose riders, bypass pricing rules, skip verification, or ignore RDF delivery states.

RDF must remain the source of truth for logistics.

---

## 65. Final summary

The RDF partner system has four big parts:

1. **Pairing**
   - Register partner, accept contract, issue API keys, verify webhook.

2. **Partner APIs**
   - Quote, create request, get status, cancel, open dispute.

3. **Partner webhooks into RDF**
   - Payment confirmed, payment failed, order cancelled, pickup unavailable.

4. **RDF webhooks to partner**
   - Delivery requested, rider assigned, pickup confirmed, in transit, delivered, failed, settlement ready.

When built well, this lets RDF serve RMF and many outside businesses with one reliable logistics engine.
