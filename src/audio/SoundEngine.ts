import { SoundGeneratorType } from '../types';

/**
 * Procedural Web Audio Engine for Luca Ambience.
 * Synthesizes realistic, continuous, zero-latency ambient textures
 * directly in browser memory without external network flakiness.
 */

const PRIMARY_CDN = 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/';
const FALLBACK_CDN = 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/';

interface ActiveVoice {
  id: string;
  audio?: HTMLAudioElement;
  audioPath?: string;
  baseVolume: number; // 0 to 1
  muted: boolean;
  fadeIntervalId?: number;
  isUsingFallback?: boolean;
  gainNode?: GainNode;
  nodes?: (AudioNode | number)[];
  intervalIds?: number[];
}

export class SoundEngine {
  private static instance: SoundEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private voices: Map<string, ActiveVoice> = new Map();
  private isMasterMuted: boolean = false;
  private masterVolume: number = 0.8; // 0 to 1

  // Mix Recording properties
  private recorder: MediaRecorder | null = null;
  private recorderDest: MediaStreamAudioDestinationNode | null = null;
  private recordChunks: BlobPart[] = [];
  private recordTimerId: number | null = null;
  private isCurrentlyRecording: boolean = false;

  private constructor() {}

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Create looped white noise buffer
  private createNoiseBuffer(duration = 4): AudioBuffer {
    const ctx = this.initContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Create pink noise buffer (1/f)
  private createPinkNoiseBuffer(duration = 4): AudioBuffer {
    const ctx = this.initContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // Create brown noise buffer (1/f^2)
  private createBrownNoiseBuffer(duration = 4): AudioBuffer {
    const ctx = this.initContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // boost level
    }
    return buffer;
  }

  public startSound(
    id: string,
    audioPathOrType: string,
    volumePercent: number,
    generatorType?: SoundGeneratorType
  ): void {
    const vol = Math.max(0, Math.min(1, volumePercent / 100));

    // If already active, just adjust volume and ensure playing
    const existing = this.voices.get(id);
    if (existing) {
      existing.baseVolume = vol;
      existing.muted = false;
      this.updateVoiceVolume(existing);
      if (existing.audio && existing.audio.paused) {
        existing.audio.play().catch(() => {});
      }
      return;
    }

    // Determine whether audioPath is a sound path or legacy generator type
    let audioPath = audioPathOrType;
    let genType: SoundGeneratorType | undefined = generatorType;
    if (
      !audioPath.includes('/') &&
      !audioPath.endsWith('.mp3') &&
      !audioPath.endsWith('.wav') &&
      !audioPath.endsWith('.ogg') &&
      !audioPath.startsWith('http')
    ) {
      genType = audioPath as SoundGeneratorType;
      audioPath = '';
    }

    const voice: ActiveVoice = {
      id,
      audioPath,
      baseVolume: vol,
      muted: false,
    };
    this.voices.set(id, voice);

    if (audioPath) {
      const audio = new Audio();
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';

      const targetVol = this.calculateEffectiveVolume(vol, false);
      audio.volume = 0;
      const isAbsolute = audioPath.startsWith('http://') || audioPath.startsWith('https://');
      audio.src = isAbsolute ? audioPath : PRIMARY_CDN + audioPath;

      // Connect to Web Audio masterGain so all audio flows through the master mixer and can be recorded
      let connectedToWebAudio = false;
      try {
        const ctx = this.initContext();
        const mediaSource = ctx.createMediaElementSource(audio);
        const voiceGain = ctx.createGain();
        voiceGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetVol), ctx.currentTime + 0.15);
        mediaSource.connect(voiceGain);
        voiceGain.connect(this.masterGain!);
        voice.gainNode = voiceGain;
        voice.nodes = [mediaSource, voiceGain];
        connectedToWebAudio = true;
      } catch (err) {
        console.warn(`[SoundEngine] Web Audio media element connection deferred for ${id}:`, err);
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!connectedToWebAudio) {
              this.fadeInAudio(audio, targetVol);
            }
          })
          .catch((err) => {
            console.warn(`[SoundEngine] Audio play interrupted for ${id}:`, err);
            if (genType) {
              this.startProceduralFallback(voice, genType);
            }
          });
      }

      let hasTriedFallback = false;
      audio.onerror = () => {
        if (!hasTriedFallback && !isAbsolute) {
          hasTriedFallback = true;
          audio.src = FALLBACK_CDN + audioPath;
          audio.play().catch(() => {
            if (genType) {
              this.startProceduralFallback(voice, genType);
            }
          });
        } else if (genType) {
          this.startProceduralFallback(voice, genType);
        }
      };

      voice.audio = audio;
    } else if (genType) {
      this.startProceduralFallback(voice, genType);
    }
  }

  private startProceduralFallback(voice: ActiveVoice, type: SoundGeneratorType): void {
    const ctx = this.initContext();
    if (!this.masterGain || voice.isUsingFallback) return;

    voice.isUsingFallback = true;
    const voiceGain = ctx.createGain();
    const effectiveVol = this.calculateEffectiveVolume(voice.baseVolume, voice.muted);
    voiceGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, effectiveVol), ctx.currentTime + 0.15);
    voiceGain.connect(this.masterGain);

    const activeNodes: (AudioNode | number)[] = [voiceGain];
    const intervals: number[] = [];

    this.buildVoiceGraph(type, voiceGain, activeNodes, intervals);

    voice.gainNode = voiceGain;
    voice.nodes = activeNodes;
    voice.intervalIds = intervals;
  }

  public stopSound(id: string): void {
    const voice = this.voices.get(id);
    if (!voice) return;

    if (voice.fadeIntervalId) {
      window.clearInterval(voice.fadeIntervalId);
      voice.fadeIntervalId = undefined;
    }

    if (voice.audio) {
      const audio = voice.audio;
      let currentVol = audio.volume;
      const step = Math.max(0.01, currentVol / 10);
      const interval = window.setInterval(() => {
        currentVol -= step;
        if (currentVol <= 0.01) {
          window.clearInterval(interval);
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.removeAttribute('src');
            audio.load();
          } catch {
            // ignore
          }
        } else {
          audio.volume = Math.max(0, currentVol);
        }
      }, 15);
    }

    if (voice.gainNode && this.ctx) {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      try {
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      } catch {
        voice.gainNode.gain.value = 0;
      }

      if (voice.intervalIds) {
        voice.intervalIds.forEach((timer) => window.clearInterval(timer));
      }

      setTimeout(() => {
        if (voice.nodes) {
          voice.nodes.forEach((node) => {
            if (typeof node !== 'number') {
              try {
                if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
                  (node as AudioScheduledSourceNode).stop();
                }
                node.disconnect();
              } catch {
                // ignore
              }
            }
          });
        }
      }, 200);
    }

    this.voices.delete(id);
  }

  public setSoundVolume(id: string, volumePercent: number): void {
    const voice = this.voices.get(id);
    if (!voice) return;

    voice.baseVolume = Math.max(0, Math.min(1, volumePercent / 100));
    this.updateVoiceVolume(voice);
  }

  public setSoundMute(id: string, muted: boolean): void {
    const voice = this.voices.get(id);
    if (!voice) return;

    voice.muted = muted;
    this.updateVoiceVolume(voice);
  }

  public setMasterVolume(percent: number): void {
    this.masterVolume = Math.max(0, Math.min(1, percent / 100));
    this.voices.forEach((voice) => this.updateVoiceVolume(voice));

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      const target = this.isMasterMuted ? 0.0001 : Math.max(0.0001, this.masterVolume);
      this.masterGain.gain.setTargetAtTime(target, now, 0.05);
    }
  }

  public setMasterMute(muted: boolean): void {
    this.isMasterMuted = muted;
    this.voices.forEach((voice) => this.updateVoiceVolume(voice));

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      const target = muted ? 0.0001 : Math.max(0.0001, this.masterVolume);
      this.masterGain.gain.setTargetAtTime(target, now, 0.05);
    }
  }

  public stopAll(): void {
    const keys = Array.from(this.voices.keys());
    keys.forEach((id) => this.stopSound(id));
  }

  // --- MIX RECORDING & AUDIO EXPORT CAPABILITIES ---

  public getAudioContext(): AudioContext {
    return this.initContext();
  }

  public isRecordingActive(): boolean {
    return this.isCurrentlyRecording;
  }

  public startRecording(onProgress?: (seconds: number) => void): boolean {
    if (this.isCurrentlyRecording) return false;

    try {
      const ctx = this.initContext();
      if (!this.masterGain) return false;

      this.recorderDest = ctx.createMediaStreamDestination();
      this.masterGain.connect(this.recorderDest);

      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      this.recorder = new MediaRecorder(this.recorderDest.stream, options);
      this.recordChunks = [];

      this.recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordChunks.push(event.data);
        }
      };

      this.recorder.start(250);
      this.isCurrentlyRecording = true;

      let elapsed = 0;
      if (onProgress) {
        onProgress(0);
        this.recordTimerId = window.setInterval(() => {
          elapsed += 1;
          onProgress(elapsed);
        }, 1000);
      }

      return true;
    } catch (err) {
      console.error('[SoundEngine] Failed to initialize recorder:', err);
      this.cleanupRecording();
      return false;
    }
  }

  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.isCurrentlyRecording || !this.recorder) {
        this.cleanupRecording();
        resolve(null);
        return;
      }

      const recorder = this.recorder;
      const mimeType = recorder.mimeType || 'audio/webm';

      recorder.onstop = () => {
        const rawBlob = new Blob(this.recordChunks, { type: mimeType });
        this.cleanupRecording();
        resolve(rawBlob);
      };

      try {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        } else {
          const rawBlob = new Blob(this.recordChunks, { type: mimeType });
          this.cleanupRecording();
          resolve(rawBlob);
        }
      } catch (e) {
        console.error('[SoundEngine] Error stopping recorder:', e);
        this.cleanupRecording();
        resolve(null);
      }
    });
  }

  private cleanupRecording(): void {
    if (this.recordTimerId) {
      window.clearInterval(this.recordTimerId);
      this.recordTimerId = null;
    }
    if (this.recorderDest && this.masterGain) {
      try {
        this.masterGain.disconnect(this.recorderDest);
      } catch {
        // ignore
      }
      this.recorderDest = null;
    }
    this.recorder = null;
    this.recordChunks = [];
    this.isCurrentlyRecording = false;
  }

  private calculateEffectiveVolume(baseVolume: number, muted: boolean): number {
    if (this.isMasterMuted || muted) return 0;
    return Math.max(0, Math.min(1, baseVolume * this.masterVolume));
  }

  private updateVoiceVolume(voice: ActiveVoice): void {
    const targetVol = this.calculateEffectiveVolume(voice.baseVolume, voice.muted);
    if (voice.audio) {
      voice.audio.volume = targetVol;
    }
    if (voice.gainNode && this.ctx) {
      const now = this.ctx.currentTime;
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setTargetAtTime(Math.max(0.0001, targetVol), now, 0.05);
    }
  }

  private fadeInAudio(audio: HTMLAudioElement, targetVol: number): void {
    if (targetVol <= 0) {
      audio.volume = 0;
      return;
    }
    let current = 0;
    audio.volume = 0;
    const step = targetVol / 10;
    const interval = window.setInterval(() => {
      current += step;
      if (current >= targetVol) {
        audio.volume = targetVol;
        window.clearInterval(interval);
      } else {
        audio.volume = Math.min(targetVol, current);
      }
    }, 15);
  }

  // Synthesizer voice graph generator
  private buildVoiceGraph(
    type: SoundGeneratorType,
    dest: GainNode,
    nodes: (AudioNode | number)[],
    intervals: number[]
  ): void {
    const ctx = this.initContext();

    switch (type) {
      case 'rain': {
        // Continuous filtered pink noise + intermittent gentle water droplets
        const src = ctx.createBufferSource();
        src.buffer = this.createPinkNoiseBuffer(5);
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1400;

        src.connect(filter);
        filter.connect(dest);
        src.start();
        nodes.push(src, filter);

        // Raindrop clicks
        const dropTimer = window.setInterval(() => {
          if (Math.random() > 0.4) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.setValueAtTime(1200 + Math.random() * 800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
            g.gain.setValueAtTime(0.08, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.connect(g);
            g.connect(dest);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          }
        }, 120);
        intervals.push(dropTimer);
        break;
      }

      case 'thunder': {
        // Deep low rumbling modulated noise bursts
        const noise = ctx.createBufferSource();
        noise.buffer = this.createBrownNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 180;

        const tremolo = ctx.createGain();
        tremolo.gain.value = 0.4;

        noise.connect(filter);
        filter.connect(tremolo);
        tremolo.connect(dest);
        noise.start();
        nodes.push(noise, filter, tremolo);

        // Periodic thunder roll swelling
        const thunderTimer = window.setInterval(() => {
          const now = ctx.currentTime;
          tremolo.gain.cancelScheduledValues(now);
          tremolo.gain.setValueAtTime(0.2, now);
          tremolo.gain.linearRampToValueAtTime(1.1, now + 1.2);
          tremolo.gain.exponentialRampToValueAtTime(0.15, now + 5.5);
        }, 8000);
        intervals.push(thunderTimer);
        break;
      }

      case 'ocean':
      case 'waves': {
        // Filtered pink noise modulated with an undulating 0.1Hz LFO swell
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 450;

        // LFO for ocean wave surge
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = type === 'waves' ? 0.14 : 0.09;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 350;

        lfo.connect(filter.frequency);

        const waveGain = ctx.createGain();
        waveGain.gain.value = 0.7;

        // Swell gain LFO
        const swellLfo = ctx.createOscillator();
        swellLfo.type = 'sine';
        swellLfo.frequency.value = type === 'waves' ? 0.14 : 0.09;
        const swellGain = ctx.createGain();
        swellGain.gain.value = 0.35;
        swellLfo.connect(swellGain);
        swellGain.connect(waveGain.gain);

        noise.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(dest);

        noise.start();
        lfo.start();
        swellLfo.start();
        nodes.push(noise, filter, lfo, lfoGain, swellLfo, swellGain, waveGain);
        break;
      }

      case 'river': {
        // High resonance bandpass bubbling pink noise
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(5);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 850;
        filter.Q.value = 2.5;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.4;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 250;
        lfo.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(dest);

        noise.start();
        lfo.start();
        nodes.push(noise, filter, lfo, lfoGain);
        break;
      }

      case 'forest':
      case 'night_forest': {
        // Gentle rustling wind noise + subtle soft chirps
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        nodes.push(noise, filter);

        if (type === 'night_forest') {
          // Add nocturnal cricket pulses
          const cricketsTimer = window.setInterval(() => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.setValueAtTime(4600, ctx.currentTime);
            g.gain.setValueAtTime(0.04, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            osc.connect(g);
            g.connect(dest);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
          }, 350);
          intervals.push(cricketsTimer);
        }
        break;
      }

      case 'wind':
      case 'soft_wind': {
        // Swept bandpass filtered pink noise
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(5);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = type === 'soft_wind' ? 380 : 520;
        filter.Q.value = 1.8;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.12;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 220;
        lfo.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(dest);

        noise.start();
        lfo.start();
        nodes.push(noise, filter, lfo, lfoGain);
        break;
      }

      case 'birds': {
        // Melodic chirping bird synthesizer
        const birdTimer = window.setInterval(() => {
          if (Math.random() > 0.3) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const now = ctx.currentTime;
            const baseFreq = 2400 + Math.random() * 1200;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.linearRampToValueAtTime(baseFreq + 600, now + 0.08);
            osc.frequency.linearRampToValueAtTime(baseFreq - 200, now + 0.18);

            g.gain.setValueAtTime(0.001, now);
            g.gain.linearRampToValueAtTime(0.12, now + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(g);
            g.connect(dest);
            osc.start(now);
            osc.stop(now + 0.25);
          }
        }, 650);
        intervals.push(birdTimer);
        break;
      }

      case 'campfire':
      case 'fireplace': {
        // Warm low rumble + random crackle impulse bursts
        const noise = ctx.createBufferSource();
        noise.buffer = this.createBrownNoiseBuffer(4);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 320;

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        nodes.push(noise, filter);

        // Crackle pops
        const crackleTimer = window.setInterval(() => {
          if (Math.random() > 0.35) {
            const click = ctx.createBufferSource();
            const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
              data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
            }
            click.buffer = buf;
            const clickGain = ctx.createGain();
            clickGain.gain.value = 0.25 + Math.random() * 0.25;
            click.connect(clickGain);
            clickGain.connect(dest);
            click.start();
          }
        }, 140);
        intervals.push(crackleTimer);
        break;
      }

      case 'coffee_shop':
      case 'cafe': {
        // Muffled crowd murmur + subtle ceramic cup clinks
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(6);
        noise.loop = true;

        const filter1 = ctx.createBiquadFilter();
        filter1.type = 'bandpass';
        filter1.frequency.value = 650;
        filter1.Q.value = 1.2;

        noise.connect(filter1);
        filter1.connect(dest);
        noise.start();
        nodes.push(noise, filter1);

        // Occasional cup clink chime
        const clinkTimer = window.setInterval(() => {
          if (Math.random() > 0.65) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.setValueAtTime(3200 + Math.random() * 800, ctx.currentTime);
            g.gain.setValueAtTime(0.07, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            osc.connect(g);
            g.connect(dest);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          }
        }, 1800);
        intervals.push(clinkTimer);
        break;
      }

      case 'library':
      case 'study_room': {
        // Ultra-quiet warm room acoustic tone + occasional subtle pencil/page glide
        const noise = ctx.createBufferSource();
        noise.buffer = this.createBrownNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 220;

        const g = ctx.createGain();
        g.gain.value = 0.4;

        noise.connect(filter);
        filter.connect(g);
        g.connect(dest);
        noise.start();
        nodes.push(noise, filter, g);
        break;
      }

      case 'vinyl': {
        // Classic vinyl 33rpm surface hiss + periodic pop clicks
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(3);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2800;

        const g = ctx.createGain();
        g.gain.value = 0.15;

        noise.connect(filter);
        filter.connect(g);
        g.connect(dest);
        noise.start();
        nodes.push(noise, filter, g);

        // Vinyl needle pop impulse
        const popTimer = window.setInterval(() => {
          if (Math.random() > 0.45) {
            const pop = ctx.createBufferSource();
            const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
              data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 30);
            }
            pop.buffer = buf;
            const popGain = ctx.createGain();
            popGain.gain.value = 0.28;
            pop.connect(popGain);
            popGain.connect(dest);
            pop.start();
          }
        }, 400);
        intervals.push(popTimer);
        break;
      }

      case 'fan':
      case 'ac': {
        // Low motor tone + rushing air
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(4);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'fan' ? 450 : 550;

        const osc = ctx.createOscillator();
        osc.frequency.value = type === 'fan' ? 70 : 90;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.08;

        noise.connect(filter);
        filter.connect(dest);
        osc.connect(oscGain);
        oscGain.connect(dest);

        noise.start();
        osc.start();
        nodes.push(noise, filter, osc, oscGain);
        break;
      }

      case 'tea_room': {
        // Soft water kettle steam hiss + subtle warm atmosphere
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(4);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2400;
        filter.Q.value = 2.0;

        const g = ctx.createGain();
        g.gain.value = 0.2;

        noise.connect(filter);
        filter.connect(g);
        g.connect(dest);
        noise.start();
        nodes.push(noise, filter, g);
        break;
      }

      case 'city_street':
      case 'traffic': {
        // Distant rolling tires + low rumble
        const noise = ctx.createBufferSource();
        noise.buffer = this.createBrownNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        nodes.push(noise, filter);
        break;
      }

      case 'subway':
      case 'train': {
        // Rhythmic track cadence: da-dum... da-dum... + steel carriage rumble
        const noise = ctx.createBufferSource();
        noise.buffer = this.createBrownNoiseBuffer(4);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 260;

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        nodes.push(noise, filter);

        // Click-clack cadence
        const clickTimer = window.setInterval(() => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.frequency.setValueAtTime(140, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.08);
          g.gain.setValueAtTime(0.18, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.connect(g);
          g.connect(dest);
          osc.start();
          osc.stop(ctx.currentTime + 0.09);
        }, 600);
        intervals.push(clickTimer);
        break;
      }

      case 'airport': {
        // Wide hall acoustics + distant airport intercom chime
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 500;

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        nodes.push(noise, filter);
        break;
      }

      case 'keyboard':
      case 'typing': {
        // Authentic tactile mechanical keyboard clicks
        const keyTimer = window.setInterval(() => {
          if (Math.random() > 0.25) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const now = ctx.currentTime;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

            g.gain.setValueAtTime(0.15, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

            osc.connect(g);
            g.connect(dest);
            osc.start(now);
            osc.stop(now + 0.05);
          }
        }, 180);
        intervals.push(keyTimer);
        break;
      }

      case 'brown_noise': {
        // Pure deep brown noise
        const noise = ctx.createBufferSource();
        noise.buffer = this.createBrownNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        nodes.push(noise, filter);
        break;
      }

      case 'white_noise': {
        // Pure white noise evenly balanced
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(5);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 5000;

        const g = ctx.createGain();
        g.gain.value = 0.25;

        noise.connect(filter);
        filter.connect(g);
        g.connect(dest);
        noise.start();
        nodes.push(noise, filter, g);
        break;
      }

      case 'office': {
        // Gentle office ambient murmur + distant typing
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 650;

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        nodes.push(noise, filter);
        break;
      }

      case 'deep_rain': {
        // Low thunderous storm rain on tin roof
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800;

        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 250;
        bass.gain.value = 6;

        noise.connect(filter);
        filter.connect(bass);
        bass.connect(dest);
        noise.start();
        nodes.push(noise, filter, bass);
        break;
      }

      case 'crickets': {
        // Pulsing high-frequency night crickets
        const cricketTimer = window.setInterval(() => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const now = ctx.currentTime;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(4500, now);

          g.gain.setValueAtTime(0.001, now);
          g.gain.linearRampToValueAtTime(0.12, now + 0.04);
          g.gain.linearRampToValueAtTime(0.001, now + 0.09);

          osc.connect(g);
          g.connect(dest);
          osc.start(now);
          osc.stop(now + 0.1);
        }, 180);
        intervals.push(cricketTimer);
        break;
      }

      case 'chimes': {
        // Pentatonic peaceful singing bowl / chime tones
        const chimePitches = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
        const chimeTimer = window.setInterval(() => {
          if (Math.random() > 0.4) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const pitch = chimePitches[Math.floor(Math.random() * chimePitches.length)];
            const now = ctx.currentTime;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(pitch, now);

            g.gain.setValueAtTime(0.001, now);
            g.gain.linearRampToValueAtTime(0.14, now + 0.08);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

            osc.connect(g);
            g.connect(dest);
            osc.start(now);
            osc.stop(now + 3.0);
          }
        }, 1600);
        intervals.push(chimeTimer);
        break;
      }

      case 'space_station': {
        // Low sci-fi reactor drone + gentle detuned chorus
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.value = 55; // A1
        osc2.frequency.value = 55.4; // detuned beat

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 220;

        const g = ctx.createGain();
        g.gain.value = 0.35;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(g);
        g.connect(dest);

        osc1.start();
        osc2.start();
        nodes.push(osc1, osc2, filter, g);
        break;
      }

      case 'arcade': {
        // Chiptune random retro square-wave blips
        const arcadeTimer = window.setInterval(() => {
          if (Math.random() > 0.5) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const freqs = [330, 440, 554, 659, 880];
            const freq = freqs[Math.floor(Math.random() * freqs.length)];
            const now = ctx.currentTime;

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.setValueAtTime(freq * 1.5, now + 0.06);

            g.gain.setValueAtTime(0.04, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

            osc.connect(g);
            g.connect(dest);
            osc.start(now);
            osc.stop(now + 0.13);
          }
        }, 450);
        intervals.push(arcadeTimer);
        break;
      }

      case 'carnival': {
        // Merry carousel accordion chords
        const carnivalTimer = window.setInterval(() => {
          if (Math.random() > 0.4) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const notes = [261.63, 329.63, 392.0, 523.25];
            const note = notes[Math.floor(Math.random() * notes.length)];
            const now = ctx.currentTime;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note, now);

            g.gain.setValueAtTime(0.06, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(g);
            g.connect(dest);
            osc.start(now);
            osc.stop(now + 0.45);
          }
        }, 500);
        intervals.push(carnivalTimer);
        break;
      }

      case 'construction': {
        // Low industrial hum + rhythmic metallic taps
        const noise = ctx.createBufferSource();
        noise.buffer = this.createBrownNoiseBuffer(4);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 240;

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        nodes.push(noise, filter);

        const tapTimer = window.setInterval(() => {
          if (Math.random() > 0.4) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.setValueAtTime(320, ctx.currentTime);
            g.gain.setValueAtTime(0.12, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(g);
            g.connect(dest);
            osc.start();
            osc.stop(ctx.currentTime + 0.06);
          }
        }, 800);
        intervals.push(tapTimer);
        break;
      }

      case 'stadium': {
        // Stadium swell roar
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(6);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 550;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.15;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 200;
        lfo.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(dest);
        noise.start();
        lfo.start();
        nodes.push(noise, filter, lfo, lfoGain);
        break;
      }

      case 'haunted': {
        // Eerie theremin / ghostly sine drone with vibrato
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 220;

        const vibrato = ctx.createOscillator();
        vibrato.frequency.value = 4.5;
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.value = 8;
        vibrato.connect(osc.frequency);

        const g = ctx.createGain();
        g.gain.value = 0.2;

        osc.connect(g);
        g.connect(dest);

        osc.start();
        vibrato.start();
        nodes.push(osc, vibrato, vibratoGain, g);
        break;
      }

      case 'aeroplane': {
        // Dual turbofan jet engine drone + low cabin air rush
        const pink = ctx.createBufferSource();
        pink.buffer = this.createPinkNoiseBuffer(5);
        pink.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 280;

        const brown = ctx.createBufferSource();
        brown.buffer = this.createBrownNoiseBuffer(5);
        brown.loop = true;

        const lowpass2 = ctx.createBiquadFilter();
        lowpass2.type = 'lowpass';
        lowpass2.frequency.value = 90;

        // Jet turbine whine
        const whine = ctx.createOscillator();
        whine.type = 'sine';
        whine.frequency.value = 175;
        const whineGain = ctx.createGain();
        whineGain.gain.value = 0.08;

        pink.connect(lowpass);
        brown.connect(lowpass2);
        whine.connect(whineGain);

        lowpass.connect(dest);
        lowpass2.connect(dest);
        whineGain.connect(dest);

        pink.start();
        brown.start();
        whine.start();
        nodes.push(pink, brown, whine, lowpass, lowpass2, whineGain);
        break;
      }

      case 'helicopter': {
        // Chopper rotor blades (chopped lowpass noise pulse)
        const noise = ctx.createBufferSource();
        noise.buffer = this.createBrownNoiseBuffer(4);
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 220;

        const tremolo = ctx.createGain();
        // Chopper blade pulsing at ~6.5 Hz
        const chopperLfo = ctx.createOscillator();
        chopperLfo.frequency.value = 6.5;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.45;
        tremolo.gain.value = 0.55;

        chopperLfo.connect(tremolo.gain);
        noise.connect(filter);
        filter.connect(tremolo);
        tremolo.connect(dest);

        noise.start();
        chopperLfo.start();
        nodes.push(noise, filter, tremolo, chopperLfo, lfoGain);
        break;
      }

      case 'people_talking': {
        // Formant filtering across subtle murmur frequencies
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(4);
        noise.loop = true;

        const f1 = ctx.createBiquadFilter();
        f1.type = 'bandpass';
        f1.frequency.value = 500;
        f1.Q.value = 4;

        const f2 = ctx.createBiquadFilter();
        f2.type = 'bandpass';
        f2.frequency.value = 1400;
        f2.Q.value = 3;

        const g = ctx.createGain();
        g.gain.value = 0.35;

        noise.connect(f1);
        noise.connect(f2);
        f1.connect(g);
        f2.connect(g);
        g.connect(dest);

        noise.start();
        nodes.push(noise, f1, f2, g);
        break;
      }

      case 'zombie': {
        // Undead low guttural drone with jittery FM growl
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 68;

        const mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = 18;
        const modGain = ctx.createGain();
        modGain.gain.value = 35;
        mod.connect(osc.frequency);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 260;

        const g = ctx.createGain();
        g.gain.value = 0.3;

        osc.connect(filter);
        filter.connect(g);
        g.connect(dest);

        osc.start();
        mod.start();
        nodes.push(osc, mod, modGain, filter, g);
        break;
      }

      case 'fight': {
        // Punch thuds & dynamic impact bursts
        const timer = window.setInterval(() => {
          if (Math.random() > 0.4) {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
            g.gain.setValueAtTime(0.4, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(g);
            g.connect(dest);
            osc.start(now);
            osc.stop(now + 0.16);
          }
        }, 1400);
        intervals.push(timer);
        break;
      }

      case 'laugh': {
        // Rhythmic chuckling staccato pulses
        const timer = window.setInterval(() => {
          const now = ctx.currentTime;
          for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const t = now + i * 0.14;
            osc.frequency.setValueAtTime(280 + Math.random() * 40, t);
            osc.frequency.linearRampToValueAtTime(320, t + 0.08);
            g.gain.setValueAtTime(0.25, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(g);
            g.connect(dest);
            osc.start(t);
            osc.stop(t + 0.12);
          }
        }, 3200);
        intervals.push(timer);
        break;
      }

      case 'cry': {
        // Melancholic sliding vocal sob
        const timer = window.setInterval(() => {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.linearRampToValueAtTime(310, now + 0.8);
          g.gain.setValueAtTime(0.01, now);
          g.gain.linearRampToValueAtTime(0.2, now + 0.2);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          osc.connect(g);
          g.connect(dest);
          osc.start(now);
          osc.stop(now + 0.95);
        }, 2800);
        intervals.push(timer);
        break;
      }

      case 'cat': {
        // Cat purr (26 Hz low-frequency vibration resonance)
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 26;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 180;

        const g = ctx.createGain();
        g.gain.value = 0.35;

        osc.connect(filter);
        filter.connect(g);
        g.connect(dest);

        osc.start();
        nodes.push(osc, filter, g);
        break;
      }

      case 'dog': {
        // Friendly intermittent canine bark
        const timer = window.setInterval(() => {
          if (Math.random() > 0.5) {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
            g.gain.setValueAtTime(0.28, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            osc.connect(g);
            g.connect(dest);
            osc.start(now);
            osc.stop(now + 0.18);
          }
        }, 3600);
        intervals.push(timer);
        break;
      }

      case 'wolf': {
        // Haunting soulful wolf howl
        const timer = window.setInterval(() => {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(290, now);
          osc.frequency.linearRampToValueAtTime(460, now + 1.2);
          osc.frequency.linearRampToValueAtTime(320, now + 3.0);
          g.gain.setValueAtTime(0.01, now);
          g.gain.linearRampToValueAtTime(0.28, now + 0.8);
          g.gain.exponentialRampToValueAtTime(0.001, now + 3.4);
          osc.connect(g);
          g.connect(dest);
          osc.start(now);
          osc.stop(now + 3.5);
        }, 7500);
        intervals.push(timer);
        break;
      }

      case 'owl': {
        // Night owl double hoot (Hoo... Hoo-Hoo)
        const timer = window.setInterval(() => {
          const now = ctx.currentTime;
          // First hoot
          const osc1 = ctx.createOscillator();
          const g1 = ctx.createGain();
          osc1.frequency.setValueAtTime(450, now);
          osc1.frequency.linearRampToValueAtTime(400, now + 0.4);
          g1.gain.setValueAtTime(0.2, now);
          g1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc1.connect(g1);
          g1.connect(dest);
          osc1.start(now);
          osc1.stop(now + 0.5);

          // Second hoot
          const osc2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          osc2.frequency.setValueAtTime(430, now + 0.7);
          osc2.frequency.linearRampToValueAtTime(380, now + 1.2);
          g2.gain.setValueAtTime(0.22, now + 0.7);
          g2.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
          osc2.connect(g2);
          g2.connect(dest);
          osc2.start(now + 0.7);
          osc2.stop(now + 1.3);
        }, 6000);
        intervals.push(timer);
        break;
      }

      case 'frog': {
        // Marsh frog croak
        const timer = window.setInterval(() => {
          if (Math.random() > 0.4) {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.linearRampToValueAtTime(90, now + 0.12);
            g.gain.setValueAtTime(0.2, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(g);
            g.connect(dest);
            osc.start(now);
            osc.stop(now + 0.16);
          }
        }, 2200);
        intervals.push(timer);
        break;
      }

      case 'horse': {
        // Equestrian trotting hooves clop-clop
        const timer = window.setInterval(() => {
          const now = ctx.currentTime;
          for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const t = now + i * 0.18;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(260, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
            g.gain.setValueAtTime(0.3, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            osc.connect(g);
            g.connect(dest);
            osc.start(t);
            osc.stop(t + 0.1);
          }
        }, 900);
        intervals.push(timer);
        break;
      }

      case 'whale': {
        // Deep resonant ocean whale vocalization
        const timer = window.setInterval(() => {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.linearRampToValueAtTime(220, now + 1.8);
          osc.frequency.linearRampToValueAtTime(95, now + 3.8);
          g.gain.setValueAtTime(0.01, now);
          g.gain.linearRampToValueAtTime(0.25, now + 1.0);
          g.gain.exponentialRampToValueAtTime(0.001, now + 4.2);
          osc.connect(g);
          g.connect(dest);
          osc.start(now);
          osc.stop(now + 4.5);
        }, 8500);
        intervals.push(timer);
        break;
      }

      default: {
        // Fallback smooth pink noise
        const noise = ctx.createBufferSource();
        noise.buffer = this.createPinkNoiseBuffer(4);
        noise.loop = true;
        noise.connect(dest);
        noise.start();
        nodes.push(noise);
        break;
      }
    }
  }
}
