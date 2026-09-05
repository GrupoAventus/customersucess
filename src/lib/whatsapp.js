// AventusCS_ - Evolution API WhatsApp integration

const EVOLUTION_URL = 'https://evolution-api-production-73dff.up.railway.app'
const EVOLUTION_KEY = 'aventus2024'
const INSTANCE = 'aventuscs'

const GROUP_IDS = {
  squad1: '120363403171433351@g.us',
  squad2: '120363426368736817@g.us',
  cc1: '120363403171433351@g.us',
  cc2: '120363426368736817@g.us',
}

async function sendMessage(groupId, text) {
  try {
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        number: groupId,
        text: text,
      })
    })
    const data = await res.json()
    console.log('WhatsApp sent:', data)
    return data
  } catch (e) {
    console.error('WhatsApp error:', e)
  }
}

export async function notifyNewClient(clientName, sections) {
  const message = `🟢 *Novo cliente cadastrado!*\n\n*${clientName}* foi adicionado ao sistema.\n\n_AventusCS_`
  const sentGroups = new Set()
  for (const section of sections) {
    const groupId = GROUP_IDS[section]
    if (groupId && !sentGroups.has(groupId)) {
      await sendMessage(groupId, message)
      sentGroups.add(groupId)
    }
  }
}

export async function notifyNewDemand(clientName, demandText, section) {
  const groupId = GROUP_IDS[section]
  if (!groupId) return
  const message = `📋 *Nova demanda!*\n\n*Cliente:* ${clientName}\n*Demanda:* ${demandText}\n\n_AventusCS_`
  await sendMessage(groupId, message)
}

export async function notifyAlert(alertMessage, sections) {
  const message = `🔔 *Alerta da equipe*\n\n${alertMessage}\n\n_AventusCS_`
  const sentGroups = new Set()
  for (const section of sections) {
    const groupId = GROUP_IDS[section]
    if (groupId && !sentGroups.has(groupId)) {
      await sendMessage(groupId, message)
      sentGroups.add(groupId)
    }
  }
}
