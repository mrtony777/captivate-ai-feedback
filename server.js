import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Empathy feedback server is running ✅");
});

// --------- FIRST INTERACTION: /empathy-feedback ----------
app.post("/empathy-feedback", async (req, res) => {
  try {
    const { learnerMessage } = req.body;

    if (!learnerMessage || typeof learnerMessage !== "string") {
      return res
        .status(400)
        .json({ error: "learnerMessage (string) is required in the body." });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
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

    return res.json({ feedback: response.output_text });
  } catch (err) {
    console.error("Error in /empathy-feedback:", err);
    return res.status(500).json({ error: "Failed to get feedback from OpenAI." });
  }
});

// --------- SECOND INTERACTION: /empathy-eval ----------
app.post("/empathy-eval", async (req, res) => {
  try {
    const { learnerRewrite, selectedSteps } = req.body;

    if (!learnerRewrite || typeof learnerRewrite !== "string") {
      return res
        .status(400)
        .json({ error: "learnerRewrite (string) is required in the body." });
    }

    const steps = selectedSteps || {};
    const normalize = (v) => v === 1 || v === "1" || v === true || v === "true";

    const learnerSelected = {
      pinpoint: normalize(steps.pinpoint),
      acknowledge: normalize(steps.acknowledge),
      personalize: normalize(steps.personalize),
      encourage: normalize(steps.encourage),
    };

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions:
        "You are an Empathy Communication Coach who uses the Empathy Rewrite Framework: Pinpoint Emotions → Acknowledge → Personalize → Encourage.",
      input: [
        {
          role: "user",
          content: `
Here is the learner's rewritten message:

"""${learnerRewrite}"""

The learner believes they used these steps:
- Pinpoint Emotions selected: ${learnerSelected.pinpoint}
- Acknowledge selected: ${learnerSelected.acknowledge}
- Personalize selected: ${learnerSelected.personalize}
- Encourage selected: ${learnerSelected.encourage}

Your job:
1) Evaluate whether the learner actually used each of the four steps. For each step, say "Used" or "Missing" and briefly explain why.
2) Compare your evaluation to the learner's selections: where did they correctly identify their use of a step, and where did they overestimate or miss a step?
3) Provide a stronger suggested rewrite of their message that clearly uses all four steps.
4) End with one short, encouraging sentence about how they are progressing.

Return everything as plain text in this structure:

Empathy Breakdown:
[1–3 short sentences or bullet points]

Your Selections vs. AI Coach:
[1–4 short sentences about where they were right or off]

Suggested Rewrite:
[Your improved version, 3–6 sentences]

Encouragement:
[One brief encouraging line]

Keep the entire response under 260 words.
`,
        },
      ],
    });

    return res.json({ feedback: response.output_text });
  } catch (err) {
    console.error("Error in /empathy-eval:", err);
    return res.status(500).json({ error: "Failed to get empathy evaluation from OpenAI." });
  }
});

// --------- MICRO INTERACTION: /why-feedback ----------
app.post("/why-feedback", async (req, res) => {
  try {
    const { reflection } = req.body;

    if (!reflection || typeof reflection !== "string") {
      return res
        .status(400)
        .json({ error: "reflection (string) is required in the body." });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions:
        "You are a supportive coach for customer communication training. Be encouraging, specific, and practical.",
      input: [
        {
          role: "user",
          content: `
The learner wrote this reflection (1–2 sentences):
"""${reflection}"""

Write a short, motivating coaching response.

Rules:
- 2–4 sentences total
- Start with one genuine affirmation
- Add one specific “why it matters” connection (customer trust, de-escalation, clarity, speed, retention, etc.)
- End with one tiny next step they can try on their next message
- Keep it under 90 words
Return plain text only.
`,
        },
      ],
    });

    return res.json({ feedback: response.output_text });
  } catch (err) {
    console.error("Error in /why-feedback:", err);
    return res.status(500).json({ error: "Failed to generate reflection feedback." });
  }
});

app.listen(port, () => {
  console.log(`Empathy feedback server listening on port ${port}`);
});
