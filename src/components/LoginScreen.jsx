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

      {/* Silhueta do lobo — lado esquerdo, em pé de perfil */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        zIndex: 0, opacity: 0.18, pointerEvents: 'none',
        width: '42vw', maxWidth: 560, minWidth: 300,
      }}>
        {/* Silhueta de lobo de perfil — olhando para a direita (para o card de login) */}
        <svg viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
          {/* cauda arqueada para cima — começa na garupa */}
          <path d="M180 460 Q120 400 90 320 Q70 250 100 190 Q118 155 148 160 Q165 164 168 185" fill="none" stroke="#ff8800" strokeWidth="18" strokeLinecap="round"/>

          {/* corpo principal */}
          <path d="M168 460 Q165 390 175 355 Q190 320 220 300 Q255 278 300 268 Q340 260 370 265 Q400 272 415 290 Q430 310 428 345 Q425 390 418 460 Z" fill="#cc6000"/>

          {/* dorso do pescoço até a cabeça */}
          <path d="M220 300 Q240 265 268 240 Q285 225 300 220" fill="none" stroke="#cc6000" strokeWidth="38" strokeLinecap="round"/>
          <path d="M300 268 Q325 255 340 240 Q350 228 350 215" fill="none" stroke="#cc6000" strokeWidth="30" strokeLinecap="round"/>

          {/* cabeça — perfil voltado para direita */}
          {/* crânio */}
          <path d="M295 145 Q300 100 325 85 Q348 72 368 78 Q390 86 400 108 Q410 128 405 155 Q398 175 380 185 Q358 195 335 192 Q308 187 295 165 Z" fill="#c05800"/>
          {/* testa larga */}
          <path d="M295 145 Q302 110 328 97 Q352 86 375 94 Q395 104 400 128 Q390 108 365 100 Q340 95 318 108 Q300 120 295 145Z" fill="#b05000"/>

          {/* orelha — grande, pontiaguda, em pé */}
          <path d="M305 130 L288 55 L330 118 Z" fill="#b05000"/>
          <path d="M307 128 L293 65 L328 120 Z" fill="#7a2800"/>
          {/* segunda orelha (atrás, menor) */}
          <path d="M338 118 L332 58 L358 110 Z" fill="#994400"/>

          {/* focinho longo de lobo — apontado para direita */}
          <path d="M395 155 Q420 158 440 165 Q458 172 462 182 Q465 192 455 198 Q440 204 420 200 Q400 195 390 182 Z" fill="#a04500"/>
          {/* lábio inferior */}
          <path d="M390 182 Q405 190 425 192 Q440 193 452 188 Q445 200 425 204 Q405 204 392 196 Z" fill="#8a3800"/>
          {/* nariz */}
          <ellipse cx="460" cy="178" rx="10" ry="7" fill="#3a1500"/>

          {/* olho amendoado — agressivo */}
          <path d="M370 138 Q385 128 400 136 Q388 148 370 138Z" fill="#ffe033"/>
          <ellipse cx="385" cy="138" rx="10" ry="7" fill="#ffe033"/>
          <ellipse cx="387" cy="138" rx="5" ry="6" fill="#1a0800"/>
          {/* reflexo */}
          <ellipse cx="384" cy="135" rx="2" ry="1.5" fill="#ffffff55"/>

          {/* pelo do peito/gola */}
          <path d="M295 192 Q305 210 318 220 Q300 215 285 225 Q275 232 268 240" fill="none" stroke="#dd7000" strokeWidth="12" strokeLinecap="round"/>
          <path d="M295 192 Q285 215 275 235" fill="none" stroke="#cc6000" strokeWidth="8" strokeLinecap="round"/>

          {/* pata dianteira frente */}
          <path d="M395 300 Q400 360 402 420 Q403 460 400 490 Q398 510 390 520" fill="none" stroke="#b05000" strokeWidth="22" strokeLinecap="round"/>
          {/* pata dianteira trás */}
          <path d="M360 295 Q358 360 355 420 Q352 460 350 490 Q348 510 340 520" fill="none" stroke="#994400" strokeWidth="20" strokeLinecap="round"/>

          {/* dedos pata frente */}
          <path d="M390 520 Q382 535 376 530" fill="none" stroke="#8a3800" strokeWidth="9" strokeLinecap="round"/>
          <path d="M390 520 Q390 538 384 535" fill="none" stroke="#8a3800" strokeWidth="9" strokeLinecap="round"/>
          <path d="M390 520 Q398 536 405 530" fill="none" stroke="#8a3800" strokeWidth="8" strokeLinecap="round"/>

          {/* dedos pata trás */}
          <path d="M340 520 Q332 535 326 530" fill="none" stroke="#8a3800" strokeWidth="9" strokeLinecap="round"/>
          <path d="M340 520 Q340 538 334 535" fill="none" stroke="#8a3800" strokeWidth="9" strokeLinecap="round"/>
          <path d="M340 520 Q348 536 354 530" fill="none" stroke="#8a3800" strokeWidth="8" strokeLinecap="round"/>

          {/* patas traseiras */}
          <path d="M200 400 Q188 440 182 480 Q178 505 172 520" fill="none" stroke="#994400" strokeWidth="22" strokeLinecap="round"/>
          <path d="M172 520 Q164 535 158 530" fill="none" stroke="#8a3800" strokeWidth="9" strokeLinecap="round"/>
          <path d="M172 520 Q172 538 166 535" fill="none" stroke="#8a3800" strokeWidth="9" strokeLinecap="round"/>
          <path d="M172 520 Q180 536 186 530" fill="none" stroke="#8a3800" strokeWidth="8" strokeLinecap="round"/>

          <path d="M240 420 Q232 460 228 490 Q225 508 220 520" fill="none" stroke="#8a3800" strokeWidth="18" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Raios de luz sutis vindos do topo */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 700, height: 500, zIndex: 0, pointerEvents: 'none',
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', top: 0, left: '50%',
            width: 1, height: 400,
            background: 'linear-gradient(to bottom, rgba(255,140,0,0.04), transparent)',
            transformOrigin: 'top center',
            transform: `rotate(${-15 + i * 6}deg)`,
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
