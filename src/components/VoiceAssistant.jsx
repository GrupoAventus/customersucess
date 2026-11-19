import { useCallback, useEffect, useRef, useState } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'

// Assistente de voz "JARVIS" (ElevenLabs Agents)
// Consulta painel/demandas/agenda via Apps Script (action=getAssistantContext).
const AGENT_ID = 'agent_9501m7sy3cdaf3t9j0n6bqvb18yf'

const CYAN = [57, 208, 255]
const ORANGE = [255, 107, 26]
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

const STATUS_LABEL = {
  connecting: 'INICIALIZANDO SISTEMAS',
  speaking: 'FALANDO',
  listening: 'OUVINDO',
  error: 'FALHA NA CONEXÃO',
  disconnected: 'OFFLINE',
}

function JarvisCanvas({ conv, mode }) {
  const ref = useRef(null)
  const convRef = useRef(conv)
  const modeRef = useRef(mode)
  convRef.current = conv
  modeRef.current = mode

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf, w, h, dpr
    const particles = Array.from({ length: 140 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.9 + Math.random() * 1.6,
      s: (Math.random() * 0.4 + 0.1) * (Math.random() < 0.5 ? -1 : 1),
      z: Math.random() * 1.5 + 0.5,
    }))
    let level = 0
    const t0 = performance.now()

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const safe = (fn, fallback) => { try { return fn() } catch { return fallback } }

    const draw = (now) => {
      const t = (now - t0) / 1000
      const c = convRef.current
      const speaking = modeRef.current === 'speaking'
      const out = safe(() => c.getOutputVolume(), 0) || 0
      const inp = safe(() => c.getInputVolume(), 0) || 0
      const freq = safe(() => (speaking ? c.getOutputByteFrequencyData() : c.getInputByteFrequencyData()), null)
      const target = Math.min(1, speaking ? out * 1.6 : inp * 1.2)
      level += (target - level) * 0.18
      const breath = 0.5 + 0.5 * Math.sin(t * 1.6)
      const col = speaking ? CYAN : [Math.round(CYAN[0] + (ORANGE[0] - CYAN[0]) * 0.25), 190, 235]

      ctx.clearRect(0, 0, w, h)
      const cx = w / 2, cy = h / 2
      const R = Math.min(w, h) * 0.16

      // halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * (3.2 + level * 1.2))
      halo.addColorStop(0, rgba(col, 0.28 + level * 0.25))
      halo.addColorStop(0.4, rgba(col, 0.08 + level * 0.08))
      halo.addColorStop(1, rgba(col, 0))
      ctx.fillStyle = halo
      ctx.beginPath(); ctx.arc(cx, cy, R * 4.5, 0, Math.PI * 2); ctx.fill()

      ctx.globalCompositeOperation = 'lighter'

      // anéis rotativos tracejados
      const rings = [
        { r: 1.95, wdt: 1.2, dash: [2, 10], sp: 0.15, a: 0.55 },
        { r: 1.75, wdt: 6, dash: [60, 18, 8, 18], sp: -0.32, a: 0.35 },
        { r: 1.58, wdt: 1.5, dash: [140, 40], sp: 0.55, a: 0.7 },
        { r: 2.25, wdt: 2.5, dash: [4, 6], sp: -0.08, a: 0.25 },
        { r: 2.6, wdt: 1, dash: [220, 60, 30, 60], sp: 0.12, a: 0.3 },
      ]
      rings.forEach((g, i) => {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(t * g.sp * (1 + level * 1.5) + i)
        ctx.setLineDash(g.dash)
        ctx.lineWidth = g.wdt
        ctx.strokeStyle = rgba(col, g.a * (0.7 + level * 0.6))
        ctx.shadowColor = rgba(col, 0.9); ctx.shadowBlur = 12
        ctx.beginPath(); ctx.arc(0, 0, R * g.r * (1 + level * 0.06), 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
      })

      // arcos HUD laranja
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-t * 0.22)
      ctx.lineWidth = 3; ctx.strokeStyle = rgba(ORANGE, 0.55 + level * 0.4)
      ctx.shadowColor = rgba(ORANGE, 1); ctx.shadowBlur = 16
      for (let k = 0; k < 3; k++) {
        const a0 = k * (Math.PI * 2 / 3)
        ctx.beginPath(); ctx.arc(0, 0, R * 2.05, a0, a0 + 0.55 + level * 0.5); ctx.stroke()
      }
      ctx.restore()

      // espectro circular
      const bars = 120
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.05)
      ctx.lineCap = 'round'
      for (let i = 0; i < bars; i++) {
        let v = 0
        if (freq && freq.length) {
          const idx = Math.floor(((i < bars / 2 ? i : bars - i) / (bars / 2)) * (freq.length * 0.7))
          v = freq[idx] / 255
        }
        v = Math.max(v, 0.04 + 0.03 * Math.sin(t * 3 + i * 0.4))
        const len = R * (0.08 + v * 0.75)
        const ang = (i / bars) * Math.PI * 2
        const r0 = R * 1.22
        ctx.strokeStyle = rgba(col, 0.35 + v * 0.65)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0)
        ctx.lineTo(Math.cos(ang) * (r0 + len), Math.sin(ang) * (r0 + len))
        ctx.stroke()
      }
      ctx.restore()

      // partículas em órbita
      particles.forEach(p => {
        p.a += p.s * 0.01 * (1 + level * 4)
        const rr = R * (p.r + level * 0.25 * p.z)
        const x = cx + Math.cos(p.a) * rr, y = cy + Math.sin(p.a) * rr * 0.92
        ctx.fillStyle = rgba(col, 0.25 + 0.5 * p.z / 2)
        ctx.beginPath(); ctx.arc(x, y, p.z * (1 + level), 0, Math.PI * 2); ctx.fill()
      })

      // núcleo (reator)
      const coreR = R * (0.55 + 0.05 * breath + level * 0.35)
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
      core.addColorStop(0, 'rgba(255,255,255,0.95)')
      core.addColorStop(0.25, rgba(col, 0.9))
      core.addColorStop(0.7, rgba(col, 0.25))
      core.addColorStop(1, rgba(col, 0))
      ctx.fillStyle = core
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill()

      // triângulo interno
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.4)
      ctx.strokeStyle = rgba([255, 255, 255], 0.35 + level * 0.5); ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let k = 0; k <= 3; k++) {
        const a = k * (Math.PI * 2 / 3) - Math.PI / 2
        const px = Math.cos(a) * R * 0.42, py = Math.sin(a) * R * 0.42
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
      }
      ctx.stroke(); ctx.restore()

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0 }} />
}

function Jarvis() {
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState('')
  const conv = useConversation({
    onError: (msg) => {
      console.error('[JARVIS]', msg)
      setErr('Não consegui me conectar agora, senhor. Toque para voltar e tente de novo em instantes.')
    },
  })
  const { status, mode, startSession, endSession } = conv

  const openJarvis = useCallback(async () => {
    setErr(''); setOpen(true)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      startSession({ agentId: AGENT_ID, connectionType: 'webrtc' })
    } catch (e) {
      setErr('Microfone bloqueado. Libere o acesso ao microfone no navegador.')
    }
  }, [startSession])

  const close = useCallback(() => {
    try { endSession() } catch {}
    setOpen(false)
  }, [endSession])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // Palavra de ativação: "Jarvis" (Web Speech API — Chrome/Edge)
  const [wake, setWake] = useState('off') // off | on | blocked | unsupported
  const openRef = useRef(open)
  openRef.current = open
  const openJarvisRef = useRef(openJarvis)
  openJarvisRef.current = openJarvis
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setWake('unsupported'); return }
    if (open) { setWake('off'); return }
    let stopped = false
    let rec = null
    let retry = null
    let fails = 0
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, ' ')
    const WAKE = /\b(d?jarv[iey]s?|jarb[ia]s|jarvi|garvis|jarves)\b/
    const onGesture = () => { window.removeEventListener('pointerdown', onGesture); if (!stopped) start() }
    const start = () => {
      if (stopped || openRef.current) return
      rec = new SR()
      rec.lang = 'pt-BR'
      rec.continuous = true
      rec.interimResults = true
      rec.onstart = () => { fails = 0; setWake('on') }
      rec.onresult = (e) => {
        let txt = ''
        for (let i = e.resultIndex; i < e.results.length; i++) txt += ' ' + e.results[i][0].transcript
        if (WAKE.test(norm(txt))) {
          stopped = true
          try { rec.abort() } catch {}
          setWake('off')
          openJarvisRef.current()
        }
      }
      rec.onerror = (e) => {
        console.warn('[JARVIS wake]', e.error)
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          // sem permissão ainda: tenta de novo no próximo clique na página
          rec._blocked = true
          setWake('blocked')
          window.addEventListener('pointerdown', onGesture)
        } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
          fails++
        }
      }
      rec.onend = () => {
        if (stopped || rec._blocked) return
        setWake('off')
        retry = setTimeout(start, Math.min(400 * Math.pow(2, fails), 15000))
      }
      try { rec.start() } catch { retry = setTimeout(start, 1500) }
    }
    start()
    return () => {
      stopped = true
      clearTimeout(retry)
      window.removeEventListener('pointerdown', onGesture)
      try { rec && rec.abort() } catch {}
    }
  }, [open])
  const wakeOn = wake === 'on'

  const label = err ? 'FALHA NA CONEXÃO'
    : status === 'connected' ? STATUS_LABEL[mode] || 'ONLINE'
    : STATUS_LABEL[status] || ''

  return (
    <>
      <style>{JARVIS_CSS}</style>
      {!open && (
        <button className="jv-btn" onClick={openJarvis} aria-label="Falar com o JARVIS"
          title={wakeOn ? 'Ouvindo — diga "Jarvis" ou clique' : wake === 'blocked' ? 'Comando de voz sem permissão do microfone — clique na página e permita' : wake === 'unsupported' ? 'Comando de voz só funciona no Chrome ou Edge' : 'Clique para falar com o JARVIS'}>
          <span className="jv-btn-core" />
          <span className="jv-btn-text">JARVIS</span>
          {wakeOn && <span className="jv-wake" />}
          {wake === 'blocked' && <span className="jv-wake off" />}
        </button>
      )}
      {open && (
        <div className="jv-overlay" onClick={close} role="dialog" aria-label="JARVIS">
          <div className="jv-grid" />
          <JarvisCanvas conv={conv} mode={status === 'connected' ? mode : 'idle'} />
          <div className="jv-scan" />
          <div className="jv-top">
            <div className="jv-title">J.A.R.V.I.S.</div>
            <div className="jv-sub">AVENTUS · SISTEMA DE ASSISTÊNCIA PESSOAL</div>
          </div>
          <div className="jv-corner jv-tl" /><div className="jv-corner jv-tr" />
          <div className="jv-corner jv-bl" /><div className="jv-corner jv-br" />
          <div className="jv-bottom">
            <div className={'jv-status' + (status === 'connected' && mode === 'speaking' ? ' on' : '')}>
              <span className="jv-dot" />{label}
            </div>
            {err && <div className="jv-caption">{err}</div>}
            <div className="jv-hint">toque em qualquer lugar para voltar</div>
          </div>
        </div>
      )}
    </>
  )
}

export default function VoiceAssistant() {
  return (
    <ConversationProvider>
      <Jarvis />
    </ConversationProvider>
  )
}

const JARVIS_CSS = `
@keyframes jvPulse { 0%,100% { box-shadow: 0 0 12px rgba(57,208,255,.55), 0 0 30px rgba(57,208,255,.25), inset 0 0 10px rgba(57,208,255,.35) } 50% { box-shadow: 0 0 22px rgba(57,208,255,.9), 0 0 55px rgba(57,208,255,.4), inset 0 0 16px rgba(57,208,255,.6) } }
@keyframes jvSpin { to { transform: rotate(360deg) } }
@keyframes jvIn { from { opacity: 0; transform: scale(1.04) } to { opacity: 1; transform: none } }
@keyframes jvScan { from { transform: translateY(-100%) } to { transform: translateY(100vh) } }
@keyframes jvBlink { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
.jv-btn { position: fixed; right: 22px; bottom: 22px; z-index: 9998; display: flex; align-items: center; gap: 10px;
  padding: 10px 18px 10px 12px; border-radius: 999px; cursor: pointer; background: radial-gradient(120% 140% at 20% 50%, #06202b 0%, #050a0e 70%);
  border: 1px solid rgba(57,208,255,.6); color: #bff1ff; font: 700 13px/1 Inter, system-ui, sans-serif; letter-spacing: .32em;
  animation: jvPulse 2.4s ease-in-out infinite; transition: transform .15s ease }
.jv-btn:hover { transform: translateY(-2px) scale(1.03) }
.jv-btn-core { width: 22px; height: 22px; border-radius: 50%; position: relative;
  background: radial-gradient(circle, #fff 0 18%, #39d0ff 40%, rgba(57,208,255,.1) 70%); box-shadow: 0 0 12px #39d0ff }
.jv-btn-core::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 1.5px dashed rgba(57,208,255,.8); animation: jvSpin 6s linear infinite }
.jv-btn-text { text-shadow: 0 0 8px rgba(57,208,255,.8) }
.jv-wake.off { background: #666; box-shadow: none; animation: none }
.jv-wake { width: 6px; height: 6px; border-radius: 50%; background: #ff6b1a; box-shadow: 0 0 8px #ff6b1a; margin-left: -4px; animation: jvBlink 1.6s infinite }
.jv-overlay { position: fixed; inset: 0; z-index: 9999; cursor: pointer; overflow: hidden; animation: jvIn .45s ease-out;
  background: radial-gradient(ellipse at center, #071a24 0%, #03080c 55%, #000 100%); font-family: Inter, system-ui, sans-serif }
.jv-grid { position: absolute; inset: 0; opacity: .18; background-image:
  linear-gradient(rgba(57,208,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(57,208,255,.25) 1px, transparent 1px);
  background-size: 48px 48px; mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%); -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%) }
.jv-scan { position: absolute; left: 0; right: 0; height: 120px; pointer-events: none;
  background: linear-gradient(to bottom, transparent, rgba(57,208,255,.06), transparent); animation: jvScan 5s linear infinite }
.jv-top { position: absolute; top: 6vh; left: 0; right: 0; text-align: center; pointer-events: none }
.jv-title { color: #d9f6ff; font-weight: 600; font-size: clamp(22px, 3.2vw, 38px); letter-spacing: .6em; padding-left: .6em; text-shadow: 0 0 18px rgba(57,208,255,.9) }
.jv-sub { margin-top: 10px; color: rgba(57,208,255,.65); font-size: 11px; letter-spacing: .35em }
.jv-bottom { position: absolute; bottom: 7vh; left: 16px; right: 16px; display: flex; flex-direction: column; align-items: center; gap: 14px; pointer-events: none }
.jv-status { display: flex; align-items: center; gap: 10px; color: #8fe6ff; font-size: 12px; letter-spacing: .4em; font-weight: 600 }
.jv-status.on { color: #fff; text-shadow: 0 0 10px rgba(57,208,255,1) }
.jv-dot { width: 8px; height: 8px; border-radius: 50%; background: #39d0ff; box-shadow: 0 0 10px #39d0ff; animation: jvBlink 1.2s infinite }
.jv-caption { max-width: 760px; text-align: center; color: #e6f9ff; font-size: clamp(15px, 1.6vw, 19px); line-height: 1.5; text-shadow: 0 0 12px rgba(57,208,255,.35) }
.jv-hint { color: rgba(143,230,255,.4); font-size: 11px; letter-spacing: .25em; text-transform: uppercase }
.jv-corner { position: absolute; width: 46px; height: 46px; border-color: rgba(57,208,255,.55); border-style: solid; pointer-events: none }
.jv-tl { top: 18px; left: 18px; border-width: 2px 0 0 2px } .jv-tr { top: 18px; right: 18px; border-width: 2px 2px 0 0 }
.jv-bl { bottom: 18px; left: 18px; border-width: 0 0 2px 2px } .jv-br { bottom: 18px; right: 18px; border-width: 0 2px 2px 0 }
`
