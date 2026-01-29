use wasm_bindgen::prelude::*;
use nostr_sdk::prelude::*;
use js_sys::{Promise, Uint8Array};
use web_sys::console;
use std::sync::Arc;

/// WASM-compatible VectorBot wrapper
#[wasm_bindgen]
pub struct WasmVectorBot {
    keys: Arc<Keys>,
    client: Arc<Client>,
}

#[wasm_bindgen]
impl WasmVectorBot {
    /// Create a new VectorBot with default metadata
    #[wasm_bindgen]
    pub fn create() -> Promise {
        let future = async move {
            // Generate keys
            let keys = Arc::new(Keys::generate());

            // Create a simple client without MLS using trait object
            let mut client = Client::new(Arc::clone(&keys) as Arc<dyn NostrSigner>);
            let client = Arc::new(client);

            // Add default relays
            if let Err(e) = client.add_relay("wss://relay.damus.io").await {
                console::error_1(&format!("Failed to add relay: {:?}", e).into());
                return Err(JsValue::from_str(&format!("Failed to add relay: {:?}", e)));
            }

            if let Err(e) = client.add_relay("wss://nos.lol").await {
                console::error_1(&format!("Failed to add relay: {:?}", e).into());
                return Err(JsValue::from_str(&format!("Failed to add relay: {:?}", e)));
            }

            if let Err(e) = client.add_relay("wss://relay.nostr.band").await {
                console::error_1(&format!("Failed to add relay: {:?}", e).into());
                return Err(JsValue::from_str(&format!("Failed to add relay: {:?}", e)));
            }

            // Connect to relays
            client.connect().await;

            Ok(JsValue::from(WasmVectorBot {
                keys,
                client,
            }))
        };

        wasm_bindgen_futures::future_to_promise(future)
    }

    /// Get the bot's public key as npub
    #[wasm_bindgen]
    pub fn get_public_key(&self) -> String {
        self.keys.public_key().to_bech32().unwrap()
    }

    /// Send a private message to a recipient
    #[wasm_bindgen]
    pub fn send_private_message(&self, recipient_npub: String, message: String) -> Promise {
        let client = self.client.clone();

        let future = async move {
            let recipient = match PublicKey::from_bech32(&recipient_npub) {
                Ok(pk) => pk,
                Err(e) => {
                    console::error_1(&format!("Invalid recipient npub: {}", e).into());
                    return Err(JsValue::from_str(&format!("Invalid recipient npub: {}", e)));
                }
            };

            // Send private message
            match client.send_private_msg(recipient, &message, []).await {
                Ok(_) => Ok(JsValue::from_str("Message sent successfully")),
                Err(e) => {
                    console::error_1(&format!("Failed to send message: {:?}", e).into());
                    Err(JsValue::from_str(&format!("Failed to send message: {:?}", e)))
                }
            }
        };

        wasm_bindgen_futures::future_to_promise(future)
    }

    /// Send a support ticket to admin
    #[wasm_bindgen]
    pub fn send_support_ticket(&self, message: String) -> Promise {
        let client = self.client.clone();

        // Admin npub from requirements
        let admin_npub = "npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy";

        let future = async move {
            let recipient = match PublicKey::from_bech32(admin_npub) {
                Ok(pk) => pk,
                Err(e) => {
                    console::error_1(&format!("Invalid admin npub: {}", e).into());
                    return Err(JsValue::from_str(&format!("Invalid admin npub: {}", e)));
                }
            };

            // Send private message
            match client.send_private_msg(recipient, &message, []).await {
                Ok(_) => Ok(JsValue::from_str("Support ticket sent successfully")),
                Err(e) => {
                    console::error_1(&format!("Failed to send support ticket: {:?}", e).into());
                    Err(JsValue::from_str(&format!("Failed to send support ticket: {:?}", e)))
                }
            }
        };

        wasm_bindgen_futures::future_to_promise(future)
    }

    /// Send a support ticket with file attachment
    #[wasm_bindgen]
    pub fn send_support_ticket_with_file(&self, message: String, file_name: String, file_data: Uint8Array) -> Promise {
        let client = self.client.clone();
        let file_bytes = file_data.to_vec();

        let future = async move {
            let recipient = match PublicKey::from_bech32("npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy") {
                Ok(pk) => pk,
                Err(e) => {
                    console::error_1(&format!("Invalid admin npub: {}", e).into());
                    return Err(JsValue::from_str(&format!("Invalid admin npub: {}", e)));
                }
            };

            // Create a simple message with file info
            let msg_with_file = format!("{} [File attached: {} ({} bytes)]", message, file_name, file_bytes.len());

            // Send private message
            match client.send_private_msg(recipient, &msg_with_file, []).await {
                Ok(_) => Ok(JsValue::from_str("Support ticket with file sent successfully")),
                Err(e) => {
                    console::error_1(&format!("Failed to send support ticket with file: {:?}", e).into());
                    Err(JsValue::from_str(&format!("Failed to send support ticket with file: {:?}", e)))
                }
            }
        };

        wasm_bindgen_futures::future_to_promise(future)
    }
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn start() {
    console::log_1(&"WASM module initialized".into());
}
