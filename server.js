// --------- MICRO INTERACTION: /why-feedback-matters ----------
app.post("/why-feedback-matters", async (req, res) => {
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
        "You are a supportive communication coach. Respond with brief, encouraging feedback that reinforces reflection and growth.",
      input: [
        {
          role: "user",
          content: `
A learner reflected on why empathy feedback matters to them:

"""${reflection}"""

Respond with:
1) One sentence affirming the learner’s insight
2) One sentence reinforcing why reflection improves real-world communication
3) One short, motivating closing sentence

Keep the response under 80 words.
Use a warm, human tone.
`,
        },
      ],
    });

    const feedbackText = response.output_text;
    return res.json({ feedback: feedbackText });
  } catch (err) {
    console.error("Error in /why-feedback-matters:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate reflection feedback." });
  }
});
