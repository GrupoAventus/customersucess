import { useApp } from '../lib/AppContext'
import { Modal } from './UI'

export default function DemandDetailModal({ demand, onClose }) {
  const { clients, getSaldoStatus, toggleDemand } = useApp()
  const client = clients.find(c => c.id === demand.clientId)

  const status = client ? getSaldoStatus(client) : 'ok'
  const saldoColor = { ok: 'var(--green)', low: 'var(--amber)', critical: 'var(--red)' }[status]

  return (
    <Modal title="Detalhes da demanda" onClose={onClose}>
      {/* Demand info */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
          Demanda
        </div>
        <div style={{ fontSize: 15, color: '#f0f0f0', marginBottom: 10, lineHeight: 1.5 }}>{demand.text}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#888', background: '#1a1a1a', padding: '4px 10px', borderRadius: 20, border: '0.5px solid var(--border)' }}>
            <i className="ti ti-calendar" style={{ marginRight: 4 }} />
            Prazo: {demand.prazo || '—'}
          </span>
          <span style={{ fontSize: 11, color: '#888', background: '#1a1a1a', padding: '4px 10px', borderRadius: 20, border: '0.5px solid var(--border)' }}>
            <i className="ti ti-target-arrow" style={{ marginRight: 4 }} />
            Destino: {demand.dest}
          </span>
          <span
            onClick={() => toggleDemand(demand.id)}
            style={{
              fontSize: 11, cursor: 'pointer',
              color: demand.done ? 'var(--green)' : 'var(--amber)',
              background: demand.done ? 'var(--green-bg)' : 'var(--amber-bg)',
              padding: '4px 10px', borderRadius: 20
            }}
          >
            {demand.done ? '✓ Feita' : '○ Pendente'} — clique para alternar
          </span>
        </div>
      </div>

      {/* Client info */}
      {client ? (
        <div>
          <div style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #1f1f1f' }}>
            Cliente
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{client.name}</div>
          <div style={{ fontSize: 12, color: 'var(--orange)', marginBottom: 12 }}>{client.destino}</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 14px', flex: 1, border: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Saldo atual</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: saldoColor }}>
                R${client.saldo?.toLocaleString('pt-BR')}
              </div>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 14px', flex: 1, border: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Orçamento total</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>R${client.saldoMax?.toLocaleString('pt-BR')}</div>
            </div>
          </div>

          {[
            { icon: 'brand-google-drive', label: 'Google Drive', url: client.drive },
            { icon: 'brand-instagram', label: 'Instagram', url: client.instagram },
            { icon: 'world', label: 'Site', url: client.site },
          ].map(l => (
            <a key={l.icon} href={l.url} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#1a1a1a', borderRadius: 8, marginBottom: 6, border: '0.5px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
              <i className={`ti ti-${l.icon}`} style={{ color: 'var(--orange)' }} />
              {l.label}
              <i className="ti ti-external-link" style={{ marginLeft: 'auto', fontSize: 11 }} />
            </a>
          ))}

          <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>Cliente desde {client.entrou}</div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: '#555' }}>Cliente não encontrado</div>
      )}
    </Modal>
  )
}
