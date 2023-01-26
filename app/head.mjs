import { getLinkTag } from '@enhance/arc-plugin-styles/get-styles'

export default function Head(state) {
  const { store, status, req, error } = state
  const { path } = req
  const title = `My app — ${path}`
  return `
    <!DOCTYPE html>
    <html lang="en" data-theme="light">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      ${getLinkTag()}
      <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css">
      <link rel="icon" href="/_public/favicon.svg">
    </head>
  `
}
