const TIMEOUT_MS = 10000

// fetch() + JSON with a timeout and readable error messages, shared by every API we call.
export async function requestJson(url, options = {}) {
  // Abort if the API hangs, so the user gets an error instead of waiting forever.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (res.status === 429) throw new Error('Too many requests, wait a few seconds and try again.')
    if (!res.ok) throw new Error(`API error (${res.status})`)
    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The API took too long to answer. Try again.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}
