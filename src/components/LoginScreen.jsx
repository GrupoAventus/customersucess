import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/AppContext'

// Canvas de partículas flutuantes
function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.4 + 0.05,
        drift: (Math.random() - 0.5) * 0.3,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 160, 40, ${p.opacity})`
        ctx.fill()
        p.y -= p.speed
        p.x += p.drift
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width }
        if (p.x < -5) p.x = canvas.width + 5
        if (p.x > canvas.width + 5) p.x = -5
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
    />
  )
}

export default function LoginScreen({ section, sectionName, onUnlock }) {
  const { login } = useApp()
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const attempt = () => {
    const result = login(section, pw)
    if (result) {
      setError(false)
      if (onUnlock) onUnlock(result)
    } else {
      setError(true)
      setPw('')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', background: '#000',
    }}>
      {/* Fundo — lobo em SVG/gradiente temático */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 50% 60%, rgba(180, 80, 0, 0.18) 0%, transparent 70%),
          radial-gradient(ellipse 100% 100% at 50% 100%, rgba(255, 120, 0, 0.08) 0%, transparent 60%),
          linear-gradient(180deg, #000 0%, #0a0500 40%, #120800 70%, #0a0400 100%)
        `,
      }} />

      {/* Névoa laranja na base */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', zIndex: 0,
        background: 'linear-gradient(to top, rgba(255,100,0,0.07) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Silhueta do lobo — SVG geométrico estilizado */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        zIndex: 0, opacity: 0.07, pointerEvents: 'none',
        width: '100vw', maxWidth: 900,
      }}>
        <svg viewBox="0 0 900 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
          <ellipse cx="450" cy="480" rx="420" ry="80" fill="url(#glow)" />
          {/* corpo */}
          <path d="M310 500 Q320 400 360 360 Q380 340 400 320 L440 280 L460 280 L500 320 Q520 340 540 360 Q580 400 590 500Z" fill="#ff8800" />
          {/* pescoço */}
          <path d="M400 320 Q420 290 450 275 Q480 290 500 320 L460 280 Z" fill="#ff9900" />
          {/* cabeça */}
          <path d="M390 275 Q400 220 450 200 Q500 220 510 275 Q490 300 450 305 Q410 300 390 275Z" fill="#ffaa00" />
          {/* orelhas */}
          <path d="M395 240 L370 180 L410 230Z" fill="#ff8800" />
          <path d="M505 240 L530 180 L490 230Z" fill="#ff8800" />
          {/* focinho */}
          <path d="M430 275 Q450 290 470 275 L460 295 Q450 300 440 295Z" fill="#cc6600" />
          {/* olhos */}
          <ellipse cx="430" cy="250" rx="8" ry="6" fill="#ffe066" />
          <ellipse cx="470" cy="250" rx="8" ry="6" fill="#ffe066" />
          {/* pernas */}
          <path d="M360 420 Q350 460 345 500" stroke="#ff8800" strokeWidth="18" strokeLinecap="round" fill="none" />
          <path d="M390 430 Q385 470 382 500" stroke="#ff8800" strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M540 420 Q550 460 555 500" stroke="#ff8800" strokeWidth="18" strokeLinecap="round" fill="none" />
          <path d="M510 430 Q515 470 518 500" stroke="#ff8800" strokeWidth="16" strokeLinecap="round" fill="none" />
          {/* cauda */}
          <path d="M310 500 Q250 450 230 390 Q220 350 260 320 Q290 310 310 340" stroke="#ff8800" strokeWidth="14" strokeLinecap="round" fill="none" />
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff6600" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Raios de luz vindos do centro */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        width: 600, height: 600, zIndex: 0, pointerEvents: 'none',
      }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 2, height: 300,
            background: 'linear-gradient(to bottom, rgba(255,140,0,0.06), transparent)',
            transformOrigin: 'top center',
            transform: `rotate(${i * 45}deg)`,
          }} />
        ))}
      </div>

      {/* Partículas */}
      <ParticleCanvas />

      {/* Card de login */}
      <div
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 32, width: '100%', maxWidth: 400, padding: '0 24px',
        }}
      >
        {/* Logo AVENTUS */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 42, fontWeight: 900, letterSpacing: '0.18em',
            lineHeight: 1,
            fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
          }}>
            <span style={{
              color: '#ff8c00',
              textShadow: '0 0 30px rgba(255,140,0,0.8), 0 0 60px rgba(255,100,0,0.4)',
            }}>A</span>
            <span style={{
              color: '#fff',
              textShadow: '0 0 20px rgba(255,255,255,0.15)',
            }}>VENTUS</span>
          </div>
          <div style={{
            fontSize: 10, color: '#ff8c0066', letterSpacing: '0.35em',
            textTransform: 'uppercase', marginTop: 6, fontWeight: 500,
          }}>
            Customer Success Platform
          </div>
          {/* Linha decorativa */}
          <div style={{
            margin: '12px auto 0',
            width: 48, height: 1,
            background: 'linear-gradient(90deg, transparent, #ff8c0088, transparent)',
          }} />
        </div>

        {/* Painel de login */}
        <div style={{
          width: '100%',
          background: 'rgba(10, 6, 2, 0.85)',
          border: '1px solid rgba(255, 140, 0, 0.15)',
          borderRadius: 16,
          padding: '28px 28px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(255, 100, 0, 0.08), 0 20px 40px rgba(0,0,0,0.6)',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}>
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0) }
              15% { transform: translateX(-8px) }
              45% { transform: translateX(8px) }
              75% { transform: translateX(-5px) }
            }
            @keyframes pulseGlow {
              0%, 100% { box-shadow: 0 0 0 0 rgba(255,140,0,0.15) }
              50% { box-shadow: 0 0 0 4px rgba(255,140,0,0.08) }
            }
            .login-input {
              width: 100%;
              background: rgba(255,255,255,0.03);
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 10px;
              padding: 12px 14px;
              color: #fff;
              font-size: 14px;
              outline: none;
              transition: border-color 0.2s, box-shadow 0.2s;
              box-sizing: border-box;
              letter-spacing: 0.08em;
            }
            .login-input:focus {
              border-color: rgba(255, 140, 0, 0.5);
              box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.08);
            }
            .login-input::placeholder { color: #444; letter-spacing: 0.04em; }
            .login-btn {
              width: 100%;
              background: linear-gradient(135deg, #ff8c00, #e06000);
              border: none;
              border-radius: 10px;
              padding: 13px;
              color: #000;
              font-size: 13px;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              cursor: pointer;
              transition: opacity 0.15s, transform 0.1s, box-shadow 0.2s;
              box-shadow: 0 4px 20px rgba(255, 140, 0, 0.3);
            }
            .login-btn:hover {
              opacity: 0.92;
              box-shadow: 0 4px 30px rgba(255, 140, 0, 0.5);
              transform: translateY(-1px);
            }
            .login-btn:active { transform: translateY(0); opacity: 0.85; }
          `}</style>

          {/* Seção acessada */}
          <div style={{
            fontSize: 11, color: '#ff8c0077',
            fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ color: '#ff8c0044' }}>⬡</span>
            {sectionName || 'Acesso restrito'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              ref={inputRef}
              className="login-input"
              type="password"
              placeholder="Senha de acesso"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(false) }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
            />

            {error && (
              <div style={{
                fontSize: 11, color: '#e24b4a',
                display: 'flex', alignItems: 'center', gap: 5,
                animation: 'fadeIn 0.2s ease',
              }}>
                <span>⚠</span> Senha incorreta. Tente novamente.
              </div>
            )}

            <button className="login-btn" onClick={attempt}>
              Entrar
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{
          fontSize: 10, color: '#ffffff15', letterSpacing: '0.1em',
          textAlign: 'center',
        }}>
          © {new Date().getFullYear()} Grupo Aventus · Todos os direitos reservados
        </div>
      </div>
    </div>
  )
}
