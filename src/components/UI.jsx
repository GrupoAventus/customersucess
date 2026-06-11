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
  const glows = { ok: '#639922', low: '#EF9F27', critical: '#E24B4A' }
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: colors[status],
      boxShadow: `0 0 6px ${glows[status]}`
    }} title={`Saldo ${status === 'ok' ? 'ok' : status === 'low' ? 'baixo' : 'crítico'}`} />
  )
}

export function DemandPill({ done, text }) {
  const bg = done ? '#1a2e12' : '#2e1a12'
  const color = done ? '#639922' : '#EF9F27'
  return (
    <span style={{ background: bg, color, fontSize: 10, padding: '2px 8px', borderRadius: 20 }}>
      {text}
    </span>
  )
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#333' }}>
      <i className={`ti ti-${icon}`} style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
      {text}
    </div>
  )
}

export function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid #1f1f1f',
      borderRadius: 10, padding: '14px 16px'
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: color || 'var(--orange)' }}>{value}</div>
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 500 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
