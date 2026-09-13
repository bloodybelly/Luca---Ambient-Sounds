import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Music,
  FileCode,
  Check,
  Loader2,
  Radio,
  Clock,
  Sparkles,
  Upload,
  AlertCircle,
  FileAudio,
  Sliders,
  Volume2,
} from 'lucide-react';
import { SoundEngine } from '../audio/SoundEngine';
import { SOUND_LIBRARY } from '../data/sounds';
import { SoundState, ThemeConfig } from '../types';
import {
  convertBlobToWav,
  convertBlobToMp3,
  downloadBlob,
  downloadJson,
  formatDuration,
} from '../utils/wavEncoder';

interface DownloadMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundStates: Record<string, SoundState>;
  masterVolume: number;
  currentTheme: ThemeConfig;
  onApplyCustomMix: (mix: { id: string; volume: number }[]) => void;
  onSelectTheme?: (themeId: any) => void;
}

type ExportDuration = 15 | 30 | 60 | 180 | 0; // 0 = manual

export const DownloadMixModal: React.FC<DownloadMixModalProps> = ({
  isOpen,
  onClose,
  soundStates,
  masterVolume,
  currentTheme,
  onApplyCustomMix,
  onSelectTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'preset'>('audio');

  // Audio export settings
  const [mixName, setMixName] = useState('My Atmosphere Mix');
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'wav' | 'webm'>('mp3');
  const [duration, setDuration] = useState<ExportDuration>(30);

  // Recording status
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEncoding, setIsEncoding] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Import state
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const countdownTimerRef = useRef<number | null>(null);
  const engineRef = useRef<SoundEngine | null>(null);

  useEffect(() => {
    engineRef.current = SoundEngine.getInstance();
  }, []);

  // Compute active sounds in the mix
  const activeSounds = (Object.entries(soundStates) as [string, SoundState][])
    .filter(([, state]) => state.playing)
    .map(([id, state]) => {
      const info = SOUND_LIBRARY.find((s) => s.id === id);
      return {
        id,
        name: info?.name || id,
        volume: state.volume,
        color: info?.color || currentTheme.primary,
      };
    });

  // Default mix name based on active sounds
  useEffect(() => {
    if (isOpen && activeSounds.length > 0) {
      const topSounds = activeSounds.slice(0, 2).map((s) => s.name).join(' & ');
      setMixName(`${topSounds} Atmosphere`);
      setDownloadSuccessMessage(null);
      setErrorMessage(null);
      setImportStatus('idle');
    }
  }, [isOpen, activeSounds.length]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isRecording) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRecording, onClose]);

  // Clean up if closed mid-recording
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // Handle Start Recording
  const handleStartRecording = () => {
    setErrorMessage(null);
    setDownloadSuccessMessage(null);

    const engine = engineRef.current || SoundEngine.getInstance();
    if (activeSounds.length === 0) {
      setErrorMessage('Please turn on at least one sound to record your mix!');
      return;
    }

    setElapsedSeconds(0);
    const started = engine.startRecording((sec) => {
      setElapsedSeconds(sec);
    });

    if (!started) {
      setErrorMessage('Audio recording could not start. Please ensure sounds are unmuted.');
      return;
    }

    setIsRecording(true);

    // If a preset duration was selected (15s, 30s, 60s, 180s)
    if (duration > 0) {
      countdownTimerRef.current = window.setTimeout(() => {
        handleStopAndDownload();
      }, duration * 1000);
    }
  };

  // Handle Stop Recording & Trigger Download
  const handleStopAndDownload = async () => {
    if (countdownTimerRef.current) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    const engine = engineRef.current || SoundEngine.getInstance();
    setIsEncoding(true);

    try {
      const recordedBlob = await engine.stopRecording();
      setIsRecording(false);

      if (!recordedBlob || recordedBlob.size === 0) {
        setErrorMessage('Recording was empty or interrupted.');
        setIsEncoding(false);
        return;
      }

      const cleanFilename = (mixName.trim() || 'atmosphere-mix')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/gi, '-');

      let finalBlob = recordedBlob;
      let finalExtension = 'webm';

      if (audioFormat === 'mp3') {
        finalExtension = 'mp3';
        const ctx = engine.getAudioContext();
        finalBlob = await convertBlobToMp3(recordedBlob, ctx, 192);
      } else if (audioFormat === 'wav') {
        finalExtension = 'wav';
        const ctx = engine.getAudioContext();
        finalBlob = await convertBlobToWav(recordedBlob, ctx);
      }

      downloadBlob(finalBlob, `${cleanFilename}.${finalExtension}`);

      const sizeKb = Math.round(finalBlob.size / 1024);
      setDownloadSuccessMessage(
        `Downloaded "${cleanFilename}.${finalExtension}" (${sizeKb} KB) successfully!`
      );
    } catch (err) {
      console.error('Recording export error:', err);
      setErrorMessage('Export failed. Please try again.');
    } finally {
      setIsEncoding(false);
    }
  };

  // Handle Cancel Recording
  const handleCancelRecording = async () => {
    if (countdownTimerRef.current) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    const engine = engineRef.current || SoundEngine.getInstance();
    await engine.stopRecording();
    setIsRecording(false);
    setIsEncoding(false);
    setElapsedSeconds(0);
  };

  // Handle Exporting Mix Recipe JSON
  const handleExportJson = () => {
    const cleanFilename = (mixName.trim() || 'atmosphere-mix')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/gi, '-');

    const mixRecipe = {
      appName: 'Luca Ambience',
      version: 1,
      exportedAt: new Date().toISOString(),
      name: mixName.trim() || 'Custom Atmosphere Mix',
      scenarioTheme: currentTheme.id,
      masterVolume,
      sounds: activeSounds.map((s) => ({
        id: s.id,
        name: s.name,
        volume: s.volume,
      })),
    };

    downloadJson(mixRecipe, `${cleanFilename}-recipe.json`);
    setDownloadSuccessMessage(`Mix preset "${cleanFilename}-recipe.json" downloaded!`);
  };

  // Handle Importing Mix Recipe JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || !Array.isArray(parsed.sounds)) {
          setImportStatus('error');
          setImportMessage('Invalid mix file format. Expected a valid Luca Ambience recipe.');
          return;
        }

        const validSounds = parsed.sounds
          .filter((item: any) => typeof item.id === 'string')
          .map((item: any) => ({
            id: item.id,
            volume: typeof item.volume === 'number' ? item.volume : 50,
          }));

        if (validSounds.length === 0) {
          setImportStatus('error');
          setImportMessage('No valid sounds found in this mix file.');
          return;
        }

        // Apply theme if provided
        if (parsed.scenarioTheme && onSelectTheme) {
          onSelectTheme(parsed.scenarioTheme);
        }

        // Apply sound mix
        onApplyCustomMix(validSounds);

        setImportStatus('success');
        setImportMessage(
          `Successfully loaded "${parsed.name || 'Mix'}" with ${validSounds.length} sounds!`
        );
      } catch (err) {
        console.error('Failed to parse mix file:', err);
        setImportStatus('error');
        setImportMessage('Could not read JSON file. Please check the file contents.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
          boxShadow: `0 25px 50px -12px ${currentTheme.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colorMix[0]}, ${currentTheme.colorMix[1]})`,
              }}
            >
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Download Atmosphere Mix
              </h2>
              <p className="text-xs text-slate-400">
                Export your custom soundscape as audio or shareable preset
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isRecording}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Music className="w-4 h-4" style={{ color: currentTheme.primary }} />
            <span>Audio File (.MP3 / .WAV / .WEBM)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Mix Recipe (.JSON)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Active Sound Summary Card */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Volume2 className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
                <span>Active Layers in Mix</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                {activeSounds.length} {activeSounds.length === 1 ? 'sound' : 'sounds'}
              </span>
            </div>

            {activeSounds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeSounds.map((sound) => (
                  <span
                    key={sound.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white/5 border border-white/10 text-slate-200"
                  >
                    <span
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ backgroundColor: sound.color }}
                    />
                    <span>{sound.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sound.volume}%
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>No sounds are playing yet. Turn on sounds in the mixer first!</span>
              </div>
            )}
          </div>

          {/* TAB 1: AUDIO EXPORT */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              {/* Mix Name Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Mix Title
                </label>
                <input
                  type="text"
                  value={mixName}
                  onChange={(e) => setMixName(e.target.value)}
                  disabled={isRecording}
                  placeholder="E.g., Rainy Study Night"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-black/40 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all disabled:opacity-50"
                />
              </div>

              {/* Format & Duration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Audio Format */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Audio Format
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-slate-700/80">
                    <button
                      type="button"
                      disabled={isRecording}
                      onClick={() => setAudioFormat('mp3')}
                      className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        audioFormat === 'mp3'
                          ? 'bg-white/20 text-white shadow-sm font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      MP3 (192k)
                    </button>
                    <button
                      type="button"
                      disabled={isRecording}
                      onClick={() => setAudioFormat('wav')}
                      className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        audioFormat === 'wav'
                          ? 'bg-white/20 text-white shadow-sm font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      WAV
                    </button>
                    <button
                      type="button"
                      disabled={isRecording}
                      onClick={() => setAudioFormat('webm')}
                      className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        audioFormat === 'webm'
                          ? 'bg-white/20 text-white shadow-sm font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      WebM
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {audioFormat === 'mp3' &&
                      'Universal MP3 (192 kbps), plays on all phones, cars & media players.'}
                    {audioFormat === 'wav' &&
                      'Uncompressed 16-bit PCM CD quality for highest audio fidelity.'}
                    {audioFormat === 'webm' &&
                      'Compressed lightweight Opus audio file for fast web sharing.'}
                  </p>
                </div>

                {/* Duration Picker */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Recording Length
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-slate-700/80">
                    {([15, 30, 60, 180] as ExportDuration[]).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        disabled={isRecording}
                        onClick={() => setDuration(sec)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-medium text-center transition-all cursor-pointer ${
                          duration === sec
                            ? 'bg-white/20 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Auto-captures seamless ambient loop of specified length.
                  </p>
                </div>
              </div>

              {/* Recording Status & Meter Card */}
              {isRecording && (
                <div
                  className="p-4 rounded-2xl border text-center space-y-3 animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    backgroundColor: `${currentTheme.surfaceHover}90`,
                    borderColor: `${currentTheme.primary}80`,
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                      Recording Atmosphere
                    </span>
                  </div>

                  {/* Timer Display */}
                  <div className="text-3xl font-mono font-bold text-white tracking-wider">
                    {formatDuration(elapsedSeconds)}
                    {duration > 0 && (
                      <span className="text-sm font-normal text-slate-400 ml-1">
                        / {formatDuration(duration)}
                      </span>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  {duration > 0 && (
                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min(100, (elapsedSeconds / duration) * 100)}%`,
                          background: `linear-gradient(90deg, ${currentTheme.colorMix[0]}, ${currentTheme.colorMix[1]})`,
                        }}
                      />
                    </div>
                  )}

                  {/* Audio Wave Visualizer Bars */}
                  <div className="flex items-center justify-center gap-1 h-6">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1 bg-white/80 rounded-full animate-pulse"
                        style={{
                          height: `${20 + ((i * 7) % 60) + Math.sin(elapsedSeconds + i) * 15}%`,
                          animationDelay: `${(i * 0.08).toFixed(2)}s`,
                          backgroundColor: currentTheme.colorMix[i % currentTheme.colorMix.length],
                        }}
                      />
                    ))}
                  </div>

                  {/* Recording Actions */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleStopAndDownload}
                      disabled={isEncoding}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Stop & Save Audio Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      disabled={isEncoding}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-black/40 hover:bg-black/60 border border-slate-700 cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Encoding Indicator */}
              {isEncoding && (
                <div className="py-4 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-400" />
                  <p className="text-xs font-semibold text-slate-200">
                    Encoding high-fidelity {audioFormat.toUpperCase()} audio file...
                  </p>
                </div>
              )}

              {/* Messages */}
              {downloadSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{downloadSuccessMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Main Record & Download Action Button */}
              {!isRecording && !isEncoding && (
                <button
                  type="button"
                  id="start-audio-download-btn"
                  onClick={handleStartRecording}
                  disabled={activeSounds.length === 0}
                  className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.colorMix[0]}, ${currentTheme.colorMix[1]})`,
                    boxShadow: `0 4px 20px ${currentTheme.glow}`,
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>
                    Record {duration > 0 ? `${duration}s Loop & ` : ''}Download{' '}
                    {audioFormat.toUpperCase()}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: PRESET RECIPE JSON */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Export Mix Recipe (.json)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download a lightweight configuration file containing your exact sound volumes,
                  active layers, and scenario colors. You can store your favorite atmospheres or
                  share them with friends.
                </p>

                <button
                  type="button"
                  id="export-preset-json-btn"
                  onClick={handleExportJson}
                  disabled={activeSounds.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Mix Recipe (.json)</span>
                </button>
              </div>

              {/* Import Section */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Import Mix Recipe
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Restore a previously downloaded mix recipe file to re-create your atmosphere
                  instantaneously.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />

                <button
                  type="button"
                  id="import-preset-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select or Drag .json File to Load</span>
                </button>

                {importStatus === 'success' && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{importMessage}</span>
                  </div>
                )}

                {importStatus === 'error' && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{importMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 border-t border-white/10 bg-black/30 text-center text-[11px] text-slate-400">
          Audio generated in-memory with Web Audio API • 100% client-side & private
        </div>
      </div>
    </div>
  );
};
