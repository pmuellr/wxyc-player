'use strict'

const PlaylistUpdateSeconds = 15

var color
var colors = ['#7BAFD4', '#EEEEEE']
var colorIndex = 1

setTimeout(changeBackgroundColor, 1)
setInterval(changeBackgroundColor, 10000)
setInterval(updatePlaylistWithRetries, PlaylistUpdateSeconds * 1000)

updatePlaylistWithRetries()

function changeBackgroundColor () {
  colorIndex = (colorIndex + 1) % 2
  color = colors[colorIndex]
  document.body.style.backgroundColor = color
}

function updatePlaylistWithRetries () {
  let retries = 0

  getPlaylist(gotPlaylist)

  function gotPlaylist (err, data) {
    if (err == null) return updatePlaylist(err, data)

    retries++
    if (retries > 5) return updatePlaylist(err, data)
    getPlaylist(gotPlaylist)
  }
}

function updatePlaylist (err, data) {
  // data: {
  //   songs: : [ {song, artist, release, label, playlist, request } ],
  //   dj: aString,
  //   djStartTime: '6:03 AM'
  // }

  let songInfo = ''
  let djInfo = ''

  if (err) {
    songInfo = `error getting playlist: ${err.message}`
  } else {
    const song = data.songs[0]
    songInfo = `
      "<b>${sanitize(song.song)}</b>"
      by
      <b>${sanitize(song.artist)}</b>
      from
      "<b>${sanitize(song.release)}</b>"`
    djInfo = `
      show:
      <b>${sanitize(data.dj)}</b>
      since
      <b>${sanitize(data.djStartTime)}</b>`
  }

  document.getElementById('pl-song-info').innerHTML = songInfo
  document.getElementById('pl-dj-info').innerHTML = djInfo
}

function getPlaylist (cb) {
  // set headers
  const headers = new window.Headers()
  headers.append('Accept', 'application/json')

  // set options
  const opts = {
    method: 'GET',
    headers: headers,
    cache: 'no-store'
  }

  // make the request
  const url = 'https://pmuellr.runkit.io/wxyc-playlist/branches/master'
  const request = new window.Request(url, opts)
  window.fetch(request).then(processResponse).catch(cb)

  // handle a response that made it to the server
  function processResponse (response) {
    // if not a 2xx response, cb with error
    if (!response.ok) {
      const message = `response ${response.status} from GET ${url}`
      return cb(new Error(message))
    }

    // process the body of the response, cb with error on error
    response.json().then(cbWithData).catch(cb)
  }

  // call the callback with the data
  function cbWithData (data) {
    if (data.error) return cb(new Error(data.error))
    cb(null, data)
  }
}

function sanitize (string) {
  return string
  .replace('&', '&amp;')
    .replace('<', '&lt;')
    .replace('>', '&gt;')
}
