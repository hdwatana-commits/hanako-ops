// Pure timeline helpers; no network, storage, or changes to source photographs.
export const styles = {
  hana: { label: 'ハナ・かわいい系', beats: 4, zoom: .035 },
  cinema: { label: 'おしゃれ・シネマ系', beats: 8, zoom: .018 },
  pop: { label: 'ポップ・テンポ系', beats: 2, zoom: .045 },
};

export function analyze(samples, rate) {
  const hop = Math.max(1, Math.round(rate * .02));
  const energy = [];
  for (let i = 0; i < samples.length; i += hop) {
    let sum = 0;
    for (let j = i; j < Math.min(i + hop, samples.length); j++) sum += samples[j] ** 2;
    energy.push(Math.sqrt(sum / hop));
  }
  const peaks = [];
  for (let i = 2; i < energy.length - 2; i++) {
    const local = energy.slice(Math.max(0, i - 20), i);
    const mean = local.reduce((a, b) => a + b, 0) / local.length;
    if (energy[i] > .008 && energy[i] > mean * 1.4 && energy[i] >= energy[i - 1] && energy[i] > energy[i + 1]) {
      const time = i * hop / rate;
      if (!peaks.length || time - peaks.at(-1).time > .23) peaks.push({ time, strength: energy[i] });
    }
  }
  const intervals = peaks.slice(1).map((p, i) => p.time - peaks[i].time).filter(t => t < 1.5);
  const bins = new Map();
  for (let t of intervals) {
    let bpm = 60 / t;
    while (bpm < 70) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    const bin = Math.round(bpm / 2) * 2;
    bins.set(bin, (bins.get(bin) || 0) + 1);
  }
  const bpm = [...bins].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { bpm, peaks, reliable: peaks.length >= 6 && intervals.length >= 4 };
}

export function timeline(duration, style, analysis, offset = 0, manualBpm = 0) {
  const cuts = [0];
  const step = styles[style].beats;
  let beats = analysis?.peaks.map(p => p.time + offset) || [];
  if (manualBpm) beats = Array.from({ length: Math.ceil((duration + 2) * manualBpm / 60) }, (_, i) => i * 60 / manualBpm + offset);
  if (!beats.length) beats = Array.from({ length: Math.ceil(duration * 2) }, (_, i) => i * .5 + offset);
  beats.forEach((t, i) => { if (i % step === 0 && t > cuts.at(-1) + .35 && t < duration - .4) cuts.push(t); });
  return cuts;
}
