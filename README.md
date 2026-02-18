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
- ✅ **One-line embed** for easy integration into any website
- ✅ Multiple instances on the same page
- ✅ Highly customizable via HTML data attributes
- ✅ Minimal styling for easy integration
- ✅ Self-hosting support

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

### One-Line Embed (Recommended)

The easiest way to add support to your website is with a one-line embed:

```html
<script src="https://your-cdn.com/vector-support-embed.min.js" data-admin-npub="npub1..."></script>
```

**Basic Usage:**
```html
<script src="vector-support-embed.min.js" data-admin-npub="npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy"></script>
```

**Customized:**
```html
<script src="vector-support-embed.min.js"
        data-admin-npub="npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy"
        data-button-text="Contact Support"
        data-button-color="#007bff"
        data-show-files="true">
</script>
```

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

### Self-Hosting the Embed

To self-host the embed on your own website:

```bash
# Build optimized WASM artifacts
npm run build:release

# Copy embed files to your project
cp vector-support-embed.min.js /path/to/your/project/
cp -r pkg /path/to/your/project/
```

Then include in your HTML:
```html
<script src="/vector-support-embed.min.js" data-admin-npub="npub1..."></script>
```

### Multiple Instances

You can have multiple embed instances on the same page:

```html
<script src="vector-support-embed.min.js"
        data-admin-npub="npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy"
        data-button-text="Technical Support"
        data-button-color="#28a745">
</script>

<script src="vector-support-embed.min.js"
        data-admin-npub="npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy"
        data-button-text="Billing Support"
        data-button-color="#007bff"
        data-position="inline">
</script>
```

### With Callback

Track submissions with a callback function:

```html
<script src="vector-support-embed.min.js"
        data-admin-npub="npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy"
        data-on-submit="handleSupportSubmit">
</script>
<script>
function handleSupportSubmit(data) {
    if (data.success) {
        console.log('Support ticket submitted:', data);
        // Track analytics, show custom message, etc.
    } else {
        console.error('Error:', data.error);
    }
}
</script>
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

### Embed Configuration Options

All configuration is done via HTML `data-*` attributes:

| Attribute | Description | Default | Example |
|-----------|-------------|---------|---------|
| `data-admin-npub` | **Required** Admin's Nostr public key | None | `npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy` |
| `data-button-text` | Button text | `Get Support` | `Contact Us` |
| `data-button-color` | Button background color | `#4CAF50` | `#007bff` |
| `data-position` | Embed position | `fixed` | `inline` or CSS selector |
| `data-show-files` | Enable file uploads | `false` | `true` |
| `data-placeholder` | Textarea placeholder | `Describe your issue...` | `How can we help you?` |
| `data-success-message` | Success message | `Support ticket sent!` | `Thank you! We'll contact you soon.` |
| `data-on-submit` | JavaScript callback | None | `handleSupportSubmit` |
| `data-custom-container` | Custom container selector | None | `#support-container` |
| `data-relays` | Custom Nostr relays | Default relays | `wss://your-relay.com` |

### WASM Configuration

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

## Embed Implementation Details

### How It Works

1. **Auto-Initialization**: The embed script automatically initializes when the page loads
2. **WASM Loading**: The Vector-SDK WASM module is loaded asynchronously
3. **Bot Creation**: A Nostr bot is created for each embed instance
4. **Message Sending**: Support tickets are sent as encrypted private messages via Nostr
5. **Multiple Instances**: Each embed maintains its own state and configuration

### File Structure for Embed

```
vector-support-embed/
├── vector-support-embed.js        # Full source (for development)
├── vector-support-embed.min.js     # Minified version (for production)
├── wasm_support.js                 # WASM JS glue code
├── wasm_support_bg.wasm            # Compiled WASM module
└── pkg/                           # WASM package directory
```

### Customization

The embed uses Shadow DOM for styling isolation, allowing you to style it with CSS variables:

```css
vector-support-embed {
    --button-color: #007bff;
    --button-text: 'Contact Support';
}
```

### Browser Support

- Modern browsers with WebAssembly support
- Custom Elements v1 API
- Shadow DOM (optional, for styling isolation)

### Troubleshooting

**Issue: Embed doesn't appear**
- Ensure `data-admin-npub` is set
- Check browser console for errors
- Verify WASM files are accessible

**Issue: WASM module fails to load**
- Ensure all WASM files are in the correct location
- Check CORS settings if loading from a different domain
- Verify the WASM module is built with `npm run build:release`

**Issue: Messages not sending**
- Verify the admin npub is correct
- Check Nostr relay connectivity
- Ensure the bot has proper permissions
```

### Testing the Embed

A test page is included to verify the embed functionality:

```bash
# Start the server
npm start

# Open http://localhost:3000/test-embed
```

The test page demonstrates all configuration options and allows you to test the embed before deploying to your production site.
