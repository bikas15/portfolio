import { useRef } from 'react'
import { portfolioAsset } from './portfolioPaths.js'
import { caseStudies } from './portfolioProjects.js'

function ProjectPreview({ project }) {
  const dialog = useRef(null)
  const titleId = project.id + '-preview-title'
  const imageUrl = portfolioAsset(project.image)

  return <figure className="featured-project-preview">
    <button className="project-preview-button" type="button" aria-label={'Enlarge ' + project.title + ' screenshot'} onClick={() => dialog.current.showModal()}>
      <img src={imageUrl} width={project.imageWidth} height={project.imageHeight} loading="lazy" decoding="async" alt={project.imageAlt} />
      <span aria-hidden="true">Enlarge ↗</span>
    </button>
    <figcaption>
      <span>{project.caption}</span>
      {project.attribution && <a href={project.attribution.url} target="_blank" rel="noopener noreferrer">{project.attribution.label}</a>}
    </figcaption>
    <dialog ref={dialog} className="project-image-dialog" aria-labelledby={titleId}>
      <div className="project-image-dialog-header">
        <h4 id={titleId}>{project.title} preview</h4>
        <button type="button" className="portfolio-button portfolio-button-outline" onClick={() => dialog.current.close()} autoFocus>Close</button>
      </div>
      <img src={imageUrl} width={project.imageWidth} height={project.imageHeight} loading="lazy" alt={project.imageAlt} />
    </dialog>
  </figure>
}

export default function ProjectCaseStudies({ onDarkMode }) {
  return <section id="projects" className="portfolio-projects" aria-labelledby="projects-title">
    <div className="portfolio-section-title">
      <h2 id="projects-title">Selected work<span aria-hidden="true">.</span></h2>
      <ul className="portfolio-work-index" aria-label="Jump to a project">
        {caseStudies.map(project => <li key={project.id}><a href={'#' + project.id}>{project.title} <span aria-hidden="true">↓</span></a></li>)}
        <li><a href="#desk-preview">Bikas Desk <span aria-hidden="true">↓</span></a></li>
      </ul>
    </div>
    {caseStudies.map(project => (
      <article key={project.id} id={project.id} className="featured-project" data-project={project.id} aria-labelledby={project.id + '-title'}>
        <div className="featured-project-intro">
          <h3 id={project.id + '-title'}>{project.title}</h3>
          <p className="featured-project-summary">{project.summary}</p>
          <ul className="featured-project-stack" aria-label="Technology stack">
            {project.stack.map(technology => <li className="tech-tag" key={technology}>{technology}</li>)}
          </ul>
          <div className="featured-project-actions">
            <a className="portfolio-button portfolio-button-primary" href={project.demo} target="_blank" rel="noopener noreferrer">Live demo <span aria-hidden="true">↗</span></a>
            <a className="portfolio-button portfolio-button-outline" href={project.source} target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
            {project.presentation && (
              <a className="portfolio-button portfolio-button-outline" href={portfolioAsset(project.presentation)} target="_blank" rel="noopener noreferrer">Slides <span aria-hidden="true">↗</span></a>
            )}
          </div>
        </div>

        <ProjectPreview project={project} />

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
        <details className="project-engineering">
          <summary>Engineering notes</summary>
          <p>{project.engineering}</p>
        </details>
      </article>
    ))}
    <article id="desk-preview" className="portfolio-desk-preview" aria-labelledby="desk-preview-title">
      <div>
        <h3 id="desk-preview-title">Bikas Desk</h3>
        <p>I built a second way to explore this portfolio. Open projects in draggable windows, use the keyboard-driven terminal, or leave a note in the Scratchpad.</p>
        <button className="portfolio-button portfolio-button-primary" type="button" onClick={onDarkMode}>Open Bikas Desk <span aria-hidden="true">↗</span></button>
      </div>
      <img src={portfolioAsset('portfolio/bikas-desk-preview.jpg')} alt="Bikas Desk with the About window, app shortcuts and dock over a mountain landscape." width="1280" height="760" loading="lazy" decoding="async" />
    </article>
  </section>
}
