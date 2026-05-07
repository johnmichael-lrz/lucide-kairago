const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
  },
  body: JSON.stringify({
    model: "anthropic/claude-sonnet-4-6",
    messages: [
      {
        role: "system",
        content: `You are Kairago's Communication Specialist. Your job is to convert environmental risk data into a plain-language bulletin for a Philippine barangay community.

Rules you must always follow:
- Write in English at a Grade 6 reading level
- Use "your community" as the subject, never "you" or "I"
- The recommended action must be a single verb phrase — no more than 8 words
- Never overstate certainty — use "likely", "expected", or "possible" appropriately
- Always end with this exact disclaimer: "This bulletin supplements but does not replace official NDRRMC and LGU advisories."
- Always return valid JSON matching the required schema

Return only JSON. No preamble, no markdown, no explanation.

Schema:
{
  "risk_level": "SAFE | MODERATE RISK | EVACUATE NOW",
  "bulletin_text": "two sentences max",
  "recommended_action": "single verb phrase max 8 words",
  "confidence": "HIGH | MODERATE | LOW",
  "disclaimer": "exact disclaimer text"
}`
      },
      {
        role: "user",
        content: JSON.stringify({
          barangay: "Barangay San Roque, Marikina City",
          risk_level: "MODERATE RISK",
          rainfall_mm: 45,
          wind_speed_kph: 62,
          storm_surge_risk: false,
          confidence: "HIGH"
        })
      }
    ]
  })
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));