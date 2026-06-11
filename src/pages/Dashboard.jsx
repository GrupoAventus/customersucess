import { useApp } from '../lib/AppContext'
import { StatCard, SectionHeader } from '../components/UI'
import DemandTable from '../components/DemandTable'

const SECTIONS_LIST = ['Squad 1', 'Squad 2', 'Centro criativo 1', 'Centro criativo 2']

export default function Dashboard() {
  const { clients, demands, getSaldoStatus } = useApp()

  const allDemands = demands.map(d => ({
    ...d,
    clientName: clients.find(c => c.id === d.clientId)?.name || '—'
  }))

  const pending = allDemands.filter(d => !d.done).length
  const done = allDemands.filter(d => d.done).length
  const critical = clients.filter(c => getSaldoStatus(c) === 'critical').length
  const low = clients.filter(c => getSaldoStatus(c) === 'low').length

  return (
    <div style={{ padding: '1.5rem' }}>
      <SectionHeader title="Dashboard geral" subtitle="Visão consolidada — Squad 1, Squad 2 e Centros Criativos" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
        <StatCard label="Total clientes" value={clients.length} />
        <StatCard label="Demandas pendentes" value={pending} color="var(--amber)" />
        <StatCard label="Demandas concluídas" value={done} color="var(--green)" />
        <StatCard label="Saldo crítico" value={critical} color="var(--red)" />
        <StatCard label="Saldo baixo" value={low} color="var(--amber)" />
      </div>

      {SECTIONS_LIST.map(sq => {
        const sqDemands = allDemands.filter(d => d.dest === sq)
        return (
          <div key={sq} style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', background: '#1a0d04', borderRadius: 6, marginBottom: 8
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--orange)' }}>{sq}</span>
              <span style={{ fontSize: 11, color: '#666' }}>
                {sqDemands.length} demanda{sqDemands.length !== 1 ? 's' : ''}
              </span>
            </div>
            <DemandTable demands={sqDemands} />
          </div>
        )
      })}
    </div>
  )
}
