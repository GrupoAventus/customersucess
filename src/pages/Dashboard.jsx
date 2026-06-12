import { useApp } from '../lib/AppContext'
import { StatCard, SectionHeader } from '../components/UI'
import DemandTable from '../components/DemandTable'

const SECTIONS_LIST = ['Squad 1', 'Squad 2', 'Centro criativo 1', 'Centro criativo 2']
const CC_LIST = ['Centro criativo 1', 'Centro criativo 2']

export default function Dashboard() {
  const { clients, demands, getSaldoStatus, getSocialClients } = useApp()

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

      {/* Social Media Summary */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          padding: '6px 10px', background: '#1a0d04', borderRadius: 6, marginBottom: 8
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--orange)' }}>Resumo Social Media</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {CC_LIST.map(cc => {
            const socialClients = getSocialClients(cc)
            const totalPosts = socialClients.reduce((sum, c) => sum + c.currentWeekPosts, 0)
            const totalGoal = socialClients.length * 3
            const completedClients = socialClients.filter(c => c.currentWeekPosts >= 3).length
            const pendingClients = socialClients.filter(c => c.currentWeekPosts < 3)

            return (
              <div key={cc} style={{ background: 'var(--bg-card)', border: '0.5px solid #1f1f1f', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{cc}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{socialClients.length} cliente{socialClients.length !== 1 ? 's' : ''}</span>
                </div>

                {socialClients.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#333' }}>Nenhum cliente em Social Media</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#1f1f1f', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${totalGoal ? (totalPosts / totalGoal) * 100 : 0}%`, background: 'var(--green)' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{totalPosts}/{totalGoal} posts</span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'var(--green)', background: 'var(--green-bg)', padding: '2px 8px', borderRadius: 20 }}>
                        {completedClients} completo{completedClients !== 1 ? 's' : ''}
                      </span>
                      {pendingClients.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--amber)', background: 'var(--amber-bg)', padding: '2px 8px', borderRadius: 20 }}>
                          {pendingClients.length} pendente{pendingClients.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {pendingClients.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {pendingClients.map(c => (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                            <span>{c.name}</span>
                            <span style={{ color: 'var(--amber)' }}>{c.currentWeekPosts}/3</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
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
