import { useState } from 'react'

const STORAGE_KEY = 'straydar.anthropicApiKey'

// Reads/writes the user's own Anthropic API key to localStorage only.
// Never hardcoded, never sent anywhere but directly to Anthropic's API.
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')

  const setApiKey = (value) => {
    setApiKeyState(value)
    if (value) {
      localStorage.setItem(STORAGE_KEY, value)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return { apiKey, setApiKey }
}
