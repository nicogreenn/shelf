'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ShelfApp from '@/components/ShelfApp'

export default function Page() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async () => {
    setError('')
    const { error: e } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (e) setError(e.message)
  }

  if (loading) return <div style={{ background: '#f9f6ef', minHeight: '100vh' }} />
  if (user) return <ShelfApp user={user} onSignOut={() => supabase.auth.signOut()} />

  return (
    <div style={{ background: '#f9f6ef', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: 360, padding: 24, boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🌿</div>
          <div style={{ fontSize: 36, fontFamily: "'Lora',serif", fontWeight: 700, background: 'linear-gradient(135deg,#2d6a2d,#f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>Shelf</div>
          <div style={{ fontSize: 12, color: '#7a7560', letterSpacing: 3, textTransform: 'uppercase' }}>Hips Social · Stock Manager</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e0d8c4', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <input
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', background: '#f9f6ef', border: '1px solid #e0d8c4', borderRadius: 12, color: '#1a1a0a', fontFamily: 'inherit', fontSize: 15, padding: '13px 14px', marginBottom: 12, outline: 'none' }}
          />
          <input
            type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ width: '100%', boxSizing: 'border-box', background: '#f9f6ef', border: '1px solid #e0d8c4', borderRadius: 12, color: '#1a1a0a', fontFamily: 'inherit', fontSize: 15, padding: '13px 14px', marginBottom: error ? 12 : 20, outline: 'none' }}
          />
          {error && <div style={{ fontSize: 12, color: '#d62828', marginBottom: 12 }}>{error}</div>}
          <button onClick={handleSubmit}
            style={{ width: '100%', background: 'linear-gradient(135deg,#2d6a2d,#3d8a3d)', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, padding: '14px 16px', marginBottom: 12 }}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{ width: '100%', background: 'none', border: 'none', color: '#7a7560', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}