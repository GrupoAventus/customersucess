import { useApp } from '../lib/AppContext'

export default function SocialMediaTab({ centroCriativo }) {
  const { getSocialClients, registerSocialPost } = useApp()
  const socialClients = getSocialClients(centroCriativo)

  // Sort: clients with posts remaining first, then by fewest posts done (whose turn it is)
  const sorted = [...socialClients].sort((a, b) => {
    if (a.postsRemaining === 0 && b.postsRemaining > 0) return 1
    if (b.postsRemaining === 0 && a.postsRemaining > 0) return -1
    return a.currentWeekPosts - b.currentWeekPosts
  })

  const nextClient = sorted.find(c => c.postsRemaining > 0)

  if (socialClients.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#333' }}>
        <i className="ti ti-photo" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
        Nenhum cliente designado para Social Media neste centro
      </div>
    )
  }

  return (
    <div>
      {nextClient && (
        <div style={{
          background: 'var(--orange-dim)', border: '0.5px solid var(--orange)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <i className="ti ti-arrow-right-circle" style={{ color: 'var(--orange)', fontSize: 20 }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Próximo na fila</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--orange)' }}>{nextClient.name}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {sorted.map(c => {
          const done = c.currentWeekPosts >= 3
          return (
            <div key={c.id} style={{
              background: 'var(--bg-card)', border: `0.5px solid ${done ? 'var(--border)' : 'var(--orange)'}`,
              borderRadius: 12, padding: '1rem 1.25rem', position: 'relative'
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{c.name}</div>

              {/* Posts progress */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 6, borderRadius: 3,
                    background: i < c.currentWeekPosts ? 'var(--green)' : '#1f1f1f'
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                {c.currentWeekPosts}/3 posts esta semana
              </div>

              {/* Links */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[
                  { icon: 'brand-google-drive', url: c.drive },
                  { icon: 'brand-instagram', url: c.instagram },
                  { icon: 'world', url: c.site },
                ].map(l => (
                  <a key={l.icon} href={l.url} target="_blank" rel="noreferrer"
                    style={{
                      width: 32, height: 32, borderRadius: 8, background: '#1a1a1a',
                      border: '0.5px solid var(--border)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                    }}>
                    <i className={`ti ti-${l.icon}`} />
                  </a>
                ))}
              </div>

              <button
                onClick={() => registerSocialPost(c.id)}
                disabled={done}
                style={{
                  width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                  background: done ? '#1a2e12' : 'var(--orange)',
                  color: done ? 'var(--green)' : '#fff',
                  fontSize: 12, fontWeight: 500, cursor: done ? 'default' : 'pointer'
                }}
              >
                {done ? '✓ Semana completa' : `Marcar post feito (${c.currentWeekPosts}/3)`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
