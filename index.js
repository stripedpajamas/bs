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

function isSafe (loc, board) {
  const [x, y] = loc
  const { snakes } = board
  
  // edges
  if (x >= board.width || x < 0 || y >= board.height || y < 0) {
    console.error({ loc }, 'goes off board')
    return false
  }

  // snakes
  const snakeInTheWay = snakes.some((snake) => {
    const { body } = snake
    return body.some((bodyPart) => x === bodyPart.x && y === bodyPart.y)
  })

  if (snakeInTheWay) {
    console.error({ loc }, 'bumps into a snake')
    return false
  }

  return true
}

async function handleMove (req, res, states) {
  const { game, turn, board, you } = await parseBody(req)
  console.error('Move request game id %s, turn %d; %d x %d board', game.id, turn, board.height, board.width)

  // determine possible next spots
  const { head } = you
  const { snakes } = board
  const nextMoves = [
    { loc: [head.x, head.y + 1], move: 'up' },
    { loc: [head.x, head.y - 1], move: 'down' },
    { loc: [head.x + 1, head.y], move: 'right' },
    { loc: [head.x - 1, head.y], move: 'left' }
  ].filter(({ loc, move }) => {
    if (!isSafe(loc, board)) return false

    const [x, y] = loc

    // does move have a way out? e.g. am i blocking myself in?
    const tilesAroundDestination = [
      [x, y + 1],
      [x, y - 1],
      [x + 1, y],
      [x - 1, y]
    ]

    if (!tilesAroundDestination.some((tile) => isSafe(tile, board))) return false

    return true
  })

  console.error('Next moves', JSON.stringify(nextMoves))

  if (nextMoves.length < 1) {
    return res.end(JSON.stringify({ move: 'up', shout: "What's dead may never die" }))
  }

  const { move } = nextMoves[Math.floor(Math.random() * nextMoves.length)]
  res.end(JSON.stringify({ move }))
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
