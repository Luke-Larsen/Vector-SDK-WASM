# PivcardsAndMore Support Ticket System

A web-based support ticket system using Vector-SDK compiled to WebAssembly (WASM) that allows users to create support tickets via direct messages to an admin using the Nostr protocol.

## Features

- **Web-based interface**: Simple, intuitive form for creating support tickets
- **Secure messaging**: Uses Nostr protocol with end-to-end encryption
- **WASM integration**: Vector-SDK compiled to WebAssembly for browser execution
- **Admin notification**: Support tickets are sent directly to the admin npub
- **Real-time feedback**: Status updates during initialization and message sending

## Requirements

- Node.js (v16 or later)
- Rust (v1.75 or later)
- wasm-pack
- npm or yarn

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Build the WASM module**:
```bash
npm run build
```

## Running the Application

1. **Start the server**:
```bash
npm start
```

2. **Open your browser** and navigate to:
```
http://localhost:3000
```

## How It Works

1. The application initializes a VectorBot instance in the browser using WASM
2. Users can enter their support message in the text area
3. When submitted, the message is sent as a private direct message to the admin via Nostr
4. The admin receives the support ticket through their Nostr client

## Configuration

The admin npub is hardcoded in the WASM module:
```
npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy
```

To change the admin, modify the `send_support_ticket` function in `Vector-SDK/src/wasm.rs`.

## Technical Details

- **Frontend**: HTML/CSS/JavaScript with WASM integration
- **Backend**: Node.js Express server
- **Messaging**: Nostr protocol with private direct messages
- **Encryption**: AES-GCM for message encryption
- **Build**: wasm-pack for Rust to WASM compilation

## Development

For development with hot-reloading, you can use:

```bash
npm run build
npm start
```

Then open `http://localhost:3000` in your browser.

## License

MIT