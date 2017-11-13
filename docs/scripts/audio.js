'use strict'

let audio

window.onload = onLoad

function onLoad () {
  const audioElement = document.querySelector('audio')
  const playPauseImg = document.querySelector('#play-pause')
  const messageElement = document.querySelector('#message')

  audio = new Audio(audioElement, playPauseImg, messageElement)
  audio.isPlaying()
}

class Audio {
  constructor (audioElement, playPauseImg, messageElement) {
    this._isPlaying = false
    this._audioElement = audioElement
    this._playPauseImg = playPauseImg
    this._messageElement = messageElement

    // this._audioElement.onerror = this._onError.bind(this)
    this._playPauseImg.onclick = this._playPauseClicked.bind(this)
  }

  _onError () {
    const message = getMediaError(this._audioElement)
    console.log('error:', message)
  }

  _playPauseClicked () {
    if (this.isPlaying()) {
      this.pause()
    } else {
      this.play()
    }
  }

  isPlaying () {
    return this._isPlaying
  }

  play () {
    if (this.isPlaying()) return
    this._isPlaying = true

    this._audioElement.src = 'http://audio-mp3.ibiblio.org:8000/wxyc.mp3'
    const startedPromise = this._audioElement.play()
    this._playPauseImg.src = 'images/media-pause.svg'

    this._displayMessage(`loading:<br>${this._audioElement.src}`)

    startedPromise
      .then(() => {
        this._displayMessage()
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 20) {
          this._displayMessage()
          return
        }

        const message = `error loading audio: ${err}`
        console.log(message)
        this._displayMessage(message)
      })
  }

  pause () {
    if (!this.isPlaying()) return
    this._isPlaying = false

    this._displayMessage()
    this._audioElement.src = ''
    this._playPauseImg.src = 'images/media-play.svg'

    this._audioElement.pause()
  }

  _displayMessage (message) {
    if (message == null || message.trim() === '') message = '&nbsp;'
    this._messageElement.innerHTML = message
  }
}

function getMediaError (element) {
  let err = element.error

  switch (err.code) {
    case 1: return 'The user canceled the audio.'
    case 2: return 'A network error occurred while fetching the audio.'
    case 3: return 'An error occurred while decoding the audio.'
    case 4: return 'The audio is missing or is in a format not supported by your browser.'
    default: return `An unknown error occurred: ${err.code}.`
  }
}
