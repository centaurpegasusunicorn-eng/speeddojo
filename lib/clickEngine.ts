"use client";

export type ClickConfig = {
  originalBpm: number; // tempo the video was recorded at
  beatsPerBar: number; // for the accented downbeat
};

/**
 * Generates a metronome click that is locked to a <video> element's clock.
 *
 * Beats sit on a fixed grid in VIDEO time: n * (60 / originalBpm),
 * so beat 1 is always at exactly 0:00 of the video.
 * Every ~25ms we look at where the video is and how fast it is playing,
 * and schedule any beats due in the next ~100ms at the matching REAL time.
 * Because everything is recomputed from the video position, pausing,
 * seeking, looping and changing tempo can't make the click drift.
 */
export class ClickEngine {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private video: HTMLVideoElement | null = null;
  private cfg: ClickConfig | null = null;
  private lastIndex = -1;
  private enabled = true;
  private volume = 0.5; // regular beats
  private accentVolume = 0.8; // accented beats
  // Which beats of the bar are accented (louder + higher tone). Default: beat 1.
  private accents: boolean[] = [true, false, false, false];
  private offsetSec = 0;
  private onBeat: ((accent: boolean) => void) | null = null;
  private removeListeners: (() => void) | null = null;

  attach(video: HTMLVideoElement, cfg: ClickConfig) {
    this.detach();
    this.video = video;
    this.cfg = cfg;

    const onPlay = () => {
      this.getCtx().resume();
      this.resync();
    };
    const onSeek = () => this.resync();
    video.addEventListener("play", onPlay);
    video.addEventListener("seeked", onSeek);
    video.addEventListener("loadedmetadata", onSeek);
    this.removeListeners = () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("seeked", onSeek);
      video.removeEventListener("loadedmetadata", onSeek);
    };

    this.resync();
    this.timer = window.setInterval(this.tick, 25);
  }

  detach() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.removeListeners?.();
    this.removeListeners = null;
    this.video = null;
    this.cfg = null;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }
  /** Called at the moment each beat is HEARD (even if click volume is 0). */
  setOnBeat(cb: ((accent: boolean) => void) | null) {
    this.onBeat = cb;
  }
  setVolume(v: number) {
    this.volume = v;
  }
  setAccentVolume(v: number) {
    this.accentVolume = v;
  }
  /** accents[0] is beat 1, accents[1] is beat 2, and so on. */
  setAccents(a: boolean[]) {
    this.accents = a;
  }
  /** Positive = click later, negative = earlier. For Bluetooth/latency tweaks. */
  setOffsetMs(ms: number) {
    this.offsetSec = ms / 1000;
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  // Point lastIndex just before the next beat at/after the current video time.
  private resync() {
    if (!this.video || !this.cfg) return;
    const interval = 60 / this.cfg.originalBpm;
    const cur = this.video.currentTime;
    this.lastIndex = Math.ceil(cur / interval - 1e-6) - 1;
  }

  private tick = () => {
    const { video, cfg } = this;
    if (!video || !cfg || !this.enabled) return;
    if (video.paused || video.ended) return;

    const ctx = this.getCtx();
    if (ctx.state !== "running") return;

    const rate = video.playbackRate;
    const interval = 60 / cfg.originalBpm;
    const cur = video.currentTime;
    const horizon = cur + 0.1 * rate; // look ~100ms ahead in real time

    let n = this.lastIndex + 1;
    for (;;) {
      const t = n * interval;
      if (t > horizon) break;
      if (n >= 0 && t >= cur - 0.005) {
        const when = Math.max(
          ctx.currentTime,
          ctx.currentTime + (t - cur) / rate + this.offsetSec
        );
        this.playClick(when, !!this.accents[n % cfg.beatsPerBar]);
      }
      this.lastIndex = n;
      n++;
    }
  };

  private playClick(when: number, accent: boolean) {
    const ctx = this.getCtx();

    // Visual beat: fire when the sound reaches the listener, whether or
    // not the click itself is audible.
    if (this.onBeat) {
      const latency =
        (ctx as AudioContext & { outputLatency?: number }).outputLatency ||
        ctx.baseLatency ||
        0;
      const delayMs = Math.max(0, (when - ctx.currentTime + latency) * 1000);
      window.setTimeout(() => {
        if (this.video && !this.video.paused) this.onBeat?.(accent);
      }, delayMs);
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 1000;
    const peak = accent ? this.accentVolume : this.volume;
    // exponentialRamp can't target 0, so treat a near-zero volume as silent
    if (peak < 0.001) return;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    osc.connect(gain).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + 0.05);
  }
}
