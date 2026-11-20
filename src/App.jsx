import { useEffect, useState } from 'react'
import './App.css'
import ProjectCaseStudies from './ProjectCaseStudies.jsx'
import brandLogo from '../bikaslogo.png'
import { portfolioAsset } from './portfolioPaths.js'

const email = 'bikashbanjade15@gmail.com'
const github = 'https://github.com/bikas15'
const emptyMessage = { name: '', email: '', phone: '', message: '' }

function SocialLink({ name, href, icon }) {
  return <a className="portfolio-social-link" href={href} aria-label={name} title={name} target="_blank" rel="noopener noreferrer">
    {icon ? <img src={portfolioAsset('portfolio/social/' + icon)} alt="" width="20" height="20" /> :
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.23c-3.34.72-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.29-1.23 3.29-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.31c0 .32.22.69.83.57A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0Z" />
      </svg>}
  </a>
}

function ResumeLink({ className }) {
  return <a className={className} href={portfolioAsset('Bikas-Banjade-CV.pdf')} target="_blank" rel="noopener noreferrer">
    Résumé <span aria-hidden="true">↗</span>
  </a>
}

function App({ onDarkMode, showOpening }) {
  const [formData, setFormData] = useState(emptyMessage)
  const [feedback, setFeedback] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const hash = location.hash
    if (!showOpening || !hash || hash === '#home') return

    let active = true
    document.fonts.ready.then(() => {
      if (active && location.hash === hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
      }
    })
    return () => { active = false }
  }, [showOpening])

  function updateMessage(event) {
    const { name, value } = event.target
    setFormData(previous => ({ ...previous, [name]: value }))
  }

  async function sendMessage(event) {
    event.preventDefault()
    setFeedback(null)
    const apiUrl = import.meta.env.VITE_CONTACT_API_URL?.replace(/\/+$/, '')
    if (!apiUrl) {
      setFeedback({ message: 'The form is unavailable here. You can reach me by email.', error: true })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to send your message.')
      setFeedback({ message: 'Message sent. Thanks for getting in touch!', error: false })
      setFormData(emptyMessage)
    } catch (error) {
      setFeedback({ message: error.message || 'Unable to send your message. Please try again.', error: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return <div className="app-container">
    <div className="opening-intro" hidden={!showOpening} aria-hidden="true" />
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="portfolio-header">
      <div className="portfolio-shell portfolio-header-inner">
        <div className="portfolio-brand">
          <a className="brand-mark-link" href={portfolioAsset('games/gridrush/index.html?discovered=party')} aria-label="Play Turn Every Tile Blue">
            <span className="brand-mark-icon" aria-hidden="true"><img src={brandLogo} alt="" /></span>
          </a>
          <a className="portfolio-wordmark" href="#home">Bikas Banjade</a>
        </div>
        <nav aria-label="Main navigation">
          <ul className="nav-links">
            <li><a href="#projects">Work</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
        <button className="portfolio-theme-switch" type="button" aria-label="Flip the Switch" title="Open Bikas Desk" onClick={onDarkMode}>
          <span className="portfolio-switch-indicator" aria-hidden="true" />
          Flip the Switch
        </button>
      </div>
    </header>

    <main id="main-content" className="portfolio-shell" tabIndex={-1}>
      <section id="home" className="portfolio-hero" aria-labelledby="portfolio-name">
        <div className="portfolio-hero-copy">
          <p className="portfolio-kicker"><span aria-hidden="true" />Software Engineering Student · NCIT</p>
          <h1 id="portfolio-name">Bikas<br /><em>Banjade<span aria-hidden="true">.</span></em></h1>
          <p className="portfolio-intro">I build full-stack web apps, from the interfaces people use to the APIs that power them.</p>
          <div className="portfolio-actions">
            <a className="portfolio-button portfolio-button-primary" href="#projects">View my work <span aria-hidden="true">↓</span></a>
            <ResumeLink className="portfolio-button portfolio-button-outline" />
          </div>
        </div>
        <figure className="portfolio-portrait">
          <div className="portfolio-portrait-frame">
            <img src={portfolioAsset('portfolio/perfil.jpg')} alt="Bikas Banjade in front of a brick wall" width="559" height="485" fetchPriority="high" />
          </div>
          <figcaption><span>From Pyuthan, Nepal</span><span>Based in Kathmandu</span></figcaption>
        </figure>
      </section>

      <ProjectCaseStudies onDarkMode={onDarkMode} />

      <section id="about" className="portfolio-about" aria-labelledby="about-title">
        <figure className="portfolio-about-photo">
          <img src={portfolioAsset('portfolio/bikas.jpg')} alt="Bikas Banjade in a historic square in Nepal" width="640" height="640" loading="lazy" decoding="async" />
        </figure>
        <div className="portfolio-about-copy">
          <h2 id="about-title">About me<span aria-hidden="true">.</span></h2>
          <p>I’m studying Software Engineering at Nepal College of Information Technology. Outside class, I build web apps to learn how interfaces, APIs and databases work together in a deployed product.</p>
          <p>With Hostel Hub, that meant making listings easy to explore on a phone and on a map. With Bugs Finder, it meant connecting a code editor to server-side AI analysis and private report history.</p>
          <div className="portfolio-about-links">
            <ResumeLink className="portfolio-text-link" />
            <SocialLink name="GitHub" href={github} />
          </div>
        </div>
        <div className="portfolio-stack" id="skills">
          <h3>Tools I’ve used in these projects</h3>
          <dl>
            <div><dt>Frontend</dt><dd>React, JavaScript, Leaflet</dd></div>
            <div><dt>Backend</dt><dd>Express, Django REST</dd></div>
            <div><dt>Data</dt><dd>MongoDB, PostgreSQL</dd></div>
          </dl>
        </div>
      </section>

      <section id="contact" className="portfolio-contact" aria-labelledby="contact-title">
        <div className="portfolio-contact-copy">
          <h2 id="contact-title">Let’s talk<span aria-hidden="true">.</span></h2>
          <p>Get in touch about a project, internship or collaboration.</p>
          <a href={`mailto:${email}`} className="portfolio-email">{email} <span aria-hidden="true">↗</span></a>
          <div className="portfolio-socials">
            <SocialLink name="GitHub" href={github} />
            <SocialLink name="Instagram" href="https://www.instagram.com/bikas.banjade22/" icon="instagram.svg" />
            <SocialLink name="Facebook" href="https://www.facebook.com/bikash.banjade15/" icon="facebook.svg" />
          </div>
        </div>
        <form className="portfolio-contact-form" onSubmit={sendMessage}>
          <div className="portfolio-form-row">
            <label>Name<input name="name" autoComplete="name" maxLength={100} value={formData.name} onChange={updateMessage} required /></label>
            <label>Email<input type="email" name="email" autoComplete="email" maxLength={254} value={formData.email} onChange={updateMessage} required /></label>
          </div>
          <label><span>Phone <small>(optional)</small></span><input type="tel" name="phone" autoComplete="tel" maxLength={30} value={formData.phone} onChange={updateMessage} /></label>
          <label>Message<textarea name="message" rows={4} maxLength={5000} value={formData.message} onChange={updateMessage} required /></label>
          {feedback && <p role="status" className={feedback.error ? 'portfolio-form-error' : 'portfolio-form-success'}>{feedback.message}</p>}
          <button type="submit" className="portfolio-button portfolio-button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send message'} <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>
    </main>

    <footer className="portfolio-shell portfolio-footer">
      <span>Bikas Banjade</span>
      <a href="#home">Back to top <span aria-hidden="true">↑</span></a>
    </footer>
  </div>
}

export default App
