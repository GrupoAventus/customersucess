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

      {/* Silhueta do lobo uivando — lado esquerdo */}
      <div style={{
        position: 'absolute', bottom: 0, left: '-2vw',
        zIndex: 0, opacity: 0.55, pointerEvents: 'none',
        width: '38vw', maxWidth: 520, minWidth: 280,
        filter: 'drop-shadow(0 0 40px rgba(255,120,0,0.25))',
      }}>
        <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
          {/* Pedra / rocha base */}
          <path d="M60 500 Q80 450 110 440 Q140 432 160 438 Q185 445 200 440 Q220 435 240 442 Q265 450 280 460 Q300 472 310 500 Z" fill="#1a0e00"/>
          <path d="M80 500 Q95 458 118 448 Q145 440 165 445 Q188 452 205 448 Q222 443 242 450 Q262 458 275 468 Q288 478 295 500 Z" fill="#2a1500"/>

          {/* Corpo do lobo — silhueta sólida uivando */}
          {/* cauda curvada para frente/baixo */}
          <path d="M148 340 Q118 360 100 390 Q88 412 92 435 Q96 450 110 448" fill="none" stroke="#1a0e00" strokeWidth="22" strokeLinecap="round"/>

          {/* traseiro/garupa */}
          <path d="M148 340 Q152 310 158 290 Q164 270 172 258" fill="none" stroke="#1a0e00" strokeWidth="34" strokeLinecap="round"/>

          {/* corpo central */}
          <path d="M110 440 Q118 400 132 370 Q144 348 158 338 Q170 330 180 320 Q188 310 192 295" fill="none" stroke="#1a0e00" strokeWidth="40" strokeLinecap="round"/>

          {/* barriga/volume do corpo */}
          <path d="M125 430 Q130 395 148 365 Q162 342 175 328 Q186 316 192 300 L200 285 Q205 270 210 255" fill="#1a0e00"/>
          <path d="M110 442 Q122 408 138 378 Q154 350 168 334 Q182 318 192 302 L200 288 Q205 272 212 256 Q188 262 175 278 Q162 294 158 310 Q150 332 142 358 Q130 390 120 426 Z" fill="#1a0e00"/>

          {/* pescoço esticado para cima (uivando) */}
          <path d="M192 300 Q196 270 200 245 Q204 220 208 195 Q210 178 212 160" fill="none" stroke="#1a0e00" strokeWidth="30" strokeLinecap="round"/>

          {/* cabeça virada para cima — uivando */}
          {/* crânio */}
          <path d="M195 165 Q196 130 205 108 Q212 90 222 80 Q232 72 242 74 Q252 76 258 88 Q264 102 260 122 Q256 142 244 158 Q232 172 218 175 Q204 177 195 165Z" fill="#1a0e00"/>

          {/* focinho apontado para cima */}
          <path d="M242 100 Q255 88 265 78 Q274 68 278 60 Q280 52 276 46 Q270 40 262 44 Q254 50 248 62 Q242 74 240 88 Z" fill="#1a0e00"/>

          {/* orelha — pontiaguda, em pé */}
          <path d="M200 148 Q196 118 200 95 Q202 78 210 68 Q216 60 220 65 Q222 72 218 90 Q215 110 212 132 Z" fill="#1a0e00"/>
          {/* segunda orelha menor atrás */}
          <path d="M218 142 Q216 120 220 103 Q224 90 230 85 Q235 82 236 88 Q236 98 232 115 Q228 130 224 142 Z" fill="#1a0e00"/>

          {/* pata dianteira frente — esticada para baixo */}
          <path d="M192 302 Q194 340 196 375 Q197 405 196 435 Q196 448 194 455" fill="none" stroke="#1a0e00" strokeWidth="20" strokeLinecap="round"/>

          {/* pata dianteira traseira */}
          <path d="M176 308 Q174 345 172 378 Q170 408 170 438 Q170 450 168 458" fill="none" stroke="#1a0e00" strokeWidth="18" strokeLinecap="round"/>

          {/* patas traseiras */}
          <path d="M148 362 Q140 390 132 418 Q126 440 122 455" fill="none" stroke="#1a0e00" strokeWidth="20" strokeLinecap="round"/>
          <path d="M160 350 Q155 378 150 408 Q146 432 144 450" fill="none" stroke="#1a0e00" strokeWidth="16" strokeLinecap="round"/>

          {/* glow laranja sutil sob o lobo */}
          <ellipse cx="195" cy="490" rx="80" ry="14" fill="rgba(255,100,0,0.12)"/>
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
