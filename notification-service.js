const express = require('express');
const cors = require('cors');
const wasm_support = require('./pkg/wasm_support.js');
const { WasmVectorBot } = wasm_support;
const init = wasm_support.default;

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration - list of support agent npubs
const SUPPORT_AGENTS = [
    "npub132lq2gvwx9ae3wug5hy7a5tcs48jamynfsuact2cvgjavs5uk8vqeme4sy"
    // Add more npubs here as needed
];

let notificationBot = null;

app.use(cors());
app.use(express.json());

// Initialize WASM and notification bot
async function initNotificationService() {
    try {
        await init();
        console.log('WASM module initialized for notification service');

        // Create notification bot with static key
        notificationBot = await WasmVectorBot.create();
        const botPublicKey = notificationBot.get_public_key();
        console.log('Notification bot created with public key:', botPublicKey);

        // Set up message callback if needed
        // notificationBot.set_message_callback(messageCallback);
    } catch (error) {
        console.error('Error initializing notification service:', error);
        process.exit(1);
    }
}

// Send notification to all support agents
async function sendNotificationToAgents(subject, message, ticketId = null) {
    if (!notificationBot) {
        console.error('Notification bot not initialized');
        return false;
    }

    try {
        const results = [];

        for (const agentNpub of SUPPORT_AGENTS) {
            try {
                const notificationMessage = formatNotificationMessage(subject, message, ticketId);
                const result = await notificationBot.send_private_message(agentNpub, notificationMessage);
                results.push({ agent: agentNpub, success: true, result });
                console.log(`Notification sent to ${agentNpub}: ${subject}`);
            } catch (error) {
                results.push({ agent: agentNpub, success: false, error: error.message });
                console.error(`Failed to send notification to ${agentNpub}:`, error.message);
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`Notifications sent: ${successCount}/${SUPPORT_AGENTS.length} successful`);

        return results;
    } catch (error) {
        console.error('Error sending notifications:', error);
        return false;
    }
}

// Format notification message with ticket information
function formatNotificationMessage(subject, message, ticketId) {
    let formattedMessage = `🔔 NOTIFICATION: ${subject}\n\n`;

    if (ticketId) {
        formattedMessage += `Ticket ID: ${ticketId}\n`;
    }

    formattedMessage += `Message: ${message}\n\n`;
    formattedMessage += `Please check the support ticket system for details.`;

    return formattedMessage;
}

// API Endpoint: Notify support agents about new ticket
app.post('/api/notifications/new-ticket', async (req, res) => {
    const { senderNpub, message, ticketId } = req.body;

    if (!senderNpub || !message) {
        return res.status(400).json({ error: 'senderNpub and message are required' });
    }

    try {
        const subject = `New Support Ticket from ${senderNpub}`;
        const results = await sendNotificationToAgents(subject, message, ticketId);

        res.json({
            success: true,
            message: 'Notifications sent to support agents',
            results,
            ticketId
        });
    } catch (error) {
        console.error('Error handling new ticket notification:', error);
        res.status(500).json({ error: 'Failed to send notifications', details: error.message });
    }
});

// API Endpoint: Notify support agents about new message on existing ticket
app.post('/api/notifications/new-message', async (req, res) => {
    const { senderNpub, message, ticketId } = req.body;

    if (!senderNpub || !message || !ticketId) {
        return res.status(400).json({ error: 'senderNpub, message, and ticketId are required' });
    }

    try {
        const subject = `New Message on Ticket ${ticketId} from ${senderNpub}`;
        const results = await sendNotificationToAgents(subject, message, ticketId);

        res.json({
            success: true,
            message: 'Notifications sent to support agents',
            results,
            ticketId
        });
    } catch (error) {
        console.error('Error handling new message notification:', error);
        res.status(500).json({ error: 'Failed to send notifications', details: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        notificationBotInitialized: !!notificationBot,
        supportAgentsCount: SUPPORT_AGENTS.length
    });
});

// Start the notification service
async function startServer() {
    await initNotificationService();

    app.listen(PORT, () => {
        console.log(`Notification service running on http://localhost:${PORT}`);
        console.log(`Support agents configured: ${SUPPORT_AGENTS.length}`);
        console.log(`Support agent npubs: ${SUPPORT_AGENTS.join(', ')}`);
    });
}

startServer();