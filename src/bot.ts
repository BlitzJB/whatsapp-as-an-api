import { Client, RemoteAuth, MessageMedia, Chat, ContactId } from 'whatsapp-web.js';
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

function verifyPasscode(passcode: string): boolean {
    return passcode === config.passcode;
}

const MONGODB_URI = 'mongodb://mongodb:27017/whatsapp-bot';
const PORT = process.env.PORT || 3000;

interface SendMessageRequest {
    receiverId: string;
    content: string;
    attachmentUrl?: string;
    attachmentName?: string;
}

type GetIdParams = {
    phoneNumber: string;
};

// Remove the qrCodeData variable
// let qrCodeData: string | null = null;

async function initializeWhatsAppClient(): Promise<Client> {
    await mongoose.connect(MONGODB_URI);
    const store = new MongoStore({ mongoose: mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000,
            clientId: 'client-id',
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    });

    // Remove the 'qr' event listener
    // client.on('qr', (qr: string) => { ... });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('remote_session_saved', () => {
        console.log('Session saved in remote auth database.');
    });

    client.on('authenticated', () => {
        console.log('Session found in remote auth database and loaded successfully.');
    });

    client.on('auth_failure', (msg: string) => {
        console.error('Authentication failure:', msg);
        console.log('Session is invalid and needs re-authentication.');
    });

    client.on('message', async (message) => {
        if (message.body === '!ping') {
            await message.reply('pong');
        }
    });

    await client.initialize();
    return client;
}

async function setupExpressServer(client: Client): Promise<void> {
    const app = express();
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.post('/send', async (req: Request<{}, {}, SendMessageRequest>, res: Response) => {
        const passcode = req.headers['x-passcode'];
        if (!passcode || typeof passcode !== 'string' || !verifyPasscode(passcode)) {
            res.status(401).json({ error: 'Invalid passcode' });
            return;
        }
        const { receiverId, content, attachmentUrl, attachmentName } = req.body;

        try {
            const media = attachmentUrl ? await MessageMedia.fromUrl(attachmentUrl, { unsafeMime: true, filename: attachmentName ?? undefined }) : undefined;
            const chat: Chat = await client.getChatById(receiverId);
            await chat.sendMessage(content, { media });

            res.status(200).json({ message: 'Message sent successfully' });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    });

    app.get('/get-id/:phoneNumber', async (req: Request<GetIdParams>, res: Response) => {
        const passcode = req.headers['x-passcode'];
        if (!passcode || typeof passcode !== 'string' || !verifyPasscode(passcode)) {
            res.status(401).json({ error: 'Invalid passcode' });
            return;
        }
        const { phoneNumber } = req.params;

        try {
            const contact: ContactId | null = await client.getNumberId(phoneNumber);

            if (contact) {
                res.status(200).json({ id: contact._serialized });
            } else {
                res.status(404).json({ error: 'Contact not found' });
            }
        } catch (error) {
            console.error('Error getting contact ID:', error);
            res.status(500).json({ error: 'Failed to get contact ID' });
        }
    });

    // Add a new endpoint to request pairing code
    app.post('/request-pairing-code', async (req: Request, res: Response) => {
        const passcode = req.headers['x-passcode'];
        if (!passcode || typeof passcode !== 'string' || !verifyPasscode(passcode)) {
            res.status(401).json({ error: 'Invalid passcode' });
            return;
        }
        let { phoneNumber } = req.body;
        // if it doesnt start with 91, add it
        if (!phoneNumber.startsWith('91')) {
            phoneNumber = '91' + phoneNumber;
            // remove spaces and trims
            phoneNumber = phoneNumber.replace(/\s+/g, '').trim();
        }
        try {
            const code = await client.requestPairingCode(phoneNumber, true);
            res.status(200).json({ pairingCode: code });
        } catch (error) {
            console.error('Error requesting pairing code:', error);
            res.status(500).json({ error: 'Failed to request pairing code' });
        }
    });

    // Update the health check endpoint
    app.get('/health', async (req: Request, res: Response) => {
        const passcode = req.headers['x-passcode'];
        if (!passcode || typeof passcode !== 'string' || !verifyPasscode(passcode)) {
            res.status(401).json({ error: 'Invalid passcode' });
            return;
        }
        if (!client.info) {
            res.status(503).json({ status: 'unavailable', message: 'Client not initialized' });
            return;
        }

        try {
            await client.sendMessage('919677196957@c.us', 'Health check message');
            res.status(200).json({ status: 'healthy', message: 'Session is active' });
        } catch (error) {
            console.error('Error sending health check message:', error);
            res.status(500).json({ status: 'unhealthy', message: 'Session is inactive' });
        }
    });

    // New endpoint 3: Reset session
    app.post('/reset', async (req: Request, res: Response) => {
        const passcode = req.headers['x-passcode'];
        if (!passcode || typeof passcode !== 'string' || !verifyPasscode(passcode)) {
            res.status(401).json({ error: 'Invalid passcode' });
            return;
        }
        try {
            await client.logout();
            await client.destroy();
            const newClient = await initializeWhatsAppClient();
            client = newClient;
            res.json({ message: 'Session reset initiated' });
        } catch (error) {
            console.error('Error resetting session:', error);
            res.status(500).json({ error: 'Failed to reset session' });
        }
    });

    // New authentication endpoint
    app.post('/auth', (req: Request, res: Response) => {
        const passcode = req.headers['x-passcode'];
        if (passcode && typeof passcode === 'string' && verifyPasscode(passcode)) {
            res.status(200).json({ message: 'Authenticated successfully' });
        } else {
            res.status(401).json({ error: 'Invalid passcode' });
        }
    });

    // Serve the main HTML file for all routes
    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

async function startBot(): Promise<void> {
    try {
        const client = await initializeWhatsAppClient();
        await setupExpressServer(client);
    } catch (error) {
        console.error('Error starting bot:', error);
    }
}

startBot();