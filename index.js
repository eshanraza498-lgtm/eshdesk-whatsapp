import express from "express";

const app = express();
app.use(express.json());

const {
  VERIFY_TOKEN,
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  OPENROUTER_API_KEY,
} = process.env;

// Meta webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Incoming WhatsApp messages
app.post("/webhook", async (req, res) => {
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;

    const message = value?.messages?.[0];

    // Always respond 200 quickly to Meta
    res.sendStatus(200);

    if (!message || message.type !== "text") return;

    const from = message.from;
    const userText = message.text.body;

    const reply = await getAIReply(userText);

    await sendWhatsAppMessage(from, reply);
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

async function getAIReply(userText) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tum ek Pakistani real estate agency ka WhatsApp assistant ho.
Tumhara naam PropertyBot hai.

Tumhara kaam:
- Buyer ko politely Urdu/English mein reply dena
- Property type, area, budget aur timeline poochna
- Site visit book karne mein madad karna
- Fake price ya guarantee na dena
- Serious lead hone par agent se contact karne ka kehna

Reply short rakho, maximum 4 lines.`
          },
          {
            role: "user",
            content: userText
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenRouter error:", data);
    return "Shukriya! Hamari team aap se jaldi rabta karegi.";
  }

  return data.choices?.[0]?.message?.content ??
    "Shukriya! Hamari team aap se jaldi rabta karegi.";
}

async function sendWhatsAppMessage(to, text) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: text }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp send error:", data);
  }

  return data;
}

app.get("/", (_req, res) => {
  res.send("WhatsApp Real Estate Bot is running");
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
