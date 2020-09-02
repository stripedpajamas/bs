const { createServer } = require('http')
const { on } = require('events')

function handleIndex (req, res) {
  res.end(JSON.stringify({
    apiVersion: '1',
    author: 'stripedpajamas',
    color: '#ffff00',
    head: 'tongue',
    tail: 'curled'
  }))
}

function handleStart (req, res, states) {
  res.end()
}

function handleMove (req, res, states) {
  res.end(JSON.stringify({
    move: 'left'
  }))
}

function handleEnd (req, res, states) {
  res.end()
}

async function main () {
  const server = createServer().listen(3000)
  const reqs = on(server, 'request')

  const handlers = new Map([
    ['/', handleIndex],
    ['/start', handleStart],
    ['/move', handleMove],
    ['/end', handleEnd]
  ])

  const gameStates = new Map()

  for await (const [req, res] of reqs) {
    res.setHeader('content-type', 'application/json')

    console.error({ url: req.url })
    if (handlers.has(req.url)) {
      try {
        await handlers.get(req.url)(req, res, gameStates)
      } catch (e) {
        console.error(e)
        res.writeHead(500).end()
      }
    } else {
      res.writeHead(404).end()
    }
  }
}

main()
