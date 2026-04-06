import '@testing-library/jest-dom'

// Stub Web Audio API for unit tests (Tone.js requires it)
class AudioContextStub {
  state = 'suspended'
  sampleRate = 44100
  destination = {}
  createGain() { return { connect: () => {}, gain: { value: 1 } } }
  createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 440 } } }
  resume() { return Promise.resolve() }
  close() { return Promise.resolve() }
}

Object.defineProperty(window, 'AudioContext', { value: AudioContextStub, writable: true })
Object.defineProperty(window, 'webkitAudioContext', { value: AudioContextStub, writable: true })
