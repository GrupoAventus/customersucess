import { useState, useEffect, useRef } from 'react'

// ─── Seletor de período com calendário ───────────────────────────────────────
// Clique no dia de início e depois no dia de fim. Atalhos rápidos à esquerda.
// Só aplica (e busca os dados) quando o intervalo está completo.

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// "Hoje" sempre no fuso de São Paulo
function todaySP() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) // yyyy-mm-dd
}
function toStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function addDays(str, n) {
  const d = new Date(str + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
function fmtBR(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function buildShortcuts() {
  const t = todaySP()
  const [y, m] = t.split('-').map(Number)
  const firstThisMonth = toStr(y, m - 1, 1)
  const lastPrevMonth  = addDays(firstThisMonth, -1)
  const [py, pm] = lastPrevMonth.split('-').map(Number)
  const dow = new Date(t + 'T12:00:00Z').getUTCDay() // 0 = domingo
  const mondayThisWeek = addDays(t, -((dow + 6) % 7))
  return [
    { label: 'Hoje',             start: t,                     end: t },
    { label: 'Ontem',            start: addDays(t, -1),        end: addDays(t, -1) },
    { label: 'Esta semana',      start: mondayThisWeek,        end: t },
    { label: 'Semana passada',   start: addDays(mondayThisWeek, -7), end: addDays(mondayThisWeek, -1) },
    { label: 'Últimos 7 dias',   start: addDays(t, -6),        end: t },
    { label: 'Últimos 30 dias',  start: addDays(t, -29),       end: t },
    { label: 'Este mês',         start: firstThisMonth,        end: t },
    { label: 'Mês passado',      start: toStr(py, pm - 1, 1),  end: lastPrevMonth },
  ]
}

function MonthGrid({ year, month, start, end, hover, today, onPick, onHover }) {
  const firstDow    = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toStr(year, month, d))

  // Enquanto escolhe o fim, mostra o intervalo até o dia sob o mouse
  const rangeEnd = end || (start && hover && hover >= start ? hover : null)

  return (
    <div style={{ width: 224 }}>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
        {MONTHS[month]} {year}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 32px)', gap: 0 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: '#555', padding: '4px 0' }}>{w}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const isFuture = day > today
          const isStart  = day === start
          const isEnd    = day === rangeEnd
          const inRange  = start && rangeEnd && day > start && day < rangeEnd
          const isToday  = day === today
          const edge     = isStart || isEnd
          return (
            <button
              key={i}
              type="button"
              disabled={isFuture}
              onClick={() => onPick(day)}
              onMouseEnter={() => onHover(day)}
              style={{
                width: 32, height: 32, border: 'none', fontSize: 12,
                cursor: isFuture ? 'default' : 'pointer',
                borderRadius: edge ? 8 : inRange ? 0 : 8,
                background: edge ? 'var(--orange)' : inRange ? 'rgba(255,107,53,0.18)' : 'transparent',
                color: isFuture ? '#333' : edge ? '#fff' : 'var(--text)',
                fontWeight: edge || isToday ? 700 : 400,
                outline: isToday && !edge ? '1px solid #444' : 'none',
                outlineOffset: -3,
              }}
            >
              {Number(day.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DateRangePicker({ start, end, onChange, autoOpen = false }) {
  const today = todaySP()
  const [open, setOpen]         = useState(autoOpen && (!start || !end))
  const [draftStart, setDS]     = useState(start || '')
  const [draftEnd, setDE]       = useState(end || '')
  const [hover, setHover]       = useState(null)
  const initial = (end || today).split('-').map(Number)
  // mês exibido à direita; o da esquerda é o anterior
  const [view, setView] = useState({ y: initial[0], m: initial[1] - 1 })
  const ref = useRef(null)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Ao abrir, parte do período atual
  useEffect(() => {
    if (open) { setDS(start || ''); setDE(end || '') }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const prev = view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 }
  const shift = (n) => setView(v => {
    const d = new Date(Date.UTC(v.y, v.m + n, 1))
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() }
  })

  const pick = (day) => {
    if (!draftStart || draftEnd) { setDS(day); setDE('') }   // começa novo intervalo
    else if (day < draftStart)    { setDS(day) }              // clicou antes do início
    else                          { setDE(day) }              // fecha o intervalo
  }

  const apply = (s, e) => { onChange(s, e); setOpen(false) }

  const shortcuts = buildShortcuts()
  const label = start && end
    ? (start === end ? fmtBR(start) : `${fmtBR(start)}  →  ${fmtBR(end)}`)
    : 'Escolher datas'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg2)', border: `0.5px solid ${open ? 'var(--orange)' : '#2a2a2a'}`,
          borderRadius: 8, padding: '6px 12px', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
        }}
      >
        <i className="ti ti-calendar" style={{ color: 'var(--orange)' }} />
        {label}
        <i className="ti ti-chevron-down" style={{ color: '#666', fontSize: 11 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
          background: '#111', border: '0.5px solid #2a2a2a', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)', display: 'flex', width: 'max-content',
          maxWidth: 'calc(100vw - 32px)', flexWrap: 'wrap',
        }}>
          {/* Atalhos */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: 10, borderRight: '0.5px solid #222', minWidth: 140 }}>
            {shortcuts.map(s => {
              const active = s.start === draftStart && s.end === draftEnd
              return (
                <button key={s.label} type="button" onClick={() => apply(s.start, s.end)}
                  style={{
                    textAlign: 'left', border: 'none', borderRadius: 6, padding: '7px 10px', fontSize: 12,
                    cursor: 'pointer', background: active ? 'rgba(255,107,53,0.15)' : 'transparent',
                    color: active ? 'var(--orange)' : '#aaa',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#1a1a1a' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >{s.label}</button>
              )
            })}
          </div>

          {/* Calendários */}
          <div style={{ padding: 14 }} onMouseLeave={() => setHover(null)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, position: 'relative', flexWrap: 'wrap', paddingTop: 2 }}>
              <button type="button" onClick={() => shift(-1)} title="Mês anterior"
                style={{ position: 'absolute', left: 0, top: -2, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>
                <i className="ti ti-chevron-left" />
              </button>
              <button type="button" onClick={() => shift(1)} title="Próximo mês"
                disabled={toStr(view.y, view.m, 1) > today}
                style={{ position: 'absolute', right: 0, top: -2, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>
                <i className="ti ti-chevron-right" />
              </button>
              <MonthGrid year={prev.y} month={prev.m} start={draftStart} end={draftEnd} hover={hover}
                today={today} onPick={pick} onHover={setHover} />
              <MonthGrid year={view.y} month={view.m} start={draftStart} end={draftEnd} hover={hover}
                today={today} onPick={pick} onHover={setHover} />
            </div>

            {/* Rodapé */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '0.5px solid #222', gap: 10 }}>
              <div style={{ fontSize: 12, color: '#888' }}>
                {draftStart
                  ? <>{fmtBR(draftStart)} → {draftEnd ? fmtBR(draftEnd) : <span style={{ color: '#555' }}>escolha o fim</span>}</>
                  : <span style={{ color: '#555' }}>Clique no dia de início</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setOpen(false)}
                  style={{ background: '#1a1a1a', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#888', fontSize: 12, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="button" disabled={!draftStart}
                  onClick={() => apply(draftStart, draftEnd || draftStart)}
                  style={{
                    background: draftStart ? 'var(--orange)' : '#2a2a2a', border: 'none', borderRadius: 8,
                    padding: '6px 14px', color: '#fff', fontSize: 12, fontWeight: 600,
                    cursor: draftStart ? 'pointer' : 'default',
                  }}>
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
