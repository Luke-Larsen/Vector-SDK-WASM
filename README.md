# Vector-SDK WASM Support Ticket System

A support ticket system built using the Vector-SDK compiled to WebAssembly (WASM), allowing users to create support tickets that are sent directly to an admin via Nostr protocol.

## Features

- ✅ WASM compilation of Vector-SDK for browser/Node.js
- ✅ Support ticket form with message input
- ✅ File attachment support (optional)
- ✅ Direct messaging to admin via Nostr using Gift Wrap encryption
- ✅ Encrypted private messages
- ✅ Responsive web interface with chat UI
- ✅ Standalone application packaging
- ✅ Secondary notification bot for support agent alerts
- ✅ **One-line embed** for easy integration into any website
- ✅ Multiple instances on the same page
- ✅ Highly customizable via HTML data attributes
- ✅ Minimal styling for easy integration
- ✅ Self-hosting support
- ✅ Auto-refresh for incoming messages
- ✅ Message callback system for real-time updates
- ✅ Shadow DOM for styling isolation
- ✅ Typing indicator filtering

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

### With Callbacks

Track submissions and receive messages with callback functions:

```html
<script src="vector-support-embed.min.js"
        data-admin-npub="npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy"
        data-on-submit="handleSupportSubmit"
        data-on-message="handleNewMessage">
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

function handleNewMessage(data) {
    console.log('New message received:', data);
    // Update UI, play sound, etc.
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
2. **Bot Creation**: A new bot instance is created with generated keys for each embed
3. **Relay Connection**: The bot connects to Nostr relays (default: nostr.computingcache.com, jskitty.cat/nostr, auth.nostr1.com)
4. **Ticket Submission**: Users submit support tickets via a web form
5. **Message Sending**: Messages are sent as encrypted private messages using Gift Wrap to the admin
6. **Message Receiving**: The bot fetches incoming messages using Gift Wrap and calls the message callback
7. **Auto-Refresh**: Messages are automatically fetched at regular intervals (configurable)

## File Structure

```
vector-sdk-wasm/
├── wasm-support/        # WASM-compatible wrapper (Rust)
│   ├── Cargo.toml
│   ├── src/
│   │   └── lib.rs       # Main WASM implementation
│   └── pkg/             # Compiled WASM artifacts (created after build)
├── pkg/                 # Symlinked to wasm-support/pkg after build
├── index.html           # Web interface
├── server.js            # Simple HTTP server
├── notification-service.js # Notification service for support agents
├── vector-support-embed.js # Main embed script
├── vector-support-embed.min.js # Minified embed script
├── package.json         # Project configuration
├── README.md            # This file
└── test-embed.html      # Test page for embed functionality
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

// Send support ticket with notification
const result = await bot.send_support_ticket_with_notification("Your support message");

// Send support ticket with file
const fileData = new Uint8Array(await file.arrayBuffer());
const result = await bot.send_support_ticket_with_file(
    "Your support message",
    "filename.txt",
    fileData
);

// Fetch incoming messages
await bot.fetch_messages();

// Set message callback
bot.set_message_callback((message, messageId, timestamp) => {
    console.log('Received message:', message);
});
```

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
| `data-on-submit` | JavaScript callback for submission events | None | `handleSupportSubmit` |
| `data-on-message` | JavaScript callback for incoming messages | None | `handleNewMessage` |
| `data-custom-container` | Custom container selector | None | `#support-container` |
| `data-relays` | Custom Nostr relays | Default relays | `wss://your-relay.com` |
| `data-auto-refresh-interval` | Auto-refresh interval in seconds | 30 | 60 |

### Auto-Refresh Messages

The support ticket system includes an auto-refresh feature that automatically fetches new messages at regular intervals.

**Features:**
- Messages are automatically fetched in the background using `fetch_messages()`
- Configurable refresh interval (default: 30 seconds)
- Continues running even when the modal is closed
- Error resilient with proper error handling
- Uses Gift Wrap encryption for secure message retrieval

**Configuration:**
```html
<script src="vector-support-embed.min.js"
        data-admin-npub="npub1..."
        data-auto-refresh-interval="60">  <!-- Refresh every 60 seconds -->
</script>
```

If no `data-auto-refresh-interval` is specified, the default is 30 seconds. Set it to `0` to disable auto-refresh.

### Message Callbacks

The embed supports two callback functions that you can implement to handle events:

#### `data-on-submit` Callback

Called when a user submits a support ticket.

**Parameters:**
- `message`: The message content
- `instanceId`: Unique identifier for this embed instance
- `timestamp`: ISO timestamp of submission
- `success`: Boolean indicating if submission was successful
- `error`: Error message (if success is false)

#### `data-on-message` Callback

Called when a new message is received from the support agent.

**Parameters:**
- `message`: The decrypted message content
- `messageId`: Unique identifier for the message
- `timestamp`: ISO timestamp of the message
- `sender`: Always `'admin'` for received messages
- `instanceId`: Unique identifier for this embed instance

**Example:**
```javascript
function handleNewMessage(data) {
    console.log('New message from support:', data.message);
    // Play notification sound
    // Update unread badge
    // Show notification popup
}
```

### Notification Service Integration

The notification service can be used to alert support agents when new tickets or messages arrive.

#### Running the Notification Service

```bash
# Start the notification service
npm run start:notifications

# The service will run on port 3001 by default
```

#### API Endpoints

##### Health Check
```
GET /api/health
```
Returns service status and configuration information.

##### New Ticket Notification
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

##### New Message Notification
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

#### Notification Format

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

#### Configuration

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
3. **Bot Creation**: A Nostr bot is created for each embed instance with unique keys
4. **Message Sending**: Support tickets are sent as encrypted private messages via Nostr using Gift Wrap
5. **Message Receiving**: The bot periodically fetches incoming messages and calls the message callback
6. **Multiple Instances**: Each embed maintains its own state and configuration

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
- Ensure the script is loaded after the DOM is ready

**Issue: WASM module fails to load**
- Ensure all WASM files are in the correct location
- Check CORS settings if loading from a different domain
- Verify the WASM module is built with `npm run build:release`
- Check browser console for detailed error messages

**Issue: Messages not sending**
- Verify the admin npub is correct
- Check Nostr relay connectivity
- Ensure the bot has proper permissions
- Check browser console for error details

**Issue: Messages not receiving**
- Verify the auto-refresh is enabled (check `data-auto-refresh-interval`)
- Ensure the message callback is properly set up
- Check that the bot's public key is correctly configured
- Verify the Gift Wrap encryption is working properly

**Issue: Multiple instances not working**
- Ensure each instance has a unique configuration
- Check that custom container selectors are valid
- Verify no JavaScript errors are preventing initialization

### Testing the Embed

A test page is included to verify the embed functionality:

```bash
# Start the server
npm start

# Open http://localhost:3000/test-embed
```

The test page demonstrates all configuration options and allows you to test the embed before deploying to your production site.