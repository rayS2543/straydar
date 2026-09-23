import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function AuthModal() {
  const { authModalOpen, closeAuthModal, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  if (!authModalOpen) return null

  const reset = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setConfirmSent(false)
  }

  const close = () => {
    closeAuthModal()
    reset()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: authError, data } =
      mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password)
    setSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }
    if (mode === 'sign-up' && !data.session) {
      setConfirmSent(true)
      return
    }
    close()
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-ink">
            {mode === 'sign-in' ? 'Sign in' : 'Create an account'}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-1.5 text-muted hover:bg-card-soft"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {confirmSent ? (
          <p className="text-sm text-muted">
            Check your email to confirm your account, then sign in.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-status-lost">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
            >
              {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
            </button>
          </form>
        )}

        {!confirmSent && (
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'))
              setError(null)
            }}
            className="mt-3 w-full text-center text-xs font-medium text-brand hover:underline"
          >
            {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        )}
      </div>
    </div>
  )
}
