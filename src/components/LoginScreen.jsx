import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/AppContext'
import wolfImg from '../assets/wolf.png'

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

// SVG do lobo — silhueta howling wolf profissional
function WolfSilhouette() {
  return (
    <svg
      viewBox="0 0 500 700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Rocha base */}
      <path
        d="M50 700 C80 640 130 610 180 605 C220 600 260 608 300 605 C345 602 390 615 430 640 C460 658 480 680 490 700 Z"
        fill="currentColor"
      />
      <path
        d="M100 700 C125 650 165 628 200 624 C235 620 270 628 305 625 C340 622 375 635 405 655 C428 670 445 685 455 700 Z"
        fill="currentColor"
        opacity="0.7"
      />

      {/* Cauda — arqueada para cima e para frente */}
      <path
        d="M200 480 C170 460 145 435 130 405 C115 375 112 345 120 320 C128 295 142 282 148 285"
        fill="none"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Patas traseiras */}
      <path
        d="M210 510 C205 540 198 575 193 610 C190 630 188 650 186 670 C185 680 184 690 183 700"
        fill="none"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path
        d="M235 505 C232 535 228 568 225 600 C222 625 220 648 219 670 C218 683 218 692 217 700"
        fill="none"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
      />

      {/* Corpo — volume principal */}
      <path
        d="M148 288 C142 310 148 340 158 370 C168 400 185 425 200 450 C210 468 220 482 228 495 L248 495 C260 480 272 462 282 442 C298 412 308 380 310 350 C312 320 305 292 295 272 C285 252 270 238 255 232 C240 226 225 228 212 236 C198 244 188 262 180 278 C170 294 158 288 148 288 Z"
        fill="currentColor"
      />

      {/* Barriga */}
      <path
        d="M165 460 C170 420 180 385 195 358 C205 340 215 328 225 322"
        fill="none"
        stroke="currentColor"
        strokeWidth="38"
        strokeLinecap="round"
      />

      {/* Patas dianteiras */}
      <path
        d="M228 495 C226 530 224 565 222 598 C220 625 219 650 218 672 C217 684 217 693 216 700"
        fill="none"
        stroke="currentColor"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M248 495 C250 530 252 565 254 598 C255 625 256 650 256 672 C256 684 256 693 256 700"
        fill="none"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
      />

      {/* Pescoço esticado — uivando */}
      <path
        d="M212 236 C210 210 210 185 212 160 C214 138 218 118 225 100 C230 86 236 76 242 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="38"
        strokeLinecap="round"
      />
      <path
        d="M255 232 C258 206 260 180 260 155 C260 132 258 112 254 94 C250 80 244 68 238 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="30"
        strokeLinecap="round"
      />

      {/* Cabeça — virada para cima, uivando */}
      <path
        d="M220 68 C210 50 205 30 210 15 C214 4 222 -2 232 2 C242 6 250 18 254 34 C258 50 256 68 250 82 C244 94 236 102 228 104 C220 106 214 100 210 92 C206 84 208 74 212 68 Z"
        fill="currentColor"
      />

      {/* Focinho — apontado para cima */}
      <path
        d="M238 60 C244 44 252 28 262 16 C270 6 278 0 284 2 C290 4 292 14 288 26 C284 38 274 50 264 58 C256 64 248 66 242 64 Z"
        fill="currentColor"
      />

      {/* Orelha esquerda — bem pontiaguda */}
      <path
        d="M212 70 C208 52 206 32 210 16 C212 6 216 0 220 0 C224 0 226 8 226 20 C226 36 222 56 218 70 Z"
        fill="currentColor"
      />

      {/* Orelha direita */}
      <path
        d="M228 66 C226 50 228 32 232 18 C234 8 238 2 242 4 C246 6 246 16 244 28 C242 44 238 60 234 68 Z"
        fill="currentColor"
      />

      {/* Boca aberta — uivando */}
      <path
        d="M252 50 C258 42 266 36 272 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
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
      {/* Fundo escuro com gradiente */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 50% 80%, rgba(180, 80, 0, 0.14) 0%, transparent 70%),
          linear-gradient(180deg, #000 0%, #080400 40%, #100700 70%, #080400 100%)
        `,
      }} />

      {/* Névoa laranja na base */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', zIndex: 0,
        background: 'linear-gradient(to top, rgba(255,100,0,0.06) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* LOBO — imagem real, lado esquerdo, ocupa 1º terço, base rente ao fundo */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'none',
        width: '38vw',
        maxWidth: 580,
        minWidth: 260,
        display: 'flex',
        alignItems: 'flex-end',
      }}>
        <img
          src={wolfImg}
          alt=""
          style={{
            width: '100%',
            display: 'block',
            opacity: 0.55,
            filter: 'drop-shadow(0 0 40px rgba(255,100,0,0.2))',
          }}
        />
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

      {/* Card de login — z acima do lobo */}
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
          <div style={{
            margin: '12px auto 0',
            width: 48, height: 1,
            background: 'linear-gradient(90deg, transparent, #ff8c0088, transparent)',
          }} />
        </div>

        {/* Painel de login */}
        <div style={{
          width: '100%',
          background: 'rgba(10, 6, 2, 0.88)',
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
