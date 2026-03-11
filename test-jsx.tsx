import { Hono } from 'hono'

const app = new Hono()

app.get('/test', (c) => {
  return c.html(<div>Hello JSX</div>)
})

console.log('Testing JSX...')

Deno.serve(app.fetch)
