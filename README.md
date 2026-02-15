# Vector-SDK WASM Support Ticket System

A support ticket system built using the Vector-SDK compiled to WebAssembly (WASM), allowing users to create support tickets that are sent directly to an admin via Nostr protocol.

## Features

- ✅ WASM compilation of Vector-SDK for browser/Node.js
- ✅ Support ticket form with message input
- ✅ File attachment support (optional)
- ✅ Direct messaging to admin via Nostr
- ✅ Encrypted private messages
- ✅ Responsive web interface
- ✅ Standalone application packaging
- ✅ Secondary notification bot for support agent alerts

## Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/vector-sdk-wasm.git
cd vector-sdk-wasm

# Install dependencies
npm install

# Build the WASM module
npm run build
```

## Usage

### Development Mode

```bash
# Start the development server
npm start

# Open your browser to http://localhost:3000
```

### Production Mode

```bash
# Build optimized release
npm run build:release

# Start the server
npm start
```

## Packaging for Distribution

To create a standalone package:

```bash
# Build the WASM module
npm run build

# Create distribution package
npm run package

# The package will be created in the dist/ directory
```

## How It Works

1. **WASM Initialization**: The Vector-SDK is compiled to WASM and loaded in the browser
2. **Bot Creation**: A new bot instance is created with generated keys
3. **Relay Connection**: The bot connects to Nostr relays
4. **Ticket Submission**: Users submit support tickets via a web form
5. **Message Sending**: Messages are sent as encrypted private messages to the admin

## File Structure

```
vector-sdk-wasm/
├── Vector-SDK/          # Original Vector-SDK source
├── wasm-support/        # WASM-compatible wrapper
├── pkg/                 # Compiled WASM artifacts
├── index.html           # Web interface
├── server.js            # Simple HTTP server
├── notification-service.js # Notification service for support agents
├── package.json         # Project configuration
└── README.md            # This file
```

## API Reference

### WASM Module

```javascript
import init, { WasmVectorBot } from './pkg/wasm_support.js';

// Initialize WASM
await init();

// Create a bot instance
const bot = await WasmVectorBot.create();

// Get bot public key
const publicKey = bot.get_public_key();

// Send support ticket
const result = await bot.send_support_ticket("Your support message");

// Send support ticket with file
const fileData = new Uint8Array(await file.arrayBuffer());
const result = await bot.send_support_ticket_with_file(
    "Your support message",
    "filename.txt",
    fileData
);
```

## Configuration

Edit `wasm-support/src/lib.rs` to configure:

- Admin npub (line 97)
- Default relays (lines 33-42)

## NSEC Secondary Bot Implementation

A secondary NSEC bot has been added to the support ticket system. This bot has a static key and its sole purpose is to send notifications to a list of support agents when:
- A new ticket is opened
- A new message is sent on an existing ticket

### Notification Service

The notification service is a standalone Node.js application that:
- Runs separately from the main support ticket system
- Uses the wasm-support library for Nostr operations
- Sends notifications to configured support agents
- Provides REST API endpoints for triggering notifications

### Running the Notification Service

```bash
# Start the notification service
npm run start:notifications

# The service will run on port 3001 by default
```

### API Endpoints

#### Health Check
```
GET /api/health
```
Returns service status and configuration information.

#### New Ticket Notification
```
POST /api/notifications/new-ticket
```
**Request Body:**
```json
{
    "senderNpub": "npub1...",
    "message": "User's support message",
    "ticketId": "optional-ticket-id"
}
```

#### New Message Notification
```
POST /api/notifications/new-message
```
**Request Body:**
```json
{
    "senderNpub": "npub1...",
    "message": "User's message",
    "ticketId": "required-ticket-id"
}
```

### Notification Format

Notifications sent to support agents include:
- Clear subject line (New Support Ticket or New Message on Ticket)
- Ticket ID (if available)
- Sender's npub
- Message content
- Instructions to check the support ticket system

Example:
```
🔔 NOTIFICATION: New Support Ticket from npub1abc...

Ticket ID: TICKET-123
Message: User's support message here

Please check the support ticket system for details.
```

### Configuration

Edit `notification-service.js` to configure support agents:

```javascript
const SUPPORT_AGENTS = [
    "npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy"
    // Add more npubs here as needed
];
```

## Requirements

- Node.js 16+
- Rust 1.60+
- wasm-pack
- npm or yarn

## License

MIT
