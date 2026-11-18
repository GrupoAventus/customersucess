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
        <svg viewBox="0 0 900 520" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
          <defs>
            <radialGradient id="wolfGlow" cx="50%" cy="90%" r="50%">
              <stop offset="0%" stopColor="#ff6600" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* glow no chão */}
          <ellipse cx="450" cy="510" rx="380" ry="60" fill="url(#wolfGlow)" />

          {/* cauda longa arqueada para cima */}
          <path d="M295 480 Q220 440 190 370 Q170 310 200 265 Q225 230 265 240 Q290 248 295 275" stroke="#cc6600" strokeWidth="22" strokeLinecap="round" fill="none" />
          <path d="M295 275 Q300 260 310 268" stroke="#ff8800" strokeWidth="16" strokeLinecap="round" fill="none" />

          {/* corpo robusto */}
          <path d="M295 480 Q300 390 330 355 Q360 320 390 300 L410 285 L450 272 L490 285 L510 300 Q540 320 570 355 Q600 390 605 480Z" fill="#b05500" />
          {/* pelo do dorso mais claro */}
          <path d="M390 300 Q420 280 450 272 Q480 280 510 300 Q490 285 450 280 Q410 285 390 300Z" fill="#cc6600" />

          {/* pescoço largo */}
          <path d="M408 285 Q428 255 450 245 Q472 255 492 285 Q470 272 450 270 Q430 272 408 285Z" fill="#cc6600" />

          {/* cabeça — forma mais alongada de lobo */}
          <path d="M385 245 Q390 195 420 175 Q435 168 450 166 Q465 168 480 175 Q510 195 515 245 Q500 268 450 272 Q400 268 385 245Z" fill="#c06000" />

          {/* testa/crânio mais largo */}
          <path d="M390 220 Q400 190 450 182 Q500 190 510 220 Q490 205 450 202 Q410 205 390 220Z" fill="#b05500" />

          {/* orelha esquerda — grande, pontiaguda */}
          <path d="M393 215 L355 130 L400 200 Z" fill="#b05500" />
          <path d="M393 215 L365 140 L398 205 Z" fill="#882200" />

          {/* orelha direita */}
          <path d="M507 215 L545 130 L500 200 Z" fill="#b05500" />
          <path d="M507 215 L535 140 L502 205 Z" fill="#882200" />

          {/* focinho comprido e estreito — traço de lobo */}
          <path d="M420 248 Q435 265 450 270 Q465 265 480 248 Q468 280 450 286 Q432 280 420 248Z" fill="#8b3a00" />
          {/* narina/nariz */}
          <ellipse cx="450" cy="258" rx="12" ry="7" fill="#5a2000" />
          <ellipse cx="446" cy="256" rx="3" ry="2" fill="#7a3010" />

          {/* olhos amendoados — agressivos */}
          <path d="M408 228 Q420 220 432 228 Q420 236 408 228Z" fill="#ffe033" />
          <ellipse cx="420" cy="228" rx="7" ry="5" fill="#ffe033" />
          <ellipse cx="420" cy="228" rx="3.5" ry="4.5" fill="#1a0a00" />

          <path d="M468 228 Q480 220 492 228 Q480 236 468 228Z" fill="#ffe033" />
          <ellipse cx="480" cy="228" rx="7" ry="5" fill="#ffe033" />
          <ellipse cx="480" cy="228" rx="3.5" ry="4.5" fill="#1a0a00" />

          {/* pelo do peito */}
          <path d="M420 285 Q435 295 450 298 Q465 295 480 285 Q470 305 450 308 Q430 305 420 285Z" fill="#dd7700" />

          {/* patas dianteiras */}
          <path d="M390 300 Q375 360 368 420 Q362 460 358 490 Q350 505 340 510 Q330 510 325 505" stroke="#b05500" strokeWidth="22" strokeLinecap="round" fill="none" />
          <path d="M368 420 Q355 445 352 490" stroke="#b05500" strokeWidth="18" strokeLinecap="round" fill="none" />
          {/* dedos pata esquerda */}
          <path d="M325 505 Q315 515 310 510" stroke="#8b3a00" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M335 508 Q328 518 322 514" stroke="#8b3a00" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M343 507 Q338 517 333 513" stroke="#8b3a00" strokeWidth="7" strokeLinecap="round" fill="none"/>

          <path d="M510 300 Q525 360 532 420 Q538 460 542 490 Q550 505 560 510 Q570 510 575 505" stroke="#b05500" strokeWidth="22" strokeLinecap="round" fill="none" />
          <path d="M532 420 Q545 445 548 490" stroke="#b05500" strokeWidth="18" strokeLinecap="round" fill="none" />
          {/* dedos pata direita */}
          <path d="M575 505 Q585 515 590 510" stroke="#8b3a00" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M565 508 Q572 518 578 514" stroke="#8b3a00" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M557 507 Q562 517 567 513" stroke="#8b3a00" strokeWidth="7" strokeLinecap="round" fill="none"/>

          {/* patas traseiras */}
          <path d="M360 410 Q345 450 342 490 Q340 505 332 512" stroke="#8b3a00" strokeWidth="20" strokeLinecap="round" fill="none" />
          <path d="M540 410 Q555 450 558 490 Q560 505 568 512" stroke="#8b3a00" strokeWidth="20" strokeLinecap="round" fill="none" />
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
