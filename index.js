const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
let currentQR = '';

const possiblePaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

let browserPath = possiblePaths.find(path => fs.existsSync(path)) || process.env.PUPPETEER_EXECUTABLE_PATH;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        headless: true,
        protocolTimeout: 120000, // <--- Yeh line timeout fix karegi[span_1](start_span)[span_1](end_span)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

        executablePath: browserPath || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    currentQR = qr;
    console.log('--- NEW QR GENERATED (AVAILABLE ON /qr) ---');
    qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
    currentQR = '';
    console.log('✅ AI Real Estate WhatsApp Bot is Ready and Connected Successfully!');
});

// HD Image QR Route
app.get('/qr', async (req, res) => {
    if (!currentQR) {
        return res.send(`
            <div style="font-family:sans-serif;text-align:center;padding:50px;">
                <h2>Bot is already connected OR QR code is loading...</h2>
                <p>Wait 5 seconds and refresh this page.</p>
            </div>
        `);
    }
    try {
        const qrImage = await qrcode.toDataURL(currentQR);
        res.send(`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;font-family:sans-serif;">
                <h2 style="color:#333;">Scan WhatsApp AI Bot</h2>
                <img src="${qrImage}" style="width:300px;height:300px;border:10px solid #f0f0f0;border-radius:10px;" />
                <p style="margin-top:15px;color:#666;">Open WhatsApp > Linked Devices > Link a Device</p>
            </div>
        `);
    } catch (err) {
        res.status(500).send('Error rendering QR Code');
    }
});

app.get('/', (req, res) => {
    res.send('EshDesk WhatsApp Bot Status: LIVE');
});

async function getAIResponse(userMessage) {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'deepseek/deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'Aap aik professional Pakistani Real Estate Agency (EshDesk Real Estate) ke AI sales assistant hain. Aap Urdu, Roman Urdu aur English me baat kar sakte hain. Aap ka maqsad client ki requirements (jaise DHA, Bahria Town, budget, plots, apartments) samajhna aur unhe meeting/call ke liye convince karna hai. Jawab hamesha chhotay, friendly aur sales-oriented rakhein.'
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('AI API Error:', error.response?.data || error.message);
        return 'Maazrat, abhi hamara system busy hai. Hum jald hi aapse rabta karein ge!';
    }
}

client.on('message', async msg => {
    if (
        msg.from.includes('@g.us') || 
        msg.from.includes('@newsletter') || 
        msg.from === 'status@broadcast' ||
        !msg.body ||
        msg.fromMe
    ) {
        return;
    }

    console.log(`📩 Message received from ${msg.from}: ${msg.body}`);

    try {
        try {
            const chat = await msg.getChat();
            if (chat && typeof chat.sendStateTyping === 'function') {
                await chat.sendStateTyping();
            }
        } catch (e) {}

        const aiReply = await getAIResponse(msg.body);
        await msg.reply(aiReply);
        console.log(`🤖 AI Reply sent to ${msg.from}: ${aiReply}`);
    } catch (err) {
        console.error('Message Handling Error:', err.message || err);
    }
});

client.initialize();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Gateway running on port ${PORT}`));
