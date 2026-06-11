import { useState } from 'react'
import { AppProvider, useApp } from './lib/AppContext'
import Nav from './components/Nav'
import LoginScreen from './components/LoginScreen'
import Ops from './pages/Ops'
import Dashboard from './pages/Dashboard'
import Squad from './pages/Squad'
import CentrosCriativos from './pages/CentrosCriativos'

const SECTIONS = {
  ops:   { label: 'Centro de operações', component: () => <Ops /> },
  dash:  { label: 'Dashboard', component: () => <Dashboard /> },
  squad1:{ label: 'Squad 1', component: () => <Squad label="Squad 1" title="Squad 1" /> },
  squad2:{ label: 'Squad 2', component: () => <Squad label="Squad 2" title="Squad 2" /> },
  cc1:   { label: 'Centro criativo 1', component: () => <CentrosCriativos label="Centro criativo 1" title="Centro criativo 1" /> },
  cc2:   { label: 'Centro criativo 2', component: () => <CentrosCriativos label="Centro criativo 2" title="Centro criativo 2" /> },
}

function AppInner() {
  const [current, setCurrent] = useState('ops')
  const { loggedIn } = useApp()
  const section = SECTIONS[current]
  if (!loggedIn[current]) return <LoginScreen section={current} sectionName={section.label} />
  return <div><Nav current={current} onChange={setCurrent} /><section.component /></div>
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>
}
