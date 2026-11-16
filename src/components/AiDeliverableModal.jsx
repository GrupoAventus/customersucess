import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Modal, Btn } from './UI'

// Mostra a entrega (HTML) que a IA deixou pronta para uma demanda.
export default function AiDeliverableModal({ demand, onClose }) {
  const { getDemandAi, toggleDemand } = useApp()
  const [copied, setCopied] = useState(false)
  const ai = getDemandAi(demand.id)
  if (!ai) return null

  const openNewTab = () => {
    const url = URL.createObjectURL(new Blob([ai.html], { type: 'text/html;charset=utf-8' }))
    window.open(url, '_blank', 'noopener')
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(ai.html); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch (e) { console.error(e) }
  }

  return (
    <Modal title="Entrega da demanda" onClose={onClose} width={1040}>
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 10, lineHeight: 1.5 }}>{demand.text}</div>
      <iframe
        title="Entrega"
        srcDoc={ai.html}
        sandbox="allow-popups"
        style={{ width: '100%', height: '62vh', border: '0.5px solid var(--border)', borderRadius: 10, background: '#0A0908' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Btn onClick={openNewTab}><i className="ti ti-external-link" /> Abrir em nova aba</Btn>
        <Btn onClick={copy}><i className="ti ti-copy" /> {copied ? 'Copiado!' : 'Copiar HTML'}</Btn>
        <span style={{ flex: 1 }} />
        {demand.done
          ? <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Aprovada e marcada como feita</span>
          : <Btn primary onClick={() => { toggleDemand(demand.id); onClose() }}><i className="ti ti-check" /> Aprovar e marcar como feita</Btn>}
      </div>
    </Modal>
  )
}
