// server.js
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

// Allow JSON and cross-origin requests
app.use(cors());
app.use(express.json());

// Initialize OpenAI with your key from environment variable
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // set this in Render
});

// Simple health-check route
app.get("/", (req, res) => {
  res.send("Empathy feedback server is running ✅");
});

// Main route Captivate will call
app.post("/empathy-feedback", async (req, res) => {
  try {
    const { learnerMessage } = req.body;

    if (!learnerMessage || typeof learnerMessage !== "string") {
      return res
        .status(400)
        .json({ error: "learnerMessage (string) is required in the body." });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini", // you can change model later if you want
      instructions:
        "You are a customer-service communication coach. Evaluate messages using the Empathy Rewrite Framework: Pinpoint Emotions → Acknowledge → Personalize → Encourage.",
      input: [
        {
          role: "user",
          content: `
Learner's rewritten message:

"""${learnerMessage}"""

Evaluate this message using the Empathy Rewrite Framework.

Do three things:
1) Briefly say how empathetic, clear, and customer-friendly this response is.
2) Call out where the learner:
   - Pinpoints emotions
   - Acknowledges the customer's experience
   - Personalizes details
   - Encourages / sets next steps
3) Give 2–3 specific edits that could make the message even stronger.

Talk directly TO the learner ("You do a nice job of...").
Keep the whole response under 220 words.
`,
        },
      ],
    });

    const feedbackText = response.output_text;

    return res.json({ feedback: feedbackText });
  } catch (err) {
    console.error("Error in /empathy-feedback:", err);
    return res
      .status(500)
      .json({ error: "Failed to get feedback from OpenAI." });
  }
});

app.listen(port, () => {
  console.log(`Empathy feedback server listening on port ${port}`);
});
