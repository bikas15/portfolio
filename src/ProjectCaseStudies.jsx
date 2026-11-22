import { useRef, useState } from 'react'
import { portfolioAsset } from './portfolioPaths.js'
import { caseStudies } from './portfolioProjects.js'

export default function ProjectCaseStudies() {
  const screenshotDialog = useRef(null)
  const [preview, setPreview] = useState(null)
  const [actualSize, setActualSize] = useState(false)

  return <section id="projects" className="projects" aria-labelledby="projects-title">
    <h2 id="projects-title">Projects</h2>
    {caseStudies.map(project => (
      <article key={project.id} id={project.id} className="featured-project" data-with-preview={Boolean(project.image)} aria-labelledby={project.id + '-title'}>
        <div className="featured-project-intro">
          <h3 id={project.id + '-title'}>{project.title}</h3>
          <p className="featured-project-summary">{project.summary}</p>
          <ul className="featured-project-stack" aria-label="Technology stack">
            {project.stack.map(technology => <li className="tech-tag" key={technology}>{technology}</li>)}
          </ul>
          <div className="featured-project-actions">
            <a className="featured-project-demo" href={project.demo} target="_blank" rel="noopener noreferrer">Live demo</a>
            <a className="featured-project-source" href={project.source} target="_blank" rel="noopener noreferrer">{project.sourceIsPrivate ? 'GitHub (private)' : 'Source code'}</a>
            {project.presentation && (
              <a className="featured-project-source" href={portfolioAsset(project.presentation)} target="_blank" rel="noopener noreferrer">Slides</a>
            )}
          </div>
        </div>

        {project.image && <figure className="featured-project-preview">
          <button className="project-screenshot-trigger" type="button" aria-label={'Enlarge ' + project.title + ' screenshot'} onClick={() => {
            setPreview(project)
            screenshotDialog.current.showModal()
          }}>
            <img src={portfolioAsset(project.image)} width={project.imageWidth} height={project.imageHeight} loading="lazy" decoding="async" alt={project.imageAlt} />
            <span>Enlarge screenshot</span>
          </button>
          <figcaption>
            <span>{project.caption}</span>
            {project.attribution && (
              <a href={project.attribution.url} target="_blank" rel="noopener noreferrer">{project.attribution.label}</a>
            )}
          </figcaption>
        </figure>}

        <div className="featured-project-details">
          <div>
            <h4>The problem</h4>
            <p>{project.problem}</p>
          </div>
          <div>
            <h4>How it works</h4>
            <p>{project.workflow}</p>
          </div>
        </div>
      </article>
    ))}
    <dialog className="project-screenshot-dialog" aria-labelledby="screenshot-title" ref={screenshotDialog} onClose={() => {
      setPreview(null)
      setActualSize(false)
    }}>
      <div className="project-screenshot-header">
        <h2 id="screenshot-title">{preview ? preview.title + ' screenshot' : 'Project screenshot'}</h2>
        <form method="dialog">
          <button type="submit">Close</button>
          <button type="button" aria-pressed={actualSize} onClick={() => setActualSize(value => !value)}>Actual size</button>
        </form>
      </div>
      {preview && <div className="project-screenshot-scroll" data-actual-size={actualSize ? 'true' : undefined}
        tabIndex={actualSize ? 0 : undefined} role="region" aria-label="Screenshot viewer">
        <img src={portfolioAsset(preview.image)} width={preview.imageWidth} height={preview.imageHeight} alt={preview.imageAlt} />
      </div>}
    </dialog>
  </section>
}
