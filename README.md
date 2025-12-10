# n8n-nodes-anny

This is an n8n community node for the [anny](https://anny.co) booking platform. It lets you manage bookings, customers, orders, invoices, resources, and services, plus react to anny webhooks inside n8n.

anny offers scheduling, payments, and resource management for online booking flows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Bookings: get, list (with filters), cancel, check-in, check-out
- Customers: create, get, list (with filters), update, delete
- Orders, invoices, plan subscriptions, services, resources: get and list with filters and includes
- Availability: get upcoming intervals for a resource/service combination
- API Call: run arbitrary requests against `/api/*` with custom method, params, headers, and body
- Triggers: webhooks for bookings (created/started/ended/updated/checked-in/checked-out/cancelled/deleted), customers (created/updated/deleted), orders (created/updated/deleted), invoices (created/updated/deleted)

## Credentials

- Uses OAuth2 with preconfigured scopes; only pick your region (anny.co, anny.eu, staging, or local) and complete the OAuth flow.
- The credential tests by fetching your user profile from the selected region.

## Compatibility

- Built with nodes API v1 via `@n8n/node-cli` 0.13.0 (`n8n-workflow` 1.113.0).
- Tested locally with n8n 1.x; use a current n8n release for best results.

## Usage

- Add the **anny OAuth2 API** credential first; choose the right region and finish the OAuth consent.
- Use **anny Booking** to create or manage bookings; include related data via the `include` field when needed.
- Use the trigger nodes to subscribe to anny webhooks automatically; they create and clean up webhook subscriptions for the selected events.
- For unsupported endpoints, use **anny API Call** to hit any `/api/v1/*` path with custom parameters.

## Resources

- [anny API documentation](https://docs.anny.co)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## Version history

- 0.1.0: Initial release of the anny node pack (bookings, customers, orders, invoices, plan subscriptions, resources, services, triggers, and generic API call).
