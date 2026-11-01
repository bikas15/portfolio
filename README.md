# Bikas Portfolio

Personal portfolio website built with React and Vite.

## Run locally

```bash
npm ci
npm run dev
```

Create and preview a production build with:

```bash
npm run build
npm run preview
```

## Contact Form and MongoDB

The contact form sends submissions to the Express API in `server/`, which stores
them in the `contactMessages` collection in MongoDB. GitHub Pages serves static
files only, so the API must run separately and MongoDB credentials must stay on
the API host.

Deploy the API on Render using the repository's `render.yaml` Blueprint. Set
the private `MONGODB_URI` environment variable in Render; never commit the
connection string or put it in the frontend. The blueprint restricts CORS to
`https://bikas15.github.io`.

In the GitHub repository, add the Actions repository variable
`VITE_CONTACT_API_URL` with the public URL of the deployed Render API. The
GitHub Pages workflow uses this variable when building the frontend.

GitHub Actions publishes the site to GitHub Pages whenever a commit is pushed
to `main`: https://bikas15.github.io/portfolio/. The Bug Finder and Hostel Hub
cards link to their source repositories.

To run the API locally, copy `server/.env.example` to `server/.env`, set
`MONGODB_URI`, then run:

```bash
cd server
npm install
npm run dev
```

Create `.env.local` in the project root with
`VITE_CONTACT_API_URL=http://localhost:3001` and rebuild the frontend.

The API exposes `GET /health` for deployment checks and `POST /api/contact`
for new messages. Submitted records include `name`, `email`, optional `phone`,
`message`, and automatic `createdAt` / `updatedAt` timestamps.

## License

MIT
