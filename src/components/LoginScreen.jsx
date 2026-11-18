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

const WOLF_PATH = "M 318.5 131.5 L 318.5 133.6 L 314.4 137.7 L 312.3 143.8 L 308.2 150.0 L 300.0 158.2 L 293.8 160.3 L 291.8 162.3 L 289.7 166.4 L 283.6 182.9 L 269.2 195.2 L 267.1 197.3 L 261.0 207.5 L 269.2 209.6 L 269.2 213.7 L 267.1 217.8 L 263.0 221.9 L 256.8 224.0 L 248.6 230.1 L 240.4 240.4 L 238.4 246.6 L 236.3 248.6 L 234.2 248.6 L 230.1 252.7 L 219.9 256.8 L 209.6 263.0 L 193.2 279.5 L 189.0 281.5 L 184.9 283.6 L 164.4 289.7 L 150.0 291.8 L 143.8 293.8 L 133.6 304.1 L 129.5 306.2 L 121.2 308.2 L 113.0 312.3 L 98.6 326.7 L 90.4 341.1 L 84.2 349.3 L 76.0 359.6 L 61.6 374.0 L 55.5 376.0 L 55.5 380.1 L 51.4 384.2 L 47.3 386.3 L 37.0 388.4 L 26.7 388.4 L 16.4 386.3 L 10.3 384.2 L 6.2 382.2 L 10.3 390.4 L 12.3 396.6 L 20.5 404.8 L 24.7 406.8 L 28.8 408.9 L 41.1 411.0 L 45.2 417.1 L 63.7 417.1 L 69.9 415.1 L 74.0 413.0 L 78.1 411.0 L 90.4 400.7 L 98.6 390.4 L 100.7 396.6 L 98.6 400.7 L 96.6 404.8 L 86.3 413.0 L 82.2 425.3 L 82.2 435.6 L 80.1 445.9 L 76.0 456.2 L 71.9 466.4 L 67.8 470.5 L 67.8 495.2 L 59.6 497.3 L 51.4 497.3 L 39.0 509.6 L 26.7 517.8 L 22.6 521.9 L 20.5 528.1 L 16.4 548.6 L 12.3 561.0 L 6.2 579.5 L 0.0 589.7 L 0.0 593.8 L -2.1 597.9 L 419.2 597.9 L 417.1 583.6 L 415.1 573.3 L 413.0 565.1 L 411.0 561.0 L 408.9 556.8 L 398.6 546.6 L 396.6 542.5 L 392.5 532.2 L 390.4 515.8 L 384.2 503.4 L 365.8 484.9 L 355.5 476.7 L 343.2 478.8 L 339.0 476.7 L 337.0 464.4 L 334.9 460.3 L 330.8 454.1 L 306.2 429.5 L 300.0 425.3 L 295.9 425.3 L 291.8 423.3 L 287.7 415.1 L 287.7 378.1 L 289.7 371.9 L 291.8 367.8 L 297.9 361.6 L 300.0 357.5 L 302.1 353.4 L 304.1 345.2 L 304.1 328.8 L 306.2 324.7 L 314.4 316.4 L 318.5 310.3 L 322.6 304.1 L 328.8 291.8 L 330.8 285.6 L 332.9 279.5 L 334.9 271.2 L 337.0 258.9 L 337.0 230.1 L 334.9 193.2 L 339.0 162.3 L 339.0 147.9 L 337.0 143.8 L 330.8 137.7 L 328.8 129.5 Z M 133.6 411.0 L 139.7 413.0 L 139.7 423.3 L 137.7 431.5 L 131.5 439.7 L 131.5 454.1 L 133.6 456.2 L 133.6 468.5 L 129.5 476.7 L 123.3 476.7 L 117.1 478.8 L 104.8 484.9 L 92.5 489.0 L 86.3 487.0 L 86.3 474.7 L 90.4 464.4 L 94.5 460.3 L 98.6 450.0 L 98.6 445.9 L 102.7 435.6 L 104.8 431.5 L 113.0 423.3 Z M 258.9 363.7 L 265.1 365.8 L 267.1 371.9 L 267.1 388.4 L 269.2 390.4 L 267.1 406.8 L 267.1 415.1 L 269.2 425.3 L 256.8 429.5 L 250.7 427.4 L 248.6 423.3 L 248.6 388.4 L 252.7 365.8 Z M 199.3 363.7 L 205.5 363.7 L 207.5 365.8 L 215.8 365.8 L 228.1 369.9 L 230.1 374.0 L 230.1 388.4 L 226.0 411.0 L 226.0 425.3 L 230.1 429.5 L 232.2 433.6 L 230.1 439.7 L 226.0 441.8 L 215.8 441.8 L 197.3 447.9 L 168.5 464.4 L 164.4 466.4 L 160.3 468.5 L 152.1 466.4 L 150.0 452.1 L 150.0 443.8 L 152.1 439.7 L 154.1 437.7 L 160.3 435.6 L 170.5 427.4 L 172.6 425.3 L 180.8 415.1 L 184.9 408.9 L 187.0 404.8 L 193.2 386.3 L 195.2 376.0 L 195.2 367.8 Z"

// Canvas que desenha o ponto dourado com cauda correndo pelo contorno do lobo
function GoldenDotCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // viewBox original: 437x600
    // Canvas renderiza em 437x600 e o CSS escala
    const VW = 437
    const VH = 600
    canvas.width = VW
    canvas.height = VH

    // Extrai os pontos do contorno principal do WOLF_PATH
    // Pega apenas o primeiro sub-path (até o primeiro "M ... Z M")
    // O contorno principal é o maior (lobo inteiro)
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    pathEl.setAttribute('d', WOLF_PATH)

    // Usa SVGPathElement.getTotalLength() e getPointAtLength() para amostrar pontos
    // Cria um SVG temporário no DOM para usar essas APIs
    const svgNS = 'http://www.w3.org/2000/svg'
    const tmpSvg = document.createElementNS(svgNS, 'svg')
    tmpSvg.setAttribute('viewBox', '0 0 437 600')
    tmpSvg.style.position = 'absolute'
    tmpSvg.style.opacity = '0'
    tmpSvg.style.pointerEvents = 'none'
    tmpSvg.style.width = '1px'
    tmpSvg.style.height = '1px'
    document.body.appendChild(tmpSvg)

    // Separa os sub-paths do WOLF_PATH — pega apenas o externo (maior)
    // O path tem 4 sub-paths separados por "M ... Z M"
    // Vamos pegar apenas o primeiro, que é o contorno externo do lobo
    const subPaths = WOLF_PATH.split(/ (?=M )/)
    // Cria path só com o primeiro sub-path (contorno principal)
    const mainPathEl = document.createElementNS(svgNS, 'path')
    mainPathEl.setAttribute('d', subPaths[0])
    tmpSvg.appendChild(mainPathEl)

    const totalLen = mainPathEl.getTotalLength()
    // Amostra ~600 pontos ao longo do contorno
    const SAMPLES = 600
    const pts = []
    for (let i = 0; i <= SAMPLES; i++) {
      const p = mainPathEl.getPointAtLength((i / SAMPLES) * totalLen)
      pts.push({ x: p.x, y: p.y })
    }

    document.body.removeChild(tmpSvg)

    // Animação: ponto percorre os pts em loop
    const TAIL_STEPS = 40   // quantos pontos de cauda
    const SPEED = 1.2       // pontos por frame (ajusta velocidade)
    let pos = 0

    const draw = () => {
      ctx.clearRect(0, 0, VW, VH)

      // Desenha cauda — delicada, fina, dourada
      for (let i = 0; i < TAIL_STEPS; i++) {
        const idx = Math.floor(pos - i + pts.length) % pts.length
        const p = pts[idx]
        const t = 1 - i / TAIL_STEPS          // 1 na ponta, 0 no fim
        const alpha = t * t * 0.9              // cai suavemente (quadrático)
        const size = t * 1.8 + 0.2            // muito fina: 0.2 → 2.0px

        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        // Dourado puro: ouro → âmbar, sem laranja
        const g = Math.round(180 + t * 75)    // 180 → 255
        const b = Math.round(t * 40)           // leve brilho azulado na ponta
        ctx.fillStyle = `rgba(255,${g},${b},${alpha})`
        ctx.fill()
      }

      // Desenha ponto principal com glow triplo
      const head = pts[Math.floor(pos) % pts.length]

      // Halo externo grande — difuso
      const halo = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 18)
      halo.addColorStop(0,   'rgba(255, 230, 60, 0.45)')
      halo.addColorStop(0.5, 'rgba(255, 180, 0, 0.18)')
      halo.addColorStop(1,   'rgba(255, 120, 0, 0)')
      ctx.beginPath()
      ctx.arc(head.x, head.y, 18, 0, Math.PI * 2)
      ctx.fillStyle = halo
      ctx.fill()

      // Glow médio — dourado intenso
      const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 7)
      glow.addColorStop(0,   'rgba(255, 255, 180, 1)')
      glow.addColorStop(0.4, 'rgba(255, 210, 0, 0.9)')
      glow.addColorStop(1,   'rgba(255, 140, 0, 0)')
      ctx.beginPath()
      ctx.arc(head.x, head.y, 7, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Núcleo — branco quente minúsculo
      ctx.beginPath()
      ctx.arc(head.x, head.y, 1.6, 0, Math.PI * 2)
      ctx.fillStyle = '#fffde0'
      ctx.fill()

      pos = (pos + SPEED) % pts.length
    }

    let animId
    const loop = () => {
      draw()
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}

// SVG vetorizado do lobo real + ponto dourado com cauda correndo pelo contorno
function WolfSilhouette() {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox="0 0 437 600" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
        {/* Silhueta base */}
        <path fillRule="evenodd" fill="#1a0800" fillOpacity="0.95" d={WOLF_PATH} />
      </svg>
      {/* Canvas com o ponto dourado correndo pelo contorno */}
      <GoldenDotCanvas />
    </div>
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

      {/* LOBO vetorizado — grandão, lado esquerdo, translúcido com brilho e fumaça */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '-2vw',
        zIndex: 2,
        pointerEvents: 'none',
        width: '48vw',
        maxWidth: 700,
        minWidth: 300,
        opacity: 0.45,
        filter: 'drop-shadow(0 0 60px rgba(255,120,0,0.2))',
      }}>
        <WolfSilhouette />
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
