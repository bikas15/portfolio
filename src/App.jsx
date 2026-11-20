import { useState } from 'react'
import './App.css'
import ProjectCaseStudies from './ProjectCaseStudies.jsx'
import brandLogo from '../bikaslogo.png'
import { portfolioAsset } from './portfolioPaths.js'

const email = 'bikashbanjade15@gmail.com'
const github = 'https://github.com/bikas15'

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

    const apiUrl = import.meta.env.VITE_CONTACT_API_URL?.replace(/\/+$/, '')
    if (!apiUrl) {
      setSubmitError(true)
      setSubmitMessage('Contact form is not configured. Please try again later.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to send your message.')
      }

      setSubmitMessage('Message sent successfully!')
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch (error) {
      console.error('Contact form submission failed:', error)
      setSubmitError(true)
      setSubmitMessage(error.message || 'Unable to send your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-container">
      <div className="opening-intro" hidden={!showOpening} aria-hidden="true">
        <div className="opening-composition">
          <div className="opening-name">
            <span><b>Bikas</b></span>
            <span><b>Banjade</b></span>
          </div>
          <div className="opening-tiles">
            {[4, 2, 3, 1, 0, 5, 6, 7, 8].map(step => (
              <span key={step} style={{ '--tile-delay': `${130 + step * 54}ms` }} />
            ))}
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav className="navbar">
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
            <li><a href="#about">About</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <button className="portfolio-theme-switch" type="button" aria-label="Flip the Switch" title="Open Bikas Desk" data-pointer-label="ENTER" onClick={onDarkMode}>
            <span className="portfolio-mode-moon" aria-hidden="true" /><span className="portfolio-theme-label">Flip the Switch</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content">
          <h1>Hi,<br />I'm Bikas</h1>
          <h2>A software engineer.</h2>
        </div>
        <div className="hero-image">
          <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/perfil.jpg" alt="Profile" />
        </div>
      </section>

      <div className="explore-text">
        <h2>Feel Free to Explore my Website!</h2>
      </div>

      <ProjectCaseStudies showOpening={showOpening} />

      {/* About Section */}
      <section id="about" className="about">
        <h2>About</h2>
        <div className="about-content">
          <div className="about-image">
            <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/bikas.jpg" alt="About Me" />
          </div>
          <div className="about-text">
            <p>
              HI! I'm Bikas and I am currently studying Software Engineering at Nepal College of Information Technology. 
              I am a tech enthusiast from Pyuthan. I'm super interested in new technologies. I am trying my best to learn 
              different technologies that interests me and also pursuing my engineering career. I am not sure what I want 
              my main focus to be on. But for now I am just exploring different fields.
            </p>
            <p><strong>In short:</strong> A guy not sure what he is doing but trying to figure it out.</p>
            <a className="about-cv-link" href={portfolioAsset('Bikas-Banjade-CV.pdf')} target="_blank" rel="noopener noreferrer">
              View CV ↗
            </a>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="skills">
        <h2>Skills</h2>
        <div className="skills-grid">
          <div className="skill-item">
            <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/js.png" alt="JavaScript" />
          </div>
          <div className="skill-item">
            <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/html.png" alt="HTML" />
          </div>
          <div className="skill-item">
            <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/css.png" alt="CSS" />
          </div>
          <div className="skill-item">
            <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/php.png" alt="PHP" />
          </div>
          <div className="skill-item">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/c/c-original.svg" alt="C" />
          </div>
          <div className="skill-item">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/cplusplus/cplusplus-original.svg" alt="C++" />
          </div>
          <div className="skill-item">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/java/java-original.svg" alt="Java" />
          </div>
        </div>
      </section>

      {/* Contact Section */}
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
        <form className="portfolio-contact-form" onSubmit={handleSubmit}>
          <div className="portfolio-form-row">
            <label>Name<input name="name" autoComplete="name" maxLength={100} value={formData.name} onChange={handleInputChange} required /></label>
            <label>Email<input type="email" name="email" autoComplete="email" maxLength={254} value={formData.email} onChange={handleInputChange} required /></label>
          </div>
          <label><span>Phone <small>(optional)</small></span><input type="tel" name="phone" autoComplete="tel" maxLength={30} value={formData.phone} onChange={handleInputChange} /></label>
          <label>Message<textarea name="message" rows={4} maxLength={5000} value={formData.message} onChange={handleInputChange} required /></label>
          {submitMessage && <p role="status" className={submitError ? 'portfolio-form-error' : 'portfolio-form-success'}>{submitMessage}</p>}
          <button type="submit" className="portfolio-contact-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send message'} <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>
    </div>
  )
}

export default App
