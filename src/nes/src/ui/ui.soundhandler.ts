import { EventEmitter } from "events";

const AUDIO_BUFFER_LENGTH = 4096;
const AUDIO_SAMPLE_RATE = 44100;

export class UiSoundHandler {
    private _audioContext: AudioContext;
    private _gainNode: GainNode;
    private _masterVolume: number;
    private _buffer: AudioBuffer;
    private _bufferSource: AudioBufferSourceNode;
    private _bufferDataQueue: number[];
    private _eventListener: EventEmitter;

    constructor(masterVolume: number, eventListener: EventEmitter) {
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
        this._eventListener = eventListener;

        this._eventListener.on("onsamplereceive", this._receivedAudioSample);
    }

    private _receivedAudioSample = (value: number) => {
        if(this._bufferDataQueue.length >= AUDIO_BUFFER_LENGTH) {
            
            const bufferData = this._buffer.getChannelData(0);
            bufferData.set(this._bufferDataQueue);

            this._bufferSource = this._audioContext.createBufferSource();
            this._bufferSource.buffer = this._buffer;
            this._bufferSource.connect(this._gainNode);

            this._bufferDataQueue = [];

            this._bufferSource.start();
        }

        this._bufferDataQueue.push(value);

    }
}