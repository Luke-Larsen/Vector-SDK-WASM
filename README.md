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

## Requirements

- Node.js 16+
- Rust 1.60+
- wasm-pack
- npm or yarn

## License

MIT