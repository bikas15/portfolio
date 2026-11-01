import { useState } from 'react'
import './App.css'

// SVG placeholder component
const PlaceholderImage = ({ width = 300, height = 300, text = 'Image' }) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
    <rect width={width} height={height} fill="#e0e0e0" />
    <circle cx={width/2} cy={height/2 - 40} r="40" fill="#999" />
    <path d={`M${width/2 - 60} ${height/2 + 20} L${width/2} ${height/2 + 60} L${width/2 + 60} ${height/2 + 20}`} fill="#999" />
    <text x={width/2} y={height - 20} textAnchor="middle" fill="#666" fontSize="16">{text}</text>
  </svg>
)

const projectLinks = {
  bugFinder: 'https://bikas15.github.io/-bugs_finder/#/',
  hostelHub: 'https://bikas15.github.io/Hostel-Khojau/#/'
}

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openProject = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

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
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">⚙️</span>
            <span className="logo-text">Bikas</span>
          </div>
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
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
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="projects">
        <h2>Projects</h2>
        <div className="projects-grid">
          <div className="project-card">
            <a className="project-card-link" href={projectLinks.bugFinder} target="_blank" rel="noreferrer">
              <div className="project-image">
                <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/perfil.jpg" alt="Bugs Finder" />
              </div>
              <div className="project-content">
                <h3>Bugs Finder</h3>
                <p>Open the Bug Finder application.</p>
                <div className="project-tech">
                  <span className="tech-tag">React</span>
                  <span className="tech-tag">Django</span>
                  <span className="tech-tag">MySQL</span>
                </div>
              </div>
            </a>
            <div className="project-actions">
              <button type="button" className="btn-link" onClick={() => openProject(projectLinks.bugFinder)}>Open Website</button>
            </div>
          </div>

          <div className="project-card">
            <a className="project-card-link" href={projectLinks.hostelHub} target="_blank" rel="noreferrer">
              <div className="project-image">
                <img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80" alt="Hostel Hub" />
              </div>
              <div className="project-content">
                <h3>Hostel Hub</h3>
                <p>Open the Hostel Hub application.</p>
                <div className="project-tech">
                  <span className="tech-tag">React</span>
                  <span className="tech-tag">Node</span>
                  <span className="tech-tag">MongoDB</span>
                </div>
              </div>
            </a>
            <div className="project-actions">
              <button type="button" className="btn-link" onClick={() => openProject(projectLinks.hostelHub)}>Open Website</button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <h2>Contact</h2>
        <div className="contact-content">
          <form className="contact-form" onSubmit={handleSubmit}>
            {submitMessage && (
              <div className={`submit-message${submitError ? ' error' : ''}`} role="status" aria-live="polite">
                {submitMessage}
              </div>
            )}
            <div className="form-group">
              <label>Name :</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                maxLength="100"
                required
              />
            </div>
            <div className="form-group">
              <label>Email :</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your email"
                maxLength="254"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number :</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Your phone number"
                maxLength="30"
              />
            </div>
            <div className="form-group">
              <label>Message :</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Your message"
                rows="5"
                maxLength="5000"
                required
              ></textarea>
            </div>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Submit Now'}
            </button>
          </form>

          <div className="contact-info">
            <h3>Mail:</h3>
            <a href="mailto:bikashbanjade15@gmail.com">bikashbanjade15@gmail.com</a>

            <h3>You can also find me on:</h3>
            <div className="social-links">
              <a href="https://www.facebook.com/bikash.banjade15/" target="_blank" rel="noopener noreferrer" title="Facebook">
                <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/facebook.jpg" alt="Facebook" className="social-icon-img" />
              </a>
              <a href="https://www.instagram.com/bikas.banjade22/" target="_blank" rel="noopener noreferrer" title="Instagram">
                <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/instra.jpg" alt="Instagram" className="social-icon-img" />
              </a>
              <a href="mailto:bikashbanjade15@gmail.com" target="_blank" rel="noopener noreferrer" title="Gmail">
                <img src="https://raw.githubusercontent.com/bikas15/protfolio/main/gmail.png" alt="Gmail" className="social-icon-img" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
