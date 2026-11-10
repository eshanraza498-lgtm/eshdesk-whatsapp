const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(express.json());

// Line 10: Apni OpenRouter API Key paste karein (single line me)
const OPENROUTER_API_KEY = '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';

const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe'
];

let browserPath = possiblePaths.find(path => fs.existsSync(path));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: 'new',
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
    console.log('\n========================================');
    console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP:');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ AI Real Estate WhatsApp Bot is Ready and Connected Successfully!');
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
    // Sirf Groups, Channels, aur Statuses ko ignore karein
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
        // Safe typing state check
        try {
            const chat = await msg.getChat();
            if (chat && typeof chat.sendStateTyping === 'function') {
                await chat.sendStateTyping();
            }
        } catch (e) {
            // Typing state ignore agar load na ho
        }

        const aiReply = await getAIResponse(msg.body);
        await msg.reply(aiReply);
        console.log(`🤖 AI Reply sent to ${msg.from}: ${aiReply}`);
    } catch (err) {
        console.error('Message Handling Error:', err.message || err);
    }
});

client.initialize();

app.listen(3000, () => console.log('🚀 Local Gateway running on port 3000'));
