import { useState } from 'react'
import styles from './UI.module.css'

export function Btn({ children, primary, danger, onClick, style, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`${styles.btn} ${primary ? styles.primary : ''} ${danger ? styles.danger : ''}`}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      {children}
    </div>
  )
}

export function Modal({ title, onClose, children, width }) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: width || 560 }}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SaldoBadge({ status }) {
  const colors = { ok: '#3B6D11', low: '#854F0B', critical: '#A32D2D' }
  const glows  = { ok: '#639922', low: '#EF9F27', critical: '#E24B4A' }
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: colors[status],
      boxShadow: `0 0 7px ${glows[status]}`
    }} title={`Saldo ${status === 'ok' ? 'ok' : status === 'low' ? 'baixo' : 'crítico'}`} />
  )
}

export function DemandPill({ done, text }) {
  const bg    = done ? '#1a2e12' : '#2e1a08'
  const color = done ? '#639922' : '#EF9F27'
  return (
    <span style={{ background: bg, color, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
      {text}
    </span>
  )
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
      <i className={`ti ti-${icon}`} style={{ fontSize: 28, display: 'block', marginBottom: 10, opacity: 0.4 }} />
      <span style={{ fontSize: 13 }}>{text}</span>
    </div>
  )
}

export function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0e0c09 0%, #0a0802 100%)',
      border: '0.5px solid #1e1b14',
      borderRadius: 12, padding: '14px 16px',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Glow sutil no canto */}
      <div style={{
        position: 'absolute', right: -20, top: -20,
        width: 60, height: 60, borderRadius: '50%',
        background: `radial-gradient(circle, ${(color || 'var(--orange)')} 0%, transparent 70%)`,
        opacity: 0.07, pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: color || 'var(--orange)', lineHeight: 1 }}>{value}</div>
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
