import { afterEach, describe, expect, it, vi } from 'vitest'

const createMock = vi.fn()

class FakeAuthenticationError extends Error {}
class FakeRateLimitError extends Error {}

vi.mock('@anthropic-ai/sdk', () => {
  class Anthropic {
    constructor() {
      this.messages = { create: createMock }
    }
  }
  Anthropic.AuthenticationError = FakeAuthenticationError
  Anthropic.RateLimitError = FakeRateLimitError
  return { default: Anthropic }
})

const { getAssistantReply } = await import('./aiAssistant')

afterEach(() => {
  createMock.mockReset()
})

describe('getAssistantReply (mocked, no apiKey)', () => {
  it('returns a mocked TNR reply when the message mentions trapping', async () => {
    const { reply, mocked } = await getAssistantReply({
      messages: [{ role: 'user', content: 'How do I trap a cat for TNR?' }],
      apiKey: '',
    })
    expect(mocked).toBe(true)
    expect(reply).toContain('Trap-Neuter-Return')
  })

  it('matches keywords case-insensitively', async () => {
    const { reply } = await getAssistantReply({
      messages: [{ role: 'user', content: 'The KITTEN needs FEEDING' }],
      apiKey: undefined,
    })
    expect(reply).toContain('Feeding a kitten')
  })

  it('falls back to the generic reply when nothing matches', async () => {
    const { reply, mocked } = await getAssistantReply({
      messages: [{ role: 'user', content: 'What is the weather like today?' }],
      apiKey: '',
    })
    expect(mocked).toBe(true)
    expect(reply).toContain("I can help with trap-neuter-return")
  })

  it('replies based on the most recent user message', async () => {
    const { reply } = await getAssistantReply({
      messages: [
        { role: 'user', content: 'kitten feeding question' },
        { role: 'assistant', content: 'Sure, here is info about kittens.' },
        { role: 'user', content: 'actually, how do I approach a skittish cat?' },
      ],
      apiKey: '',
    })
    expect(reply).toContain('Approaching a skittish cat safely')
  })

  it('does not call the Anthropic SDK when no apiKey is provided', async () => {
    await getAssistantReply({ messages: [{ role: 'user', content: 'hello' }], apiKey: '' })
    expect(createMock).not.toHaveBeenCalled()
  })
})

describe('getAssistantReply (live, with apiKey)', () => {
  it('returns the text block from a successful response', async () => {
    createMock.mockResolvedValue({
      content: [{ type: 'text', text: 'Real Claude reply' }],
    })

    const { reply, mocked } = await getAssistantReply({
      messages: [{ role: 'user', content: 'hi' }],
      apiKey: 'sk-ant-test',
    })

    expect(mocked).toBe(false)
    expect(reply).toBe('Real Claude reply')
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to a default message if no text block is present', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'image' }] })

    const { reply } = await getAssistantReply({
      messages: [{ role: 'user', content: 'hi' }],
      apiKey: 'sk-ant-test',
    })

    expect(reply).toBe("Sorry, I couldn't generate a response.")
  })

  it('translates an AuthenticationError into a friendly message', async () => {
    createMock.mockRejectedValue(new FakeAuthenticationError('bad key'))

    await expect(
      getAssistantReply({ messages: [{ role: 'user', content: 'hi' }], apiKey: 'bad' }),
    ).rejects.toThrow('That API key was rejected')
  })

  it('translates a RateLimitError into a friendly message', async () => {
    createMock.mockRejectedValue(new FakeRateLimitError('slow down'))

    await expect(
      getAssistantReply({ messages: [{ role: 'user', content: 'hi' }], apiKey: 'sk-ant-test' }),
    ).rejects.toThrow('Rate limited')
  })

  it('translates any other error into a generic unavailable message', async () => {
    createMock.mockRejectedValue(new Error('network exploded'))

    await expect(
      getAssistantReply({ messages: [{ role: 'user', content: 'hi' }], apiKey: 'sk-ant-test' }),
    ).rejects.toThrow('AI assistant is unavailable')
  })
})
