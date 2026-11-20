import { useEffect } from 'react'
import { portfolioAsset } from './portfolioPaths.js'

const caseStudies = [
  {
    id: 'bugs-finder',
    title: 'Bugs Finder',
    summary: 'An AI-assisted code debugger that explains likely bugs and suggests fixes.',
    stack: ['React', 'Django REST', 'Gemini', 'PostgreSQL'],
    demo: 'https://bikas15.github.io/-bugs_finder/#/',
    source: 'https://github.com/bikas15/-bugs_finder',
    presentation: 'bug-finder-presentation.pdf',
    image: 'portfolio/bugs-finder-workspace.jpg',
    imageWidth: 1536,
    imageHeight: 639,
    imageAlt: 'Signed-in Bugs Finder workspace showing a sample Python snippet, the Analyse Code button, and the output panel.',
    caption: 'Bugs Finder code editor after sign-in',
    problem: 'When code fails, developers need to understand the cause and know what to try next.',
    workflow: 'Submit a code snippet, review the AI analysis and suggested fixes, then save the result as a report in your account.',
    contribution: 'I built the React interface and Django REST API, integrated Gemini on the server, and added sign-in and per-account report history.',
  },
  {
    id: 'hostel-hub',
    title: 'Hostel Hub',
    summary: 'A map-based hostel finder for students in Kathmandu and nearby cities.',
    stack: ['React', 'Leaflet', 'Node.js', 'MongoDB'],
    demo: 'https://bikas15.github.io/Hostel-Khojau/#/',
    source: 'https://github.com/bikas15/Hostel-Khojau',
    image: 'portfolio/hostel-hub-map.jpg',
    imageWidth: 1265,
    imageHeight: 712,
    imageAlt: 'Hostel Hub map search showing filters, a map of Kathmandu, and hostel listings.',
    caption: 'Map search in Hostel Hub',
    attribution: { label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright' },
    problem: 'Students need to compare prices and see how close each hostel is to campus before arranging a visit.',
    workflow: 'Filter by city, hostel type and price, then switch between the map and list to compare options and open a listing.',
    contribution: 'Developed Hostel Hub end to end with responsive map search, an Express API, and MongoDB data models.',
  },
]

export default function ProjectCaseStudies({ showOpening }) {
  useEffect(() => {
    const id = location.hash.slice(1)
    if (!showOpening || !caseStudies.some(project => project.id === id)) return
    let active = true
    function revealCaseStudy() {
      document.fonts.ready.then(() => {
        if (active && location.hash === '#' + id) {
          document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
        }
      })
    }
    if (document.readyState === 'complete') revealCaseStudy()
    else window.addEventListener('load', revealCaseStudy, { once: true })
    return () => {
      active = false
      window.removeEventListener('load', revealCaseStudy)
    }
  }, [showOpening])

  return <section id="projects" className="projects">
    <h2>Projects</h2>
    {caseStudies.map(project => (
      <article key={project.id} id={project.id} className="featured-project" aria-labelledby={project.id + '-title'}>
        <div className="featured-project-intro">
          <h3 id={project.id + '-title'}>{project.title}</h3>
          <p className="featured-project-summary">{project.summary}</p>
          <ul className="featured-project-stack" aria-label="Technology stack">
            {project.stack.map(technology => <li className="tech-tag" key={technology}>{technology}</li>)}
          </ul>
          <div className="featured-project-actions">
            <a className="featured-project-demo" href={project.demo} target="_blank" rel="noopener noreferrer">Live demo</a>
            <a className="featured-project-source" href={project.source} target="_blank" rel="noopener noreferrer">GitHub</a>
            {project.presentation && (
              <a className="featured-project-source" href={portfolioAsset(project.presentation)} target="_blank" rel="noopener noreferrer">View PPT</a>
            )}
          </div>
        </div>

        <figure className="featured-project-preview">
          <img src={portfolioAsset(project.image)} width={project.imageWidth} height={project.imageHeight} loading="lazy" decoding="async" alt={project.imageAlt} />
          <figcaption>
            <span>{project.caption}</span>
            {project.attribution && (
              <a href={project.attribution.url} target="_blank" rel="noopener noreferrer">{project.attribution.label}</a>
            )}
          </figcaption>
        </figure>

        <div className="featured-project-details">
          <div>
            <h4>The problem</h4>
            <p>{project.problem}</p>
          </div>
          <div>
            <h4>How it works</h4>
            <p>{project.workflow}</p>
          </div>
          <div>
            <h4>My contribution</h4>
            <p>{project.contribution}</p>
          </div>
        </div>
      </article>
    ))}
  </section>
}
