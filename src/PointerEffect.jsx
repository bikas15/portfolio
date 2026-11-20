import { useEffect, useRef } from 'react'
import './PointerEffect.css'

const pixelCount = 32
const pixelSpacing = 9
const nativeTargets = 'input, textarea, select, [contenteditable], .window-bar'

function move(element, point) {
  element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`
}

export default function PointerEffect({ enabled, desk }) {
  const layer = useRef(null)
  const dot = useRef(null)
  const ring = useRef(null)
  const label = useRef(null)
  const pixels = useRef([])

  useEffect(() => {
    if (!enabled) return
    const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)')
    const overlay = layer.current
    const intro = document.querySelector('.opening-intro:not([hidden])')
    const introStyle = intro && getComputedStyle(intro)
    let introShowing = introStyle?.visibility === 'visible' && introStyle.display !== 'none'
    function finishIntro(event) {
      if (event.target === intro) introShowing = false
    }
    const point = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    const follower = { x: 0, y: 0 }
    const pixelAnimations = Array(pixelCount).fill(null)
    let nextPixel = 0
    let distanceSincePixel = 0
    let frame = 0
    let lastMove = 0
    let lastFrame = 0
    let visible = false

    function hide() {
      if (!visible) return
      cancelAnimationFrame(frame)
      frame = 0
      visible = false
      delete overlay.dataset.visible
      distanceSincePixel = 0
      pixelAnimations.forEach(animation => animation?.cancel())
      document.body.classList.remove('experience-cursor-active')
    }

    function paint(now) {
      const dt = Math.min(32, now - lastFrame || 16)
      lastFrame = now
      const ringEase = 1 - Math.exp(-dt / 52)
      follower.x += (target.x - follower.x) * ringEase
      follower.y += (target.y - follower.y) * ringEase
      move(ring.current, follower)

      frame = Math.hypot(target.x - follower.x, target.y - follower.y) > .2
        ? requestAnimationFrame(paint) : 0
    }

    function scatterPixel(x, y, directionX, directionY) {
      const pixel = pixels.current[nextPixel]
      if (!pixel?.animate) return
      pixelAnimations[nextPixel]?.cancel()
      const scatter = (Math.random() - .5) * 36
      const retreat = 7 + Math.random() * 16
      const endX = x - directionX * retreat - directionY * scatter
      const endY = y - directionY * retreat + directionX * scatter + 9
      const angle = Math.round(Math.random() * 135 - 67)
      const size = .65 + Math.random() * .65
      pixelAnimations[nextPixel] = pixel.animate([
        { transform: `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg) scale(${size})`, opacity: .94 },
        { transform: `translate3d(${endX}px, ${endY}px, 0) rotate(${angle + 75}deg) scale(.18)`, opacity: 0 },
      ], { duration: 470 + Math.random() * 160, easing: 'cubic-bezier(.18, .72, .32, 1)' })
      nextPixel = (nextPixel + 1) % pixelCount
    }

    function leaveWake(x, y, now, kind) {
      const dx = x - point.x
      const dy = y - point.y
      const distance = Math.hypot(dx, dy)
      if (!distance) return
      const elapsed = now - lastMove
      if (!visible || kind !== 'plain' || elapsed > 140 || distance / Math.max(6, elapsed) < .28) {
        distanceSincePixel = 0
        return
      }
      let offset = Math.max(pixelSpacing - distanceSincePixel, distance - 5 * pixelSpacing)
      while (offset <= distance) {
        scatterPixel(point.x + dx * offset / distance, point.y + dy * offset / distance, dx / distance, dy / distance)
        offset += pixelSpacing
      }
      distanceSincePixel = (distance + distanceSincePixel) % pixelSpacing
    }

    function track(event) {
      const element = event.buttons ? document.elementFromPoint(event.clientX, event.clientY)
        : event.target instanceof Element ? event.target : null
      if (!media.matches || event.pointerType !== 'mouse' || !element || element.closest(nativeTargets) || introShowing) {
        hide()
        return
      }

      const action = element.closest('[data-pointer-label]')
      const text = action?.dataset.pointerLabel || ''
      const kind = text ? 'label' : element.closest('button, a') ? 'interactive' : 'plain'
      const now = performance.now()
      leaveWake(event.clientX, event.clientY, now, kind)
      point.x = target.x = event.clientX
      point.y = target.y = event.clientY
      move(dot.current, point)
      if (action) {
        const box = action.getBoundingClientRect()
        target.x += Math.max(-9, Math.min(9, (box.left + box.width / 2 - point.x) * .2))
        target.y += Math.max(-9, Math.min(9, (box.top + box.height / 2 - point.y) * .2))
      }
      overlay.dataset.kind = kind
      if (label.current.textContent !== text) label.current.textContent = text

      if (!visible) {
        Object.assign(follower, point)
        move(ring.current, follower)
        overlay.dataset.visible = ''
        document.body.classList.add('experience-cursor-active')
        visible = true
      }

      lastMove = now
      if (!frame) {
        lastFrame = lastMove
        frame = requestAnimationFrame(paint)
      }
    }

    function hideOnNativeFocus(event) {
      if (event.target instanceof Element && event.target.closest(nativeTargets)) hide()
    }

    document.addEventListener('pointermove', track, { passive: true })
    document.addEventListener('pointerover', track, { passive: true })
    document.addEventListener('focusin', hideOnNativeFocus)
    intro?.addEventListener('animationend', finishIntro)
    intro?.addEventListener('animationcancel', finishIntro)
    document.documentElement.addEventListener('pointerleave', hide)
    window.addEventListener('blur', hide)
    media.addEventListener('change', hide)
    return () => {
      hide()
      document.removeEventListener('pointermove', track)
      document.removeEventListener('pointerover', track)
      document.removeEventListener('focusin', hideOnNativeFocus)
      intro?.removeEventListener('animationend', finishIntro)
      intro?.removeEventListener('animationcancel', finishIntro)
      document.documentElement.removeEventListener('pointerleave', hide)
      window.removeEventListener('blur', hide)
      media.removeEventListener('change', hide)
    }
  }, [enabled])

  return <div ref={layer} className="pointer-effect" data-surface={desk ? 'desk' : 'portfolio'} aria-hidden="true">
    {Array.from({ length: pixelCount }, (_, index) => <span key={index} className="pointer-pixel" ref={element => { pixels.current[index] = element }}><i /></span>)}
    <span className="pointer-ring" ref={ring}><i><b ref={label} /></i></span>
    <span className="pointer-dot" ref={dot}><i /></span>
  </div>
}
