/**
 * soundhandler.ts
 *
 * Roger Ngo, 2019
 */
import { AUDIO_BUFFER_LENGTH, AUDIO_SAMPLE_RATE } from "../apu/constants";

export class UiSoundHandler {
  private _audioContext: AudioContext;
  private _gainNode: GainNode;
  private _masterVolume: number;
  private _buffer: AudioBuffer;
  private _bufferSource: AudioBufferSourceNode;
  private _bufferDataQueue: number[];
  private _bufferData: Float32Array;
  private _currIndex: number;

  constructor(masterVolume: number) {
    this._audioContext = new AudioContext();
    this._masterVolume = masterVolume;

    this._gainNode = this._audioContext.createGain();
    this._gainNode.gain.value = this._masterVolume;
    this._gainNode.connect(this._audioContext.destination);

    this._buffer = this._audioContext.createBuffer(
      1,
      AUDIO_BUFFER_LENGTH,
      AUDIO_SAMPLE_RATE
    );
    this._bufferData = this._buffer.getChannelData(0);

    this._bufferDataQueue = [];
    for (let i = 0; i < AUDIO_BUFFER_LENGTH; i++) {
      this._bufferDataQueue[i] = 0;
    }
    this._currIndex = 0;
  }

  /**
   * Adds the value to the data queue so that it can be outputted to the audio
   * device once the buffer queue is full.
   *
   * @param value floating point value representing the sample
   */
  public receiveSample(value: number) {
    if (this._currIndex === AUDIO_BUFFER_LENGTH) {
      this._bufferData.set(this._bufferDataQueue);

      this._bufferSource = this._audioContext.createBufferSource();
      this._bufferSource.buffer = this._buffer;
      this._bufferSource.connect(this._gainNode);

      this._currIndex = 0;

      this._bufferSource.start();
    }

    this._bufferDataQueue[this._currIndex++] = value;
  }
}
