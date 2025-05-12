const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

// serve your static files (html + p5 sketch)
app.use(express.static('public'))

// keep running sums and count
let sum = { pot0:0, pot1:0, pot2:0 }
let count = 0
let modeVotes = {}      // count votes per mode
let toggleSums = { q:0, e:0, t:0, life:0 }

io.on('connection', socket => {
  // send current aggregate to newcomer
  if (count > 0) {
    const avg = {
      pot0: sum.pot0/count,
      pot1: sum.pot1/count,
      pot2: sum.pot2/count,
      mode: Object.entries(modeVotes).sort((a,b)=>b[1]-a[1])[0][0] || 1,
      qMode: toggleSums.q>0,
      eMode: toggleSums.e>0,
      tMode: toggleSums.t>0,
      lifeOn: toggleSums.life>0
    }
    socket.emit('stateUpdate', avg)
  }

  socket.on('inputUpdate', data => {
    // update sums
    sum.pot0 += data.pot0
    sum.pot1 += data.pot1
    sum.pot2 += data.pot2
    count++

    // tally mode votes
    modeVotes[data.mode] = (modeVotes[data.mode]||0)+1

    // tally toggles
    if (data.qMode) toggleSums.q++
    if (data.eMode) toggleSums.e++
    if (data.tMode) toggleSums.t++
    if (data.lifeOn) toggleSums.life++

    // compute aggregate
    const aggregate = {
      pot0: sum.pot0/count,
      pot1: sum.pot1/count,
      pot2: sum.pot2/count,
      mode: Number(Object.entries(modeVotes).sort((a,b)=>b[1]-a[1])[0][0]),
      qMode: toggleSums.q > count/2,
      eMode: toggleSums.e > count/2,
      tMode: toggleSums.t > count/2,
      lifeOn: toggleSums.life > count/2
    }

    io.emit('stateUpdate', aggregate)
  })
})

server.listen(3000, ()=>console.log('listening on port 3000'))
