import { useState } from 'react'
import { Modal } from './UI'

const DATES = {
  2026: [
    // Janeiro
    { date: '2026-01-01', label: '🎉 Ano Novo', type: 'feriado' },
    { date: '2026-01-30', label: '💙 Dia da Saudade', type: 'comemorativa' },
    // Fevereiro
    { date: '2026-02-17', label: '🎭 Carnaval', type: 'feriado' },
    { date: '2026-02-18', label: '🎭 Carnaval', type: 'feriado' },
    // Março
    { date: '2026-03-08', label: '👩 Dia Internacional da Mulher', type: 'comemorativa' },
    { date: '2026-03-15', label: '🛒 Dia do Consumidor', type: 'comercial' },
    { date: '2026-03-20', label: '🍂 Início do Outono', type: 'comemorativa' },
    // Abril
    { date: '2026-04-03', label: '✝️ Paixão de Cristo', type: 'feriado' },
    { date: '2026-04-05', label: '🐣 Páscoa', type: 'comercial' },
    { date: '2026-04-21', label: '⚔️ Tiradentes', type: 'feriado' },
    // Maio
    { date: '2026-05-01', label: '👷 Dia do Trabalho', type: 'feriado' },
    { date: '2026-05-10', label: '💐 Dia das Mães', type: 'comercial' },
    { date: '2026-05-22', label: '🤗 Dia do Abraço', type: 'comemorativa' },
    // Junho
    { date: '2026-06-11', label: '⚽ Início da Copa do Mundo', type: 'evento' },
    { date: '2026-06-12', label: '💕 Dia dos Namorados', type: 'comercial' },
    { date: '2026-06-13', label: '🎪 Festas Juninas', type: 'comemorativa' },
    { date: '2026-06-19', label: '📖 Corpus Christi', type: 'feriado' },
    { date: '2026-06-21', label: '❄️ Início do Inverno', type: 'comemorativa' },
    // Julho
    { date: '2026-07-09', label: '🏛️ Revolução Constitucionalista', type: 'feriado' },
    { date: '2026-07-10', label: '🍕 Dia da Pizza', type: 'comemorativa' },
    { date: '2026-07-13', label: '🎸 Dia do Rock', type: 'comemorativa' },
    { date: '2026-07-19', label: '⚽ Final da Copa do Mundo', type: 'evento' },
    { date: '2026-07-20', label: '👫 Dia do Amigo', type: 'comemorativa' },
    // Agosto
    { date: '2026-08-09', label: '👨 Dia dos Pais', type: 'comercial' },
    { date: '2026-08-11', label: '📚 Dia do Estudante', type: 'comemorativa' },
    { date: '2026-08-22', label: '🌸 Dia do Folclore', type: 'comemorativa' },
    // Setembro
    { date: '2026-09-07', label: '🇧🇷 Independência do Brasil', type: 'feriado' },
    { date: '2026-09-15', label: '🤝 Dia do Cliente', type: 'comercial' },
    { date: '2026-09-21', label: '🌳 Dia da Árvore', type: 'comemorativa' },
    { date: '2026-09-22', label: '🌸 Início da Primavera', type: 'comemorativa' },
    // Outubro
    { date: '2026-10-04', label: '🐾 Dia dos Animais', type: 'comemorativa' },
    { date: '2026-10-12', label: '🧸 Dia das Crianças', type: 'comercial' },
    { date: '2026-10-12', label: '🇧🇷 Nossa Senhora Aparecida', type: 'feriado' },
    { date: '2026-10-15', label: '🎓 Dia do Professor', type: 'comemorativa' },
    { date: '2026-10-28', label: '💼 Dia do Funcionário Público', type: 'comemorativa' },
    { date: '2026-10-31', label: '🎃 Halloween', type: 'comemorativa' },
    // Novembro
    { date: '2026-11-02', label: '🕯️ Finados', type: 'feriado' },
    { date: '2026-11-15', label: '🇧🇷 Proclamação da República', type: 'feriado' },
    { date: '2026-11-20', label: '✊ Consciência Negra', type: 'feriado' },
    { date: '2026-11-27', label: '🛍️ Black Friday', type: 'comercial' },
    // Dezembro
    { date: '2026-12-08', label: '🙏 Nossa Senhora da Conceição', type: 'feriado' },
    { date: '2026-12-21', label: '☀️ Início do Verão', type: 'comemorativa' },
    { date: '2026-12-25', label: '🎄 Natal', type: 'comercial' },
    { date: '2026-12-31', label: '🎆 Réveillon', type: 'comemorativa' },
  ],
  2027: [
    { date: '2027-01-01', label: '🎉 Ano Novo', type: 'feriado' },
    { date: '2027-01-30', label: '💙 Dia da Saudade', type: 'comemorativa' },
    { date: '2027-02-09', label: '🎭 Carnaval', type: 'feriado' },
    { date: '2027-02-10', label: '🎭 Carnaval', type: 'feriado' },
    { date: '2027-03-08', label: '👩 Dia Internacional da Mulher', type: 'comemorativa' },
    { date: '2027-03-15', label: '🛒 Dia do Consumidor', type: 'comercial' },
    { date: '2027-03-20', label: '🍂 Início do Outono', type: 'comemorativa' },
    { date: '2027-03-26', label: '✝️ Paixão de Cristo', type: 'feriado' },
    { date: '2027-03-28', label: '🐣 Páscoa', type: 'comercial' },
    { date: '2027-04-21', label: '⚔️ Tiradentes', type: 'feriado' },
    { date: '2027-05-01', label: '👷 Dia do Trabalho', type: 'feriado' },
    { date: '2027-05-09', label: '💐 Dia das Mães', type: 'comercial' },
    { date: '2027-05-22', label: '🤗 Dia do Abraço', type: 'comemorativa' },
    { date: '2027-06-03', label: '📖 Corpus Christi', type: 'feriado' },
    { date: '2027-06-12', label: '💕 Dia dos Namorados', type: 'comercial' },
    { date: '2027-06-21', label: '❄️ Início do Inverno', type: 'comemorativa' },
    { date: '2027-07-10', label: '🍕 Dia da Pizza', type: 'comemorativa' },
    { date: '2027-07-13', label: '🎸 Dia do Rock', type: 'comemorativa' },
    { date: '2027-07-20', label: '👫 Dia do Amigo', type: 'comemorativa' },
    { date: '2027-08-08', label: '👨 Dia dos Pais', type: 'comercial' },
    { date: '2027-08-11', label: '📚 Dia do Estudante', type: 'comemorativa' },
    { date: '2027-09-07', label: '🇧🇷 Independência do Brasil', type: 'feriado' },
    { date: '2027-09-15', label: '🤝 Dia do Cliente', type: 'comercial' },
    { date: '2027-09-21', label: '🌳 Dia da Árvore', type: 'comemorativa' },
    { date: '2027-09-22', label: '🌸 Início da Primavera', type: 'comemorativa' },
    { date: '2027-10-04', label: '🐾 Dia dos Animais', type: 'comemorativa' },
    { date: '2027-10-11', label: '🧸 Dia das Crianças', type: 'comercial' },
    { date: '2027-10-12', label: '🇧🇷 Nossa Senhora Aparecida', type: 'feriado' },
    { date: '2027-10-15', label: '🎓 Dia do Professor', type: 'comemorativa' },
    { date: '2027-10-31', label: '🎃 Halloween', type: 'comemorativa' },
    { date: '2027-11-02', label: '🕯️ Finados', type: 'feriado' },
    { date: '2027-11-15', label: '🇧🇷 Proclamação da República', type: 'feriado' },
    { date: '2027-11-20', label: '✊ Consciência Negra', type: 'feriado' },
    { date: '2027-11-26', label: '🛍️ Black Friday', type: 'comercial' },
    { date: '2027-12-08', label: '🙏 Nossa Senhora da Conceição', type: 'feriado' },
    { date: '2027-12-21', label: '☀️ Início do Verão', type: 'comemorativa' },
    { date: '2027-12-25', label: '🎄 Natal', type: 'comercial' },
    { date: '2027-12-31', label: '🎆 Réveillon', type: 'comemorativa' },
  ]
}

const TYPE_COLORS = {
  feriado:     { color: 'var(--red)',   bg: 'rgba(226,75,74,0.1)',   label: 'Feriado' },
  comercial:   { color: 'var(--orange)', bg: 'rgba(239,159,39,0.1)', label: 'Comercial' },
  comemorativa:{ color: '#7c6fcd',      bg: 'rgba(124,111,205,0.1)', label: 'Comemorativa' },
  evento:      { color: 'var(--green)', bg: 'rgba(99,153,34,0.1)',   label: 'Evento' },
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function CalendarModal({ onClose }) {
  const [year, setYear] = useState(2026)
  const [filter, setFilter] = useState('all')

  const dates = DATES[year] || []
  const filtered = filter === 'all' ? dates : dates.filter(d => d.type === filter)

  // Group by month
  const byMonth = {}
  for (const d of filtered) {
    const month = parseInt(d.date.split('-')[1]) - 1
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(d)
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Modal title={`📅 Calendário Comemorativo ${year}`} onClose={onClose} width={620}>
      {/* Year selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[2026, 2027].map(y => (
          <button key={y} onClick={() => setYear(y)} style={{
            flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            border: `0.5px solid ${year === y ? 'var(--orange)' : '#2a2a2a'}`,
            background: year === y ? 'var(--orange-dim)' : 'transparent',
            color: year === y ? 'var(--orange)' : '#666',
          }}>{y}</button>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `0.5px solid ${filter === 'all' ? 'var(--orange)' : '#333'}`, background: filter === 'all' ? 'var(--orange-dim)' : 'transparent', color: filter === 'all' ? 'var(--orange)' : '#666' }}>Todas</button>
        {Object.entries(TYPE_COLORS).map(([type, cfg]) => (
          <button key={type} onClick={() => setFilter(type)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `0.5px solid ${filter === type ? cfg.color : '#333'}`, background: filter === type ? cfg.bg : 'transparent', color: filter === type ? cfg.color : '#666' }}>{cfg.label}</button>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(byMonth).map(([monthIdx, monthDates]) => (
          <div key={monthIdx}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
              {MONTHS[parseInt(monthIdx)]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {monthDates.sort((a, b) => a.date.localeCompare(b.date)).map((d, i) => {
                const cfg = TYPE_COLORS[d.type]
                const isPast = d.date < today
                const isToday = d.date === today
                const dayNum = parseInt(d.date.split('-')[2])
                const weekday = new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                    background: isToday ? cfg.bg : '#1a1a1a',
                    border: `0.5px solid ${isToday ? cfg.color : '#2a2a2a'}`,
                    borderRadius: 8, opacity: isPast ? 0.5 : 1
                  }}>
                    <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: cfg.color, lineHeight: 1 }}>{dayNum}</div>
                      <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase' }}>{weekday}</div>
                    </div>
                    <div style={{ flex: 1, fontSize: 13, color: isPast ? '#555' : '#ccc' }}>{d.label}</div>
                    <span style={{ fontSize: 10, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>{cfg.label}</span>
                    {isToday && <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>HOJE</span>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
