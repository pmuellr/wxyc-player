// runkit notebook https://runkit.com/pmuellr/wxyc-playlist
// curl -L https://pmuellr.runkit.io/wxyc-playlist/branches/master

exports.endpoint = requestHandler

const request = require('request')

// runkit endpoint
function requestHandler (request, response) {
  // get the playlist data, and write as the response
  getPlayList((err, data) => {
    if (err) data = { error: `${err}` }

    // use CORS
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.end(JSON.stringify(data))
  })
}

// get the playlist data
function getPlayList (cb) {
  const url = 'http://www.wxyc.info/playlists/recent'
  request(url, requestHandler)

  function requestHandler (err, response, body) {
    if (err) return cb(err)

    // replace \n with space to make it easier to regex through
    body = body
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\t/g, ' ')

    // extract tables from html, only interested in the second one
    const tables = getTables(body)
    if (tables[1] == null) return cb(new Error('second table not found'))

    // get the rows from the table
    const rows = getRows(tables[1])

    // drop the first row
    rows.shift()

    // get the first 10 songs
    const songs = []
    for (let row of rows) {
      if (row.length !== 6) continue

      songs.push({
        song: row[2],
        artist: row[1],
        release: row[3],
        label: row[4],
        playlist: row[0] !== '',
        request: row[5] !== ''
      })

      if (songs.length === 10) break
    }

    // get the DJ
    // row: 'START OF SHOW: Jakob B + Co. SIGNED ON at 11:59 PM (10/9/17)'
    let dj = 'unknown'
    let djStartTime = 'unknown'

    for (let row of rows) {
      if (row.length !== 1) continue
      if (!row[0].startsWith('START OF SHOW:')) continue

      const match = row[0].match(/START OF SHOW: (.*) SIGNED ON at (.*) \(.*/)
      if (match == null) continue

      dj = match[1]
      djStartTime = match[2]
      break
    }

    cb(null, {
      songs: songs,
      dj: dj,
      djStartTime: djStartTime
    })
  }
}

// get the body of table row elements in a table
function getRows (html) {
  const rows = []

  // split into rows
  while (html !== '') {
    const match = html.match(/.*?<tr.*?>(.*?)<\/tr>(.*)/i)
    if (match == null) break

    rows.push(match[1])
    html = match[2]
  }

  // split rows into cells
  return rows.map(getCells)
}

function getCells (html) {
  const cells = []

  while (html !== '') {
    const match = html.match(/.*?<t(h|d).*?>(.*?)<\/t(h|d)>(.*)/i)
    if (match == null) break

    cells.push(match[2])
    html = match[4]
  }

  return cells
}

// get the body of table elements in the html
function getTables (html) {
  const result = []

  while (html !== '') {
    const match = html.match(/.*?<table.*?>(.*?)<\/table>(.*)/i)
    if (match == null) return result

    result.push(match[1])
    html = match[2]
  }

  return result
}

// tester to run from command-line
function main () {
  getPlayList((err, data) => {
    if (err) {
      console.log('error:', err)
      return
    }

    console.log(JSON.stringify(data, null, 4))
  })
}

if (require.main === module) main()
