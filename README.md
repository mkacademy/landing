# MK Academy Landing

Static marketing site for the MK Academy platform. Serve `index.html` from any static host or CDN.

## Development

```bash
npm run dev
```

Opens at http://localhost:4000. In dev, links to `studio.mkacademy.ca`, `images.mkacademy.ca`, and `videos.mkacademy.ca` are rewritten to the local ports below (`http://localhost:3000`, etc.). Production deploys serve `index.html` unchanged via `npm run preview` or any static host.

## Local dev ports (all four repos)

| Repo | `npm run dev` | `npm run preview` |
|------|---------------|-------------------|
| `studio` | http://localhost:3000 | http://localhost:3003 |
| `images` | http://localhost:3001 | http://localhost:3005 |
| `videos` | http://localhost:3002 | http://localhost:3007 |
| `landing` | http://localhost:4000 | http://localhost:4000 |
