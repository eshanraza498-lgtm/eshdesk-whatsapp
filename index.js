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
        executablePath: browserPath || process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        headless: true,
        protocolTimeout: 120000,
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
                <h2 style="color:#333
