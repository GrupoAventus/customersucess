import { useEffect } from 'react'

// Assistente de voz (ElevenLabs Agents) — "Jarvis Aventus"
// Consulta o painel/agenda via Apps Script (action=getAssistantContext).
const AGENT_ID = 'agent_9501m7sy3cdaf3t9j0n6bqvb18yf'
const SCRIPT_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed'

export default function VoiceAssistant() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.type = 'text/javascript'
    document.body.appendChild(s)
  }, [])

  return <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
}
