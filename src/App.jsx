import { useState } from 'react'
import './App.css'
import ProjectCaseStudies from './ProjectCaseStudies.jsx'
import brandLogo from '../bikaslogo.png'
import { portfolioAsset } from './portfolioPaths.js'

const email = 'bikashbanjade15@gmail.com'
const github = 'https://github.com/bikas15'
const contactApi = import.meta.env.VITE_CONTACT_API_URL?.trim().replace(/\/+$/, '')

const skillGroups = [
  { label: 'Frontend', skills: [
    { name: 'React', icon: 'react' },
    { name: 'JavaScript', icon: 'javascript' },
    { name: 'Leaflet', icon: 'leaflet' },
  ] },
  { label: 'Backend', skills: [
    { name: 'Express', icon: 'express' },
    { name: 'Django REST', icon: 'djangorest' },
  ] },
  { label: 'Data', skills: [
    { name: 'MongoDB', icon: 'mongodb' },
    { name: 'PostgreSQL', icon: 'postgresql' },
  ] },
  { label: 'Programming languages', skills: [
    { name: 'C', icon: 'c' },
    { name: 'C++', icon: 'cplusplus' },
    { name: 'Java', icon: 'java' },
    { name: 'PHP', icon: 'php' },
  ] },
]

function SocialLink({ name, href, icon }) {
  return <a className="portfolio-social-link" href={href} aria-label={name} title={name} target="_blank" rel="noopener noreferrer">
    {icon ? <img src={portfolioAsset('portfolio/social/' + icon)} alt="" width="20" height="20" /> :
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.23c-3.34.72-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.29-1.23 3.29-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.31c0 .32.22.69.83.57A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0Z" />
      </svg>}
  </a>
}

// SVG placeholder component
const PlaceholderImage = ({ width = 300, height = 300, text = 'Image' }) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
    <rect width={width} height={height} fill="#e0e0e0" />
    <circle cx={width/2} cy={height/2 - 40} r="40" fill="#999" />
    <path d={`M${width/2 - 60} ${height/2 + 20} L${width/2} ${height/2 + 60} L${width/2 + 60} ${height/2 + 20}`} fill="#999" />
    <text x={width/2} y={height - 20} textAnchor="middle" fill="#666" fontSize="16">{text}</text>
  </svg>
)

function App({ onDarkMode, showOpening }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitMessage('')
    setSubmitError(false)

    if (!contactApi || isSubmitting) return

    setIsSubmitting(true)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 90_000)
    try {
      const response = await fetch(`${contactApi}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal
      })
      const result = await response.json().catch(() => null)

      if (response.status !== 201) {
        setSubmitError(true)
        setSubmitMessage(typeof result?.message === 'string' && result.message
          ? result.message
          : 'Unable to send your message. Please try again or email me directly.')
        return
      }

      setSubmitMessage('Message sent successfully!')
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch {
      setSubmitError(true)
      setSubmitMessage('Delivery could not be confirmed. You can email me directly.')
    } finally {
      window.clearTimeout(timeout)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-container">
      <a className="skip-link" href="#portfolio-content">Skip to content</a>
      {/* Navigation */}
      <nav className="navbar" aria-label="Main navigation">
        <div className="nav-container">
          <div className="logo">
            <a className="brand-mark-link" href={portfolioAsset('games/gridrush/index.html?discovered=party')} aria-label="Play Turn Every Tile Blue">
              <span className="brand-mark-icon" aria-hidden="true">
                <img src={brandLogo} alt="" />
              </span>
            </a>
            <span style={{ borderInlineStart: '1px solid currentColor', paddingInlineStart: '0.4rem', color: 'var(--text-dark)', fontWeight: 600, fontSize: '1.15rem' }}>Bikas</span>
          </div>
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <button className="portfolio-theme-switch" type="button" aria-label="Flip the Switch" data-pointer-label="ENTER" onClick={onDarkMode}>
            <span className="portfolio-mode-moon" aria-hidden="true" /><span className="portfolio-theme-label">Flip the Switch</span>
          </button>
        </div>
      </nav>

      <main id="portfolio-content" tabIndex={-1}>
        <section id="home" className="hero" aria-labelledby="home-title">
          <h1 id="home-title">Bikas Banjade</h1>
          <figure className="hero-photo">
            <img className="hero-portrait" src={portfolioAsset('portfolio/perfil.jpg')} alt="Bikas Banjade in front of a brick wall" width="559" height="485" fetchPriority="high" />
            <figcaption>Pyuthan, Nepal</figcaption>
          </figure>
          <div className="hero-intro">
            <p className="hero-role">Software Engineering student at Nepal College of Information Technology (NCIT)</p>
            <p className="hero-lead">I build web applications end to end, from designing interfaces to developing APIs and working with databases.</p>
            <div className="hero-links">
              <a className="hero-resume" href={portfolioAsset('Bikas-Banjade-CV.pdf')} target="_blank" rel="noopener noreferrer">View Resume</a>
              <a className="hero-github" href={github} target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </section>

        <ProjectCaseStudies showOpening={showOpening} />

        {/* Skills Section */}
        <section id="skills" className="portfolio-stack" aria-labelledby="skills-title">
          <h2 id="skills-title">Skills</h2>
          <dl>
            {skillGroups.map(({ label, skills }) => <div key={label}>
              <dt>{label}</dt>
              <dd>
                <ul className="portfolio-skill-list">
                  {skills.map(({ name, icon }) => <li key={name}>
                    <span className="portfolio-skill-icon" aria-hidden="true">
                      <img src={portfolioAsset(`portfolio/skills/${icon}.svg`)} alt="" width="15" height="15" />
                    </span>
                    {name}
                  </li>)}
                </ul>
              </dd>
            </div>)}
          </dl>
        </section>

        {/* Contact Section */}
        <section id="contact" className="portfolio-contact" aria-labelledby="contact-title">
          <div className="portfolio-contact-copy">
            <h2 id="contact-title">Let’s talk<span aria-hidden="true">.</span></h2>
            <p>Get in touch about a project, internship or collaboration.</p>
            <a href={`mailto:${email}`} className="portfolio-email">{email}</a>
            <div className="portfolio-socials">
              <SocialLink name="GitHub" href={github} />
              <SocialLink name="Instagram" href="https://www.instagram.com/bikas.banjade22/" icon="instagram.svg" />
              <SocialLink name="Facebook" href="https://www.facebook.com/bikash.banjade15/" icon="facebook.svg" />
            </div>
          </div>
          <form className="portfolio-contact-form" onSubmit={handleSubmit}>
            <div className="portfolio-form-row">
              <label>Name<input name="name" autoComplete="name" maxLength={100} value={formData.name} onChange={handleInputChange} required /></label>
              <label>Email<input type="email" name="email" autoComplete="email" maxLength={254} value={formData.email} onChange={handleInputChange} required /></label>
            </div>
            <label>Phone<input type="tel" name="phone" autoComplete="tel" maxLength={30} value={formData.phone} onChange={handleInputChange} /></label>
            <label>Message<textarea name="message" rows={4} maxLength={5000} value={formData.message} onChange={handleInputChange} required /></label>
            <p role="status" className={submitError ? 'portfolio-form-error' : 'portfolio-form-success'}>{submitMessage}</p>
            <button type="submit" className="portfolio-contact-submit" disabled={!contactApi || isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default App
