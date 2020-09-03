const { createServer } = require('http')
const { on } = require('events')

const parseBody = (req) => new Promise((resolve) => {
  const data = []
  req.on('data', chunk => { data.push(chunk) })
  req.on('end', () => { resolve(JSON.parse(data.join(''))) })
})

function handleIndex (req, res) {
  res.end(JSON.stringify({
    apiVersion: '1',
    author: 'stripedpajamas',
    color: '#2a0080',
    head: 'tongue',
    tail: 'curled'
  }))
}

function handleStart (req, res, states) {
  res.end()
}

async function handleMove (req, res, states) {
  const { game, turn, board, you } = await parseBody(req)
  console.error({ game, turn, board, you })
  const moves = ['up', 'down', 'left', 'right']
  const randomMove = moves[Math.floor(Math.random() * moves.length)]
  res.end(JSON.stringify({
    move: randomMove
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
