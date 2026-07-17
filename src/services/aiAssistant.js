import Anthropic from '@anthropic-ai/sdk'

export const SYSTEM_PROMPT =
  'You are a specialized animal rescue AI. Provide instructions on: how to trap-neuter-return (TNR), ' +
  'how to approach a skittish cat safely, what to feed a kitten, and when a wound requires urgent ' +
  'veterinary care. Always advise professional help for severe medical emergencies.'

const MODEL = 'claude-opus-4-8'

const CANNED_RESPONSES = [
  {
    keywords: ['tnr', 'trap', 'neuter', 'spay', 'colony'],
    reply:
      "**Trap-Neuter-Return (TNR) basics:**\n" +
      "1. Withhold food for 12-24 hours before trapping so the cat is motivated to enter the trap.\n" +
      "2. Line the trap with newspaper and set it on a flat, stable surface, bait at the back.\n" +
      "3. Cover the trap with a towel once the cat is caught to keep it calm — don't handle the cat directly.\n" +
      "4. Take it to a low-cost spay/neuter clinic or TNR program as soon as possible (ideally same day).\n" +
      "5. After surgery, let the cat recover in the trap in a quiet, temperature-controlled space for 24-48 hours before releasing it back to its original location.\n\n" +
      "Look for a local TNR or feral cat organization — many lend traps and offer free/reduced-cost surgery.",
  },
  {
    keywords: ['approach', 'skittish', 'scared', 'shy', 'feral', 'afraid'],
    reply:
      "**Approaching a skittish cat safely:**\n" +
      "- Get low (crouch or sit) and avoid direct eye contact — a slow blink can signal you're not a threat.\n" +
      "- Stay quiet, move slowly, and let the cat approach you rather than reaching for it.\n" +
      "- Offer food a short distance away and gradually decrease the distance over multiple visits.\n" +
      "- Never corner or chase a scared cat — this increases the risk of a scratch/bite and erodes trust.\n" +
      "- If the cat is truly feral (never socialized), it may never want to be handled — that's okay; feeding and TNR are still valuable ways to help.",
  },
  {
    keywords: ['kitten', 'feed', 'formula', 'wean', 'nurse', 'nursing'],
    reply:
      "**Feeding a kitten:**\n" +
      "- Under 4 weeks old: needs kitten milk replacer (KMR) via bottle, never cow's milk — ask a vet or shelter for guidance on amounts/schedule.\n" +
      "- 4-5 weeks: start introducing wet kitten food mixed with a little KMR into a gruel.\n" +
      "- 6-8 weeks: transition to solid wet/dry kitten food, weaned off the bottle.\n" +
      "- Keep kittens warm — they can't regulate body temperature well until several weeks old.\n" +
      "- If you find a kitten alone, watch from a distance first — the mother may just be out foraging and could return.",
  },
  {
    keywords: ['wound', 'injury', 'bleeding', 'limp', 'limping', 'hurt', 'emergency', 'sick', 'urgent'],
    reply:
      "**When a wound needs urgent vet care:**\n" +
      "- Any active, uncontrolled bleeding, deep puncture wounds, or visible bone/muscle — go to an emergency vet immediately.\n" +
      "- Difficulty breathing, collapse, seizures, or suspected poisoning are always emergencies.\n" +
      "- Limping, swelling, or a wound that's more than superficial should be checked within 24 hours even if the cat seems otherwise okay.\n" +
      "- For minor scrapes, keep the area clean and monitor for signs of infection (swelling, discharge, worsening pain).\n\n" +
      "**This is general guidance only — when in doubt, contact a vet or emergency clinic right away. Don't wait if the cat's condition is severe.**",
  },
]

const FALLBACK_REPLY =
  "I can help with trap-neuter-return (TNR), safely approaching a skittish cat, feeding a kitten, " +
  "or figuring out whether a wound needs urgent vet care — ask me about any of those. " +
  "For a severe or worsening medical emergency, please contact a vet or emergency animal clinic right away."

function mockReply(userMessage) {
  const lower = userMessage.toLowerCase()
  const match = CANNED_RESPONSES.find((entry) =>
    entry.keywords.some((keyword) => lower.includes(keyword)),
  )
  return match ? match.reply : FALLBACK_REPLY
}

// messages: [{ role: 'user' | 'assistant', content: string }]
export async function getAssistantReply({ messages, apiKey }) {
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    return { reply: mockReply(lastUser?.content ?? ''), mocked: true }
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map(({ role, content }) => ({ role, content })),
    })
    const textBlock = response.content.find((block) => block.type === 'text')
    return { reply: textBlock?.text ?? "Sorry, I couldn't generate a response.", mocked: false }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('That API key was rejected. Double-check it and try again.')
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error('Rate limited — please wait a moment and try again.')
    }
    throw new Error('The AI assistant is unavailable right now. Please try again shortly.')
  }
}
