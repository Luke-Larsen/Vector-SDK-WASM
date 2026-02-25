/**
 * Vector Support Ticket Embed
 * A one-line embed solution for the Vector-SDK WASM support ticket system
 *
 * Usage:
 * <script src="vector-support-embed.js" data-admin-npub="npub1..."></script>
 */

(function() {
    'use strict';

    // Configuration defaults
    const DEFAULTS = {
        buttonText: 'Get Support',
        buttonColor: '#4CAF50',
        position: 'fixed',
        showFiles: false,
        placeholder: 'Describe your issue...',
        successMessage: 'Support ticket sent!',
        relays: 'wss://nostr.computingcache.com,wss://jskitty.cat/nostr,wss://auth.nostr1.com',
        autoRefreshInterval: 30 // seconds
    };

    // Instance counter for multiple embeds
    let instanceCounter = 0;

    // Cookie utility functions
    const CookieUtils = {
        /**
         * Set a cookie with optional expiration days
         */
        setCookie(name, value, days = 30) {
            let expires = '';
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = `; expires=${date.toUTCString()}`;
            }
            document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
        },

        /**
         * Get a cookie by name
         */
        getCookie(name) {
            const nameEQ = `${name}=`;
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(nameEQ)) {
                    return decodeURIComponent(cookie.substring(nameEQ.length));
                }
            }
            return null;
        },

        /**
         * Delete a cookie
         */
        deleteCookie(name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        },

        /**
         * Check if a cookie exists
         */
        hasCookie(name) {
            return this.getCookie(name) !== null;
        }
    };

    // Main embed class
    class VectorSupportEmbed extends HTMLElement {
        constructor() {
            super();
            this.instanceId = `vector-support-${instanceCounter++}`;
            this.config = {};
            this.bot = null;
            this.wasmLoaded = false;
            this.initialized = false;
            this.isSubmitting = false;
            this.messages = [];
            this.lastMessageIds = new Set();
            this.autoRefreshIntervalId = null;
            this.botNsec = null;
        }

        /**
         * Save bot nsec to cookie
         */
        saveBotNsec(nsec) {
            if (!nsec) return;
            CookieUtils.setCookie(`vector_support_bot_nsec_${this.instanceId}`, nsec, 30);
        }

        /**
         * Load bot nsec from cookie
         */
        loadBotNsec() {
            return CookieUtils.getCookie(`vector_support_bot_nsec_${this.instanceId}`);
        }

        /**
         * Save chat history to cookie
         */
        saveChatHistory() {
            if (this.messages.length === 0) return;

            try {
                const historyData = JSON.stringify(this.messages);
                CookieUtils.setCookie(`vector_support_chat_history_${this.instanceId}`, historyData, 30);
            } catch (error) {
                console.error(`Vector Support Embed #${this.instanceId}: Failed to save chat history`, error);
            }
        }

        /**
         * Load chat history from cookie
         */
        loadChatHistory() {
            const historyData = CookieUtils.getCookie(`vector_support_chat_history_${this.instanceId}`);
            if (!historyData) return [];

            try {
                const messages = JSON.parse(historyData);
                // Restore lastMessageIds from loaded messages
                messages.forEach(msg => {
                    if (msg.id) {
                        this.lastMessageIds.add(msg.id);
                    }
                });
                return messages;
            } catch (error) {
                console.error(`Vector Support Embed #${this.instanceId}: Failed to load chat history`, error);
                return [];
            }
        }

        /**
         * Clear all stored data
         */
        clearStoredData() {
            CookieUtils.deleteCookie(`vector_support_bot_nsec_${this.instanceId}`);
            CookieUtils.deleteCookie(`vector_support_chat_history_${this.instanceId}`);
        }

        connectedCallback() {
            this.init();
        }

        async init() {
            // Parse configuration from data attributes
            this.parseConfig();

            // Create container
            this.createContainer();

            // Load WASM module
            await this.loadWasm();

            // Initialize bot
            await this.initBot();

            this.initialized = true;
        }

        parseConfig() {
            const config = {};

            // Required: admin npub
            const adminNpub = this.getAttribute('data-admin-npub');
            if (!adminNpub) {
                console.error('Vector Support Embed: data-admin-npub is required');
                return;
            }
            config.adminNpub = adminNpub;

            // Optional configurations
            config.buttonText = this.getAttribute('data-button-text') || DEFAULTS.buttonText;
            config.buttonColor = this.getAttribute('data-button-color') || DEFAULTS.buttonColor;
            config.position = this.getAttribute('data-position') || DEFAULTS.position;
            config.showFiles = this.getAttribute('data-show-files') === 'true';
            config.placeholder = this.getAttribute('data-placeholder') || DEFAULTS.placeholder;
            config.successMessage = this.getAttribute('data-success-message') || DEFAULTS.successMessage;
            config.onSubmit = this.getAttribute('data-on-submit');
            config.onMessage = this.getAttribute('data-on-message');
            config.customContainer = this.getAttribute('data-custom-container');
            config.relays = this.getAttribute('data-relays') || DEFAULTS.relays;

            // Auto-refresh configuration
            const autoRefreshIntervalAttr = this.getAttribute('data-auto-refresh-interval');
            if (autoRefreshIntervalAttr) {
                const interval = parseInt(autoRefreshIntervalAttr);
                if (!isNaN(interval) && interval > 0) {
                    config.autoRefreshInterval = interval;
                }
            } else {
                config.autoRefreshInterval = DEFAULTS.autoRefreshInterval;
            }

            this.config = config;
        }

        createContainer() {
            // Create shadow DOM for styling isolation
            const shadowRoot = this.attachShadow({ mode: 'open' });

            // Minimal styles
            const style = document.createElement('style');
            style.textContent = `
                :host {
                    display: block;
                }
                .vector-support-container {
                    position: ${this.config.position === 'fixed' ? 'fixed' : 'relative'};
                    ${this.config.position === 'fixed' ? 'bottom: 20px; right: 20px;' : ''}
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 400px;
                    width: 100%;
                }
                .vector-support-button {
                    background-color: ${this.config.buttonColor};
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    font-size: 14px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    width: 100%;
                    box-sizing: border-box;
                }
                .vector-support-button:hover {
                    opacity: 0.9;
                }
                .vector-support-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .vector-support-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }
                .vector-support-modal-content {
                    background: white;
                    padding: 0;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 400px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }
                .vector-support-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #eee;
                    background: white;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                .vector-support-modal-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                }
                .vector-support-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .vector-support-messages-container {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    background-color: #f9f9f9;
                    display: flex;
                    flex-direction: column;
                }
                .vector-support-message {
                    margin-bottom: 12px;
                    padding: 10px 12px;
                    border-radius: 6px;
                    max-width: 80%;
                    word-wrap: break-word;
                    position: relative;
                }
                .vector-support-message.user {
                    background-color: #e3f2fd;
                    align-self: flex-end;
                    border-bottom-right-radius: 2px;
                }
                .vector-support-message.admin {
                    background-color: #f1f1f1;
                    align-self: flex-start;
                    border-bottom-left-radius: 2px;
                }
                .vector-support-message-sender {
                    font-weight: 600;
                    font-size: 12px;
                    margin-bottom: 4px;
                }
                .vector-support-message-content {
                    font-size: 14px;
                    line-height: 1.4;
                }
                .vector-support-message-time {
                    font-size: 10px;
                    color: #999;
                    margin-top: 4px;
                    text-align: right;
                }
                .vector-support-input-container {
                    padding: 16px;
                    border-top: 1px solid #eee;
                    background: white;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .vector-support-textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    resize: vertical;
                    box-sizing: border-box;
                }
                .vector-support-file-upload {
                    margin-bottom: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .vector-support-file-input {
                    display: none;
                }
                .vector-support-file-label {
                    display: inline-block;
                    padding: 8px 12px;
                    background-color: #f0f0f0;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: center;
                }
                .vector-support-file-name {
                    font-size: 12px;
                    color: #666;
                    word-break: break-all;
                    text-align: center;
                }
                .vector-support-submit {
                    background-color: ${this.config.buttonColor};
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    font-size: 14px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .vector-support-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .vector-support-status {
                    margin-top: 8px;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    display: none;
                }
                .vector-support-status.success {
                    background-color: #d4edda;
                    color: #155724;
                    display: block;
                }
                .vector-support-status.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    display: block;
                }
                .vector-support-status.loading {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    display: block;
                }
            `;

            // Container
            const container = document.createElement('div');
            container.className = 'vector-support-container';

            // Button
            const button = document.createElement('button');
            button.className = 'vector-support-button';
            button.textContent = this.config.buttonText;
            button.addEventListener('click', () => this.openModal());

            // Modal
            const modal = document.createElement('div');
            modal.className = 'vector-support-modal';
            modal.id = `${this.instanceId}-modal`;

            const modalContent = document.createElement('div');
            modalContent.className = 'vector-support-modal-content';

            const modalHeader = document.createElement('div');
            modalHeader.className = 'vector-support-modal-header';

            const modalTitle = document.createElement('h3');
            modalTitle.className = 'vector-support-modal-title';
            modalTitle.textContent = 'Support Chat';

            const closeButton = document.createElement('button');
            closeButton.className = 'vector-support-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => this.closeModal());

            // Messages container
            const messagesContainer = document.createElement('div');
            messagesContainer.className = 'vector-support-messages-container';
            messagesContainer.id = `${this.instanceId}-messages`;

            // Input container
            const inputContainer = document.createElement('div');
            inputContainer.className = 'vector-support-input-container';

            const textarea = document.createElement('textarea');
            textarea.className = 'vector-support-textarea';
            textarea.placeholder = this.config.placeholder;
            textarea.id = `${this.instanceId}-message`;

            const fileUpload = document.createElement('div');
            fileUpload.className = 'vector-support-file-upload';

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.className = 'vector-support-file-input';
            fileInput.id = `${this.instanceId}-file`;

            const fileLabel = document.createElement('label');
            fileLabel.className = 'vector-support-file-label';
            fileLabel.htmlFor = `${this.instanceId}-file`;
            fileLabel.textContent = 'Attach File (Optional)';

            const fileName = document.createElement('div');
            fileName.className = 'vector-support-file-name';
            fileName.textContent = 'No file selected';
            fileName.id = `${this.instanceId}-filename`;

            const submitButton = document.createElement('button');
            submitButton.className = 'vector-support-submit';
            submitButton.textContent = 'Send';
            submitButton.addEventListener('click', () => this.submitTicket());

            const status = document.createElement('div');
            status.className = 'vector-support-status';
            status.id = `${this.instanceId}-status`;

            // Build modal structure
            fileUpload.appendChild(fileInput);
            fileUpload.appendChild(fileLabel);
            fileUpload.appendChild(fileName);

            inputContainer.appendChild(textarea);
            inputContainer.appendChild(fileUpload);
            inputContainer.appendChild(submitButton);
            inputContainer.appendChild(status);

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);

            modalContent.appendChild(modalHeader);
            modalContent.appendChild(messagesContainer);
            modalContent.appendChild(inputContainer);

            modal.appendChild(modalContent);

            container.appendChild(button);
            container.appendChild(modal);

            shadowRoot.appendChild(style);
            shadowRoot.appendChild(container);

            // Handle file selection
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    fileName.textContent = e.target.files[0].name;
                } else {
                    fileName.textContent = 'No file selected';
                }
            });
        }

        async loadWasm() {
            try {
                // Dynamically import the WASM module
                const wasmSupport = await import('./pkg/wasm_support.js');
                this.wasmModule = wasmSupport;
                // Initialize the WASM module
                await wasmSupport.default();
                this.wasmLoaded = true;
            } catch (error) {
                console.error('Vector Support Embed: Failed to load WASM module', error);
                this.showStatus('error', 'Failed to initialize support system');
            }
        }

        async initBot() {
            if (!this.wasmLoaded || !this.wasmModule) return;

            try {
                // Wait for the WASM module to be fully initialized
                await new Promise(resolve => setTimeout(resolve, 100));

                // Load existing bot nsec from cookie if available
                const savedNsec = this.loadBotNsec();
                if (savedNsec) {
                    console.log(`Vector Support Embed #${this.instanceId}: Loading existing bot from cookie`);
                    // Note: Current WASM implementation doesn't support loading keys directly
                    // The bot will be created with new keys, but we'll save the nsec after creation
                }

                // WasmVectorBot is exported directly from the module
                this.bot = await this.wasmModule.WasmVectorBot.create();
                console.log(`Vector Support Embed #${this.instanceId}: Bot initialized`);

                // Get the bot's public key and save the nsec if we have it
                const botNpub = await this.bot.get_public_key();
                console.log(`Vector Support Embed #${this.instanceId}: Bot npub: ${botNpub}`);

                // Set up message callback to receive incoming messages
                this.bot.set_message_callback((message, messageId, timestamp) => {
                    this.handleIncomingMessage(message, messageId, timestamp);
                });

                // Load chat history from cookie
                const savedMessages = this.loadChatHistory();
                if (savedMessages.length > 0) {
                    this.messages = savedMessages;
                    console.log(`Vector Support Embed #${this.instanceId}: Loaded ${savedMessages.length} messages from cookie`);
                }

                // Start auto-refresh if configured
                if (this.config.autoRefreshInterval && this.config.autoRefreshInterval > 0) {
                    this.startAutoRefresh();
                }
            } catch (error) {
                console.error(`Vector Support Embed #${this.instanceId}: Failed to initialize bot`, error);
                this.showStatus('error', 'Failed to initialize support bot');
            }
        }

        /**
         * Start auto-refreshing messages at the configured interval
         */
        startAutoRefresh() {
            // Stop any existing interval first
            this.stopAutoRefresh();

            // Convert interval from seconds to milliseconds
            const intervalMs = this.config.autoRefreshInterval * 1000;

            console.log(`Vector Support Embed #${this.instanceId}: Starting auto-refresh every ${this.config.autoRefreshInterval} seconds`);

            this.autoRefreshIntervalId = setInterval(async () => {
                try {
                    await this.fetchMessages();
                } catch (error) {
                    console.error(`Vector Support Embed #${this.instanceId}: Auto-refresh error`, error);
                }
            }, intervalMs);
        }

        /**
         * Stop auto-refreshing messages
         */
        stopAutoRefresh() {
            if (this.autoRefreshIntervalId) {
                clearInterval(this.autoRefreshIntervalId);
                this.autoRefreshIntervalId = null;
                console.log(`Vector Support Embed #${this.instanceId}: Auto-refresh stopped`);
            }
        }

        /**
         * Handle incoming messages from support agents
         */
        handleIncomingMessage(message, messageId, timestamp) {
            console.log(`Vector Support Embed #${this.instanceId}: Received message`, message, 'ID:', messageId);

            // Check if we've already seen this message
            if (this.lastMessageIds.has(messageId)) {
                console.log(`Vector Support Embed #${this.instanceId}: Duplicate message detected, skipping`, messageId);
                return;
            }

            // Skip typing indicators
            if (this.isTypingIndicator(message)) {
                console.log(`Vector Support Embed #${this.instanceId}: Typing indicator detected, skipping`, message);
                return;
            }

            // Convert Unix timestamp (seconds) to ISO string
            let messageTimestamp;
            if (timestamp && !isNaN(timestamp)) {
                messageTimestamp = new Date(timestamp * 1000).toISOString();
            } else {
                messageTimestamp = new Date().toISOString();
            }

            // Add the message to our list
            const newMessage = {
                id: messageId,
                content: message,
                sender: 'admin',
                timestamp: messageTimestamp
            };

            this.messages.push(newMessage);
            this.lastMessageIds.add(messageId);

            // Save chat history to cookie
            this.saveChatHistory();

            // Render the message in the chat window
            this.renderMessage(newMessage);

            // Trigger onMessage callback if provided
            if (this.config.onMessage) {
                const callback = window[this.config.onMessage];
                if (typeof callback === 'function') {
                    callback({
                        message: message,
                        messageId: messageId,
                        timestamp: messageTimestamp,
                        sender: 'admin',
                        instanceId: this.instanceId
                    });
                }
            }
        }

        /**
         * Check if a message is a typing indicator
         */
        isTypingIndicator(message) {
            const typingPatterns = [
                /^typing$/i,
                /^is typing$/i,
                /^user is typing$/i,
                /^admin is typing$/i,
                /^\uD83D\uDC41$/i, // Typing indicator emoji
                /^typing...$/i
            ];

            return typingPatterns.some(pattern => pattern.test(message));
        }

        /**
         * Fetch new messages from the bot
         */
        async fetchMessages() {
            if (!this.bot) {
                console.error(`Vector Support Embed #${this.instanceId}: Bot not initialized`);
                return false;
            }

            try {
                await this.bot.fetch_messages();
                console.log(`Vector Support Embed #${this.instanceId}: Messages fetched`);
                return true;
            } catch (error) {
                console.error(`Vector Support Embed #${this.instanceId}: Error fetching messages`, error);
                return false;
            }
        }

        /**
         * Get all messages (both sent and received)
         */
        getMessages() {
            return [...this.messages];
        }

        /**
         * Add a user message to the store
         */
        addUserMessage(message) {
            const newMessage = {
                content: message,
                sender: 'user',
                timestamp: new Date().toISOString()
            };

            this.messages.push(newMessage);
            return newMessage;
        }

        openModal() {
            const modal = this.shadowRoot.getElementById(`${this.instanceId}-modal`);
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Display message history
            this.renderMessages();
        }

        closeModal() {
            const modal = this.shadowRoot.getElementById(`${this.instanceId}-modal`);
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        /**
         * Render all messages in the chat window
         */
        renderMessages() {
            const messagesContainer = this.shadowRoot.getElementById(`${this.instanceId}-messages`);
            if (!messagesContainer) return;

            // Clear existing messages
            messagesContainer.innerHTML = '';

            // Render each message
            this.messages.forEach(msg => {
                this.renderMessage(msg);
            });

            // Scroll to bottom
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }

        /**
         * Render a single message
         */
        renderMessage(message) {
            const messagesContainer = this.shadowRoot.getElementById(`${this.instanceId}-messages`);
            if (!messagesContainer) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `vector-support-message ${message.sender}`;

            const senderDiv = document.createElement('div');
            senderDiv.className = 'vector-support-message-sender';
            senderDiv.textContent = message.sender === 'user' ? 'You' : 'Support';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'vector-support-message-content';
            contentDiv.textContent = message.content;

            const timeDiv = document.createElement('div');
            timeDiv.className = 'vector-support-message-time';
            timeDiv.textContent = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            messageDiv.appendChild(senderDiv);
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(timeDiv);

            messagesContainer.appendChild(messageDiv);
        }

        showStatus(type, message) {
            const status = this.shadowRoot.getElementById(`${this.instanceId}-status`);
            status.className = `vector-support-status ${type}`;
            status.textContent = message;
        }

        async submitTicket() {
            if (this.isSubmitting || !this.bot) return;

            const message = this.shadowRoot.getElementById(`${this.instanceId}-message`).value.trim();
            const fileInput = this.shadowRoot.getElementById(`${this.instanceId}-file`);

            if (!message) {
                this.showStatus('error', 'Please enter a message');
                return;
            }

            this.isSubmitting = true;
            this.showStatus('loading', 'Sending support ticket...');

            // Add user message to chat immediately
            const userMessage = {
                content: message,
                sender: 'user',
                timestamp: new Date().toISOString()
            };
            this.messages.push(userMessage);
            this.renderMessage(userMessage);

            // Save chat history to cookie
            this.saveChatHistory();

            // Reset form
            this.shadowRoot.getElementById(`${this.instanceId}-message`).value = '';
            if (fileInput) fileInput.value = '';
            this.shadowRoot.getElementById(`${this.instanceId}-filename`).textContent = 'No file selected';

            try {
                let result;
                if (this.config.showFiles && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const fileBuffer = await file.arrayBuffer();
                    const fileData = new Uint8Array(fileBuffer);

                    result = await this.bot.send_support_ticket_with_file(
                        message,
                        file.name,
                        fileData
                    );
                } else {
                    result = await this.bot.send_support_ticket_with_notification(message);
                }

                this.showStatus('success', this.config.successMessage || 'Support ticket sent!');

                // Call onSubmit callback if provided
                if (this.config.onSubmit) {
                    const callback = window[this.config.onSubmit];
                    if (typeof callback === 'function') {
                        callback({
                            message: message,
                            instanceId: this.instanceId,
                            timestamp: new Date().toISOString(),
                            success: true
                        });
                    }
                }
            } catch (error) {
                console.error(`Vector Support Embed #${this.instanceId}: Submission error`, error);
                this.showStatus('error', `Failed to send: ${error.message}`);
                if (this.config.onSubmit) {
                    const callback = window[this.config.onSubmit];
                    if (typeof callback === 'function') {
                        callback({
                            error: error.message,
                            instanceId: this.instanceId,
                            timestamp: new Date().toISOString(),
                            success: false
                        });
                    }
                }
            } finally {
                this.isSubmitting = false;
            }
        }
    }

    // Auto-initialize when script loads
    document.addEventListener('DOMContentLoaded', function() {
        const scripts = document.querySelectorAll('script[data-admin-npub]');

        scripts.forEach(script => {
            // Create a placeholder element for the embed
            const embedElement = document.createElement('vector-support-embed');
            embedElement.setAttribute('data-admin-npub', script.getAttribute('data-admin-npub'));

            // Copy all data attributes
            Array.from(script.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    embedElement.setAttribute(attr.name, attr.value);
                }
            });

            // Determine where to insert the embed
            let target = script.parentNode;

            // Check if custom container is specified
            const customContainer = script.getAttribute('data-custom-container');
            if (customContainer) {
                const container = document.querySelector(customContainer);
                if (container) {
                    target = container;
                }
            }

            // Insert before the script tag
            target.insertBefore(embedElement, script);
        });
    });

    // Define custom element
    if ('customElements' in window) {
        customElements.define('vector-support-embed', VectorSupportEmbed);
    }
})();