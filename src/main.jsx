import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Workbench from './Workbench.jsx'
import PointerEffect from './PointerEffect.jsx'
import { deskUrl, isDeskRoute, portfolioRoot } from './portfolioPaths.js'
import './index.css'

const assemblyDuration = 2200
const exitDuration = 420

function PortfolioModes() {
  const [desk, setDesk] = useState(isDeskRoute)
  const [openedDesk, setOpenedDesk] = useState(isDeskRoute)
  const [animation, setAnimation] = useState('')
  const [showOpening, setShowOpening] = useState(() => !isDeskRoute())
  const timer = useRef(null)
  const currentMode = useRef(desk)
  const returnScroll = useRef(0)
  const returnFocus = useRef(null)
  const portfolioUrl = useRef(isDeskRoute() ? portfolioRoot.href : location.href)
  const portfolioTitle = 'Bikas Banjade | Software Engineering Student at NCIT'

  useLayoutEffect(() => {
    document.body.classList.toggle('desk-active', desk)
    document.title = desk ? 'Bikas Desk | Bikas Banjade' : portfolioTitle
    if (!desk && !showOpening) window.scrollTo({ top: returnScroll.current, behavior: 'instant' })
  }, [desk, showOpening])

  useEffect(() => {
    function syncLocation() {
      const nextDesk = isDeskRoute()
      if (nextDesk === currentMode.current) return
      currentMode.current = nextDesk
      clearTimeout(timer.current)
      setAnimation('')
      setShowOpening(false)
      if (nextDesk) setOpenedDesk(true)
      setDesk(nextDesk)
    }
    window.addEventListener('popstate', syncLocation)
    return () => {
      clearTimeout(timer.current)
      window.removeEventListener('popstate', syncLocation)
      document.body.classList.remove('desk-active')
    }
  }, [])

  function switchMode(nextDesk, trigger) {
    if (nextDesk === desk || animation) return
    if (nextDesk) {
      portfolioUrl.current = location.href
      returnScroll.current = window.scrollY
      returnFocus.current = trigger
    }
    const destination = nextDesk ? deskUrl : portfolioUrl.current
    history.pushState(null, '', destination)
    currentMode.current = nextDesk
    if (nextDesk) setOpenedDesk(true)
    setShowOpening(false)
    const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches
    setAnimation(motion ? (nextDesk ? 'assemble' : 'exit') : '')
    setDesk(nextDesk)

    timer.current = setTimeout(() => {
      setAnimation('')
      requestAnimationFrame(() => {
        const selector = nextDesk ? '.theme-switch' : '.portfolio-theme-switch'
        const trigger = nextDesk ? null : returnFocus.current
        const target = trigger?.isConnected ? trigger : document.querySelector(selector)
        target?.focus({ preventScroll: true })
      })
    }, motion ? (nextDesk ? assemblyDuration : exitDuration) : 0)
  }

  return <>
    <div hidden={desk && animation !== 'assemble'} inert={desk ? '' : undefined}>
      <App onDarkMode={event => switchMode(true, event.currentTarget)} showOpening={showOpening} />
    </div>
    {openedDesk && <div className="desk-layer" hidden={!desk && animation !== 'exit'} inert={!desk || animation ? '' : undefined}>
      <Workbench animation={animation} enabled={desk && !animation} onLightMode={() => switchMode(false)} />
    </div>}
    <PointerEffect enabled={!animation} desk={desk} />
  </>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PortfolioModes />
  </React.StrictMode>,
)
