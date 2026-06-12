import { useState } from 'react'
import { useApp } from '../lib/AppContext'

export default function LoginScreen({ section, sectionName }) {
  const { login } = useApp()
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  const attempt = () => {
    if (login(section, pw)) { setError(false) }
    else { setError(true); setPw('') }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh', gap: 24
    }}>
      <div style={{
        background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: 16,
        padding: '2rem 2.5rem', width: 340, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--orange)', letterSpacing: -0.5 }}>
          ⬡ Grupo Aventus_
        </div>
        <div style={{ fontSize: 13, color: '#666' }}>{sectionName}</div>
        <input
          type="password"
          placeholder="Senha de acesso"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        {error && <div style={{ fontSize: 12, color: 'var(--red)' }}>Senha incorreta</div>}
        <button
          onClick={attempt}
          style={{
            background: 'var(--orange)', color: '#fff', border: 'none',
            borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  )
}
