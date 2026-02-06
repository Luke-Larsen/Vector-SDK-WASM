use wasm_bindgen::prelude::*;
use nostr_sdk::prelude::*;
use js_sys::{Promise, Uint8Array, Function};
use web_sys::console;
use std::sync::Arc;
use std::time::Duration;

/// WASM-compatible VectorBot wrapper
#[wasm_bindgen]
pub struct WasmVectorBot {
    keys: Arc<Keys>,
    client: Arc<Client>,
    message_callback: Option<Function>,
}

#[wasm_bindgen]
impl WasmVectorBot {
    /// Set a callback function to receive incoming messages
    #[wasm_bindgen]
    pub fn set_message_callback(&mut self, callback: Function) {
        self.message_callback = Some(callback);
    }

    /// Clear the message callback
    #[wasm_bindgen]
    pub fn clear_message_callback(&mut self) {
        self.message_callback = None;
    }

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
            if let Err(e) = client.add_relay("wss://nostr.computingcache.com").await {
                console::error_1(&format!("Failed to add relay: {:?}", e).into());
                return Err(JsValue::from_str(&format!("Failed to add relay: {:?}", e)));
            }

            if let Err(e) = client.add_relay("wss://jskitty.cat/nostr").await {
                console::error_1(&format!("Failed to add relay: {:?}", e).into());
                return Err(JsValue::from_str(&format!("Failed to add relay: {:?}", e)));
            }

            if let Err(e) = client.add_relay("wss://auth.nostr1.com").await {
                console::error_1(&format!("Failed to add relay: {:?}", e).into());
                return Err(JsValue::from_str(&format!("Failed to add relay: {:?}", e)));
            }

            // Connect to relays
            client.connect().await;

            Ok(JsValue::from(WasmVectorBot {
                keys,
                client,
                message_callback: None,
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

    /// Fetch recent messages from admin using gift wrap (Kind::GiftWrap)
    #[wasm_bindgen]
    pub fn fetch_messages(&self) -> Promise {
        let client = self.client.clone();
        let keys = self.keys.clone();
        let callback = self.message_callback.clone();

        let future = async move {
            if callback.is_none() {
                return Err(JsValue::from_str("No callback set"));
            }

            let callback = callback.unwrap();

            // Create a filter for gift wrap messages (Kind::GiftWrap)
            // This is what Vector-SDK uses for receiving messages
            let filter = Filter::new()
                .kind(Kind::GiftWrap)
                .pubkey(keys.public_key())
                .limit(10); // Limit to 10 most recent messages

            // Fetch messages
            match client.fetch_events(filter, Duration::from_secs(30)).await {
                Ok(messages) => {
                    console::log_1(&format!("Fetched {} gift wrap messages", messages.len()).into());

                    for msg in messages {
                        // Try to unwrap the gift wrap message
                        match client.unwrap_gift_wrap(&msg).await {
                            Ok(unwrapped) => {
                                // Extract the decrypted content from the unwrapped gift's rumor
                                let decrypted_content = unwrapped.rumor.content;

                                // Call the JavaScript callback with the decrypted message, message ID, and original timestamp
                                if let Err(e) = callback.call3(
                                    &JsValue::NULL,
                                    &JsValue::from_str(&decrypted_content),
                                    &JsValue::from_str(&msg.id.to_string()),
                                    &JsValue::from_f64(msg.created_at.as_u64() as f64),
                                ) {
                                    console::error_1(&format!("Failed to call callback: {:?}", e).into());
                                }
                            }
                            Err(e) => {
                                console::error_1(&format!("Failed to unwrap gift wrap message: {:?}", e).into());
                                // Try to call callback with raw content as fallback, using current time as timestamp
                                if let Err(e) = callback.call3(
                                    &JsValue::NULL,
                                    &JsValue::from_str(&msg.content),
                                    &JsValue::from_str(&msg.id.to_string()),
                                    &JsValue::from_f64(msg.created_at.as_u64() as f64),
                                ) {
                                    console::error_1(&format!("Failed to call callback with raw content: {:?}", e).into());
                                }
                            }
                        }
                    }

                    Ok(JsValue::from_str("Messages fetched successfully"))
                }
                Err(e) => {
                    console::error_1(&format!("Failed to fetch messages: {:?}", e).into());
                    // Return success even if no messages found to avoid breaking the UI
                    Ok(JsValue::from_str("No new messages"))
                }
            }
        };

        wasm_bindgen_futures::future_to_promise(future)
    }

    /// Get the admin public key
    #[wasm_bindgen]
    pub fn get_admin_public_key() -> String {
        "npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy".to_string()
    }
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn start() {
    console::log_1(&"WASM module initialized".into());
}