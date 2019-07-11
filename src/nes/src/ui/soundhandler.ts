import { AUDIO_BUFFER_LENGTH, AUDIO_SAMPLE_RATE } from "../apu/constants";

export class UiSoundHandler {
  private _audioContext: AudioContext;
  private _gainNode: GainNode;
  private _masterVolume: number;
  private _buffer: AudioBuffer;
  private _bufferSource: AudioBufferSourceNode;
  private _bufferDataQueue: number[];

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

    this._bufferDataQueue = [];
  }

  public receiveSample(value: number) {
    if (this._bufferDataQueue.length >= AUDIO_BUFFER_LENGTH) {
      const bufferData = this._buffer.getChannelData(0);
      bufferData.set(this._bufferDataQueue.slice(0, AUDIO_BUFFER_LENGTH));

      this._bufferSource = this._audioContext.createBufferSource();
      this._bufferSource.buffer = this._buffer;
      this._bufferSource.connect(this._gainNode);

      this._bufferDataQueue = this._bufferDataQueue.slice(AUDIO_BUFFER_LENGTH);

      this._bufferSource.start();
    }

    this._bufferDataQueue.push(value);
  }
}
