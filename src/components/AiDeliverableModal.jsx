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
  const fileName = (demand.text || 'entrega').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'entrega'
  const downloadHtml = () => {
    const url = URL.createObjectURL(new Blob([ai.html], { type: 'text/html;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = fileName + '.html'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
  // PDF: abre a entrega pronta para impressão e já chama "Salvar como PDF" (mantém fundo preto e laranja)
  const downloadPdf = () => {
    const printCss = '<style>@page{size:A4;margin:10mm}html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{padding:18px 16px!important}.card,tr{break-inside:avoid}</style>'
    const script = '<script>window.addEventListener("load",function(){document.title=' + JSON.stringify(fileName) + ';setTimeout(function(){window.print()},700)})<\/script>'
    const doc = ai.html.includes('</head>') ? ai.html.replace('</head>', printCss + script + '</head>') : printCss + script + ai.html
    const url = URL.createObjectURL(new Blob([doc], { type: 'text/html;charset=utf-8' }))
    const w = window.open(url, '_blank')
    if (!w) alert('O navegador bloqueou a nova aba. Permita pop-ups para este site e tente de novo.')
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
        <Btn onClick={downloadHtml}><i className="ti ti-download" /> Baixar HTML</Btn>
        <Btn onClick={downloadPdf}><i className="ti ti-file-type-pdf" /> Baixar PDF</Btn>
        <Btn onClick={copy}><i className="ti ti-copy" /> {copied ? 'Copiado!' : 'Copiar HTML'}</Btn>
        <span style={{ flex: 1 }} />
        {demand.done
          ? <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Aprovada e marcada como feita</span>
          : <Btn primary onClick={() => { toggleDemand(demand.id); onClose() }}><i className="ti ti-check" /> Aprovar e marcar como feita</Btn>}
      </div>
    </Modal>
  )
}
