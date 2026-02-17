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
        relays: 'wss://nostr.computingcache.com,wss://jskitty.cat/nostr,wss://auth.nostr1.com'
    };

    // Instance counter for multiple embeds
    let instanceCounter = 0;

    // Main embed class
    class VectorSupportEmbed {
        constructor(element) {
            this.element = element;
            this.instanceId = `vector-support-${instanceCounter++}`;
            this.config = {};
            this.bot = null;
            this.wasmLoaded = false;
            this.initialized = false;
            this.isSubmitting = false;

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
            const adminNpub = this.element.getAttribute('data-admin-npub');
            if (!adminNpub) {
                console.error('Vector Support Embed: data-admin-npub is required');
                return;
            }
            config.adminNpub = adminNpub;

            // Optional configurations
            config.buttonText = this.element.getAttribute('data-button-text') || DEFAULTS.buttonText;
            config.buttonColor = this.element.getAttribute('data-button-color') || DEFAULTS.buttonColor;
            config.position = this.element.getAttribute('data-position') || DEFAULTS.position;
            config.showFiles = this.element.getAttribute('data-show-files') === 'true';
            config.placeholder = this.element.getAttribute('data-placeholder') || DEFAULTS.placeholder;
            config.successMessage = this.element.getAttribute('data-success-message') || DEFAULTS.successMessage;
            config.onSubmit = this.element.getAttribute('data-on-submit');
            config.customContainer = this.element.getAttribute('data-custom-container');
            config.relays = this.element.getAttribute('data-relays') || DEFAULTS.relays;

            this.config = config;
        }

        createContainer() {
            // Create shadow DOM for styling isolation
            const shadowRoot = this.element.attachShadow({ mode: 'open' });

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
                    padding: 24px;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 400px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }
                .vector-support-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
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
                .vector-support-textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    margin-bottom: 12px;
                    resize: vertical;
                    box-sizing: border-box;
                }
                .vector-support-file-upload {
                    margin-bottom: 12px;
                    display: ${this.config.showFiles ? 'block' : 'none'};
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
                    margin-bottom: 6px;
                }
                .vector-support-file-name {
                    font-size: 12px;
                    color: #666;
                    word-break: break-all;
                }
                .vector-support-submit {
                    background-color: ${this.config.buttonColor};
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    font-size: 14px;
                    border-radius: 4px;
                    cursor: pointer;
                    width: 100%;
                }
                .vector-support-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .vector-support-status {
                    margin-top: 12px;
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
            modalTitle.textContent = 'Support Request';

            const closeButton = document.createElement('button');
            closeButton.className = 'vector-support-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => this.closeModal());

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

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);

            modalContent.appendChild(modalHeader);
            modalContent.appendChild(textarea);
            modalContent.appendChild(fileUpload);
            modalContent.appendChild(submitButton);
            modalContent.appendChild(status);

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
                const wasmSupport = await import('./wasm_support.js');
                this.wasmModule = wasmSupport;
                await wasmSupport.init();
                this.wasmLoaded = true;
            } catch (error) {
                console.error('Vector Support Embed: Failed to load WASM module', error);
                this.showStatus('error', 'Failed to initialize support system');
            }
        }

        async initBot() {
            if (!this.wasmLoaded || !this.wasmModule) return;

            try {
                this.bot = await this.wasmModule.WasmVectorBot.create();
                console.log(`Vector Support Embed #${this.instanceId}: Bot initialized`);
            } catch (error) {
                console.error(`Vector Support Embed #${this.instanceId}: Failed to initialize bot`, error);
                this.showStatus('error', 'Failed to initialize support bot');
            }
        }

        openModal() {
            const modal = this.element.shadowRoot.getElementById(`${this.instanceId}-modal`);
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        closeModal() {
            const modal = this.element.shadowRoot.getElementById(`${this.instanceId}-modal`);
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        showStatus(type, message) {
            const status = this.element.shadowRoot.getElementById(`${this.instanceId}-status`);
            status.className = `vector-support-status ${type}`;
            status.textContent = message;
        }

        async submitTicket() {
            if (this.isSubmitting || !this.bot) return;

            const message = this.element.shadowRoot.getElementById(`${this.instanceId}-message`).value.trim();
            const fileInput = this.element.shadowRoot.getElementById(`${this.instanceId}-file`);

            if (!message) {
                this.showStatus('error', 'Please enter a message');
                return;
            }

            this.isSubmitting = true;
            this.showStatus('loading', 'Sending support ticket...');

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

                // Reset form
                this.element.shadowRoot.getElementById(`${this.instanceId}-message`).value = '';
                if (fileInput) fileInput.value = '';
                this.element.shadowRoot.getElementById(`${this.instanceId}-filename`).textContent = 'No file selected';

                // Close modal after 2 seconds
                setTimeout(() => this.closeModal(), 2000);

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

            // Initialize the embed
            new VectorSupportEmbed(embedElement);
        });
    });

    // Define custom element
    if ('customElements' in window) {
        customElements.define('vector-support-embed', VectorSupportEmbed);
    }
})();