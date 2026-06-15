import { useState } from 'react'
import { useApp } from '../lib/AppContext'

function getMonthDays(year, month) {
  // month is 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1)
    return d.toISOString().slice(0, 10)
  })
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getDate()
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function TimelineTab({ client }) {
  const { getClientTimeline, setTimelineEntry } = useApp()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [doneText, setDoneText] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [saved, setSaved] = useState(true)

  const entries = getClientTimeline(client.id)
  const days = getMonthDays(year, month)
  const todayStr = today.toISOString().slice(0,10)

  // Padding for first week alignment
  const firstWeekday = new Date(year, month, 1).getDay()
  const padding = Array.from({ length: firstWeekday }, () => null)

  const entryFor = (date) => entries.find(e => String(e.date).slice(0, 10) === date)
  const isFilled = (date) => {
    const e = entryFor(date)
    return e && (e.done?.trim() || e.feedback?.trim())
  }

  const openDay = (date) => {
    const e = entryFor(date)
    setSelectedDate(date)
    setDoneText(e?.done || '')
    setFeedbackText(e?.feedback || '')
    setSaved(true)
  }

  const save = async () => {
    await setTimelineEntry(client.id, selectedDate, doneText, feedbackText)
    setSaved(true)
  }

  const changeMonth = (delta) => {
    let m = month + delta
    let y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonth(m); setYear(y)
    setSelectedDate(null)
  }

  const monthName = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => changeMonth(-1)} style={navBtnStyle}>
          <i className="ti ti-chevron-left" />
        </button>
        <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{monthName}</div>
        <button onClick={() => changeMonth(1)} style={navBtnStyle}>
          <i className="ti ti-chevron-right" />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: '#444', padding: '2px 0' }}>{w}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
        {padding.map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(date => {
          const filled = isFilled(date)
          const isToday = date === todayStr
          const isPast = date < todayStr
          const isSelected = date === selectedDate
          const missing = isPast && !filled

          return (
            <button
              key={date}
              onClick={() => openDay(date)}
              style={{
                aspectRatio: '1', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                border: isSelected ? '0.5px solid var(--orange)' : isToday ? '0.5px solid var(--orange)' : '0.5px solid #2a2a2a',
                background: filled ? 'rgba(99,153,34,0.12)' : missing ? 'rgba(226,75,74,0.12)' : '#1a1a1a',
                color: filled ? 'var(--green)' : missing ? 'var(--red)' : isToday ? 'var(--orange)' : '#888',
                fontWeight: isToday ? 600 : 400,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}
            >
              {formatDayLabel(date)}
              {filled && <i className="ti ti-check" style={{ fontSize: 9, position: 'absolute', bottom: 2, right: 2 }} />}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div style={{ background: '#1a1a1a', border: '0.5px solid #2a2a2a', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>O que foi feito</div>
            <textarea
              rows={2}
              placeholder="Ex: ajustamos os criativos, subimos nova campanha..."
              value={doneText}
              onChange={e => { setDoneText(e.target.value); setSaved(false) }}
              onBlur={save}
            />
          </div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>O que o cliente relatou</div>
            <textarea
              rows={2}
              placeholder="Ex: cliente disse que as vendas aumentaram..."
              value={feedbackText}
              onChange={e => { setFeedbackText(e.target.value); setSaved(false) }}
              onBlur={save}
            />
          </div>
          {!saved && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Salvando ao sair do campo...</div>}
        </div>
      )}
    </div>
  )
}

const navBtnStyle = {
  background: 'none', border: '0.5px solid #2a2a2a', borderRadius: 6,
  width: 28, height: 28, color: '#888', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}
