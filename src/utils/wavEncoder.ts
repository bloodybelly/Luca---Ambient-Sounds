import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * High-Performance Client-Side WAV & MP3 Audio Encoder & Mix Downloader
 * Converts Web Audio PCM buffers into 16-bit stereo WAV audio files
 * or high-quality MP3 (192 kbps) that play natively on all devices.
 */

export function encodeWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // Uncompressed PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const left = audioBuffer.getChannelData(0);
  const right = numChannels > 1 ? audioBuffer.getChannelData(1) : left;
  const numSamples = left.length;

  const dataByteLength = numSamples * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF chunk descriptor */
  writeString(0, 'RIFF');
  /* Total file length minus 8 bytes of RIFF header */
  view.setUint32(4, 36 + dataByteLength, true);
  /* WAVE format */
  writeString(8, 'WAVE');

  /* 'fmt ' sub-chunk */
  writeString(12, 'fmt ');
  /* Subchunk1Size (16 for standard PCM) */
  view.setUint32(16, 16, true);
  /* AudioFormat (1 = PCM) */
  view.setUint16(20, format, true);
  /* NumChannels (1 = mono, 2 = stereo) */
  view.setUint16(22, numChannels, true);
  /* SampleRate (e.g., 44100 or 48000) */
  view.setUint32(24, sampleRate, true);
  /* ByteRate = SampleRate * NumChannels * BitsPerSample / 8 */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* BlockAlign = NumChannels * BitsPerSample / 8 */
  view.setUint16(32, blockAlign, true);
  /* BitsPerSample (16 bits) */
  view.setUint16(34, bitDepth, true);

  /* 'data' sub-chunk */
  writeString(36, 'data');
  /* Subchunk2Size = NumSamples * NumChannels * BitsPerSample / 8 */
  view.setUint32(40, dataByteLength, true);

  /* Interleave PCM 16-bit samples */
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Clamp sample between -1 and 1
    const sL = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
    offset += 2;

    if (numChannels > 1) {
      const sR = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Decodes a recorded audio blob (WebM, Opus, MP4, AAC) into PCM
 * and re-encodes it into an uncompressed standard WAV file.
 */
export async function convertBlobToWav(blob: Blob, audioCtx: AudioContext): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return encodeWav(audioBuffer);
  } catch (err) {
    console.warn('[WavEncoder] Decoding to WAV failed, falling back to original blob:', err);
    return blob;
  }
}

/**
 * Encodes a Web Audio PCM buffer into an MP3 file (192 kbps default).
 */
export function encodeMp3(audioBuffer: AudioBuffer, kbps: number = 192): Blob {
  const numChannels = Math.min(2, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const mp3Encoder = new Mp3Encoder(numChannels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
  const sampleLength = leftChannel.length;

  // Convert Float32Array [-1.0, 1.0] to Int16Array [-32768, 32767]
  const leftInt16 = new Int16Array(sampleLength);
  const rightInt16 = numChannels > 1 ? new Int16Array(sampleLength) : undefined;

  for (let i = 0; i < sampleLength; i++) {
    const sL = Math.max(-1, Math.min(1, leftChannel[i]));
    leftInt16[i] = sL < 0 ? sL * 0x8000 : sL * 0x7fff;

    if (rightInt16) {
      const sR = Math.max(-1, Math.min(1, rightChannel[i]));
      rightInt16[i] = sR < 0 ? sR * 0x8000 : sR * 0x7fff;
    }
  }

  // Encode in chunks of 1152 samples (standard MPEG-1 Layer 3 frame size)
  const sampleBlockSize = 1152;
  for (let i = 0; i < sampleLength; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    const rightChunk = rightInt16 ? rightInt16.subarray(i, i + sampleBlockSize) : undefined;
    const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf && mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3Flush = mp3Encoder.flush();
  if (mp3Flush && mp3Flush.length > 0) {
    mp3Data.push(mp3Flush);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Decodes a recorded audio blob into PCM and re-encodes it into an MP3 file.
 */
export async function convertBlobToMp3(
  blob: Blob,
  audioCtx: AudioContext,
  kbps: number = 192
): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return encodeMp3(audioBuffer, kbps);
  } catch (err) {
    console.warn('[Mp3Encoder] Decoding to MP3 failed, falling back to original blob:', err);
    return blob;
  }
}

/**
 * Triggers an immediate browser file download for a given Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Downloads a mix recipe JSON configuration file.
 */
export function downloadJson(data: unknown, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/**
 * Formats seconds into MM:SS display.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
