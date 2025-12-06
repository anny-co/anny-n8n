# Anny n8n Node Development Guide

## Quick Overview

This is a **community node** for n8n that connects to the Anny booking platform API. n8n nodes are plugins that add integrations to n8n workflows.

## Project Structure

```
├── credentials/
│   └── AnnyOAuth2Api.credentials.ts   # OAuth2 authentication config
├── nodes/Anny/
│   ├── Anny.node.ts                   # Main node logic
│   ├── Anny.node.json                 # Node metadata (categories)
│   ├── resources/                     # Operations grouped by resource
│   │   ├── booking/index.ts           # Booking CRUD operations
│   │   └── customer/index.ts          # Customer CRUD operations
│   ├── shared/
│   │   ├── transport.ts               # API request helper
│   │   ├── utils.ts                   # JSON:API payload helpers
│   │   └── descriptions.ts            # Reusable UI components
│   └── listSearch/                    # Dropdown data fetchers
│       ├── getBookings.ts
│       ├── getCustomers.ts
│       ├── getServices.ts
│       └── getResources.ts
├── icons/
│   └── anny.svg                       # Node icon (replace with real logo)
└── package.json                       # Node registration
```

## Key Concepts

| Concept | What it does |
|---------|--------------|
| **Credentials** | Stores auth config (OAuth2 tokens, region) |
| **Node** | The integration itself - appears in n8n's node panel |
| **Resource** | Entity type (Booking, Customer, etc.) |
| **Operation** | Action on a resource (Create, Get, Update, etc.) |
| **Properties** | UI fields users fill in (dropdowns, text inputs) |
| **listSearch** | Methods that populate dropdowns dynamically |

## Current Features

### Resources & Operations

| Resource | Operations |
|----------|------------|
| **Booking** | Create, Get, Get Many, Update, Cancel, Check In, Check Out |
| **Customer** | Create, Get, Get Many, Update, Delete |
| **Make an API Call** | Raw API access (GET, POST, PATCH, DELETE) |

### Regions Supported
- `anny.co` (International)
- `anny.eu` (Europe)  
- `staging` (Sandbox)

---

## Testing Locally

### 1. Build the node
```bash
npm run build
```

### 2. Run n8n with this node
```bash
npm run dev
```
This starts n8n with your node loaded. Open http://localhost:5678

### 3. Set up credentials
1. Go to **Credentials** → **Add Credential** → **Anny OAuth2 API**
2. Select your region
3. Enter OAuth Client ID and Client Secret (from environment or custom)
4. Click **Connect** to authenticate

### 4. Create a test workflow
1. Add an **Anny** node to the canvas
2. Select a resource (e.g., Customer)
3. Select an operation (e.g., Get Many)
4. Execute the node

---

## Next Steps

### Immediate
- [ ] Replace `icons/anny.svg` with the official Anny logo
- [ ] Add OAuth Client IDs/Secrets to n8n environment variables
- [ ] Test all operations against staging environment

### Phase 2 - Add More Resources
- [ ] **Service** resource (Get, Get Many)
- [ ] **Resource** resource (Get, Get Many) - staff/rooms
- [ ] **Order** resource (Create, Get, Get Many)

### Phase 3 - Webhooks (Trigger Node)
Create `AnnyTrigger.node.ts` for real-time events:
- `bookings.created`, `bookings.updated`, `bookings.cancelled`
- `customers.created`, `customers.updated`, `customers.deleted`

### Phase 4 - Publishing
1. Update `package.json` metadata
2. Test thoroughly
3. Publish to npm: `npm publish`
4. Submit to [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Start n8n with this node for testing |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix code style issues |

---

## Environment Variables

Set these in n8n for OAuth to work:

```env
# OAuth Client Credentials (provided by Anny)
ANNY_CLIENT_ID_CO=your-client-id-co
ANNY_CLIENT_SECRET_CO=your-secret-co
ANNY_CLIENT_ID_EU=your-client-id-eu
ANNY_CLIENT_SECRET_EU=your-secret-eu
ANNY_CLIENT_ID_STAGING=your-client-id-staging
ANNY_CLIENT_SECRET_STAGING=your-secret-staging
```

> **Note:** Currently, credentials must be entered manually in n8n. To use ENV variables, update `AnnyOAuth2Api.credentials.ts` to read from `process.env`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Node not appearing | Run `npm run build`, restart n8n |
| OAuth fails | Check region matches your credentials |
| API errors | Check n8n execution logs, verify scopes |
| TypeScript errors | Run `npm run build` to see detailed errors |
