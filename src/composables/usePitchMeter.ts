import { onUnmounted, ref } from 'vue'

// Vocal-ish frequency window the meter maps to its 0..1 vertical range.
const MIN_FREQ = 80
const MAX_FREQ = 1000
const DETECTION_INTERVAL_MS = 50
const SILENCE_RMS = 0.01
// Smoothing factor for how fast the displayed bar chases the detected pitch.
const SMOOTHING = 0.25
const SILENCE_DECAY = 0.15

// Autocorrelation pitch detector: finds the lag (in samples) at which the
// waveform best matches a shifted copy of itself, which gives the signal's
// fundamental period, and from that its frequency. Runs on a short window
// of raw mic samples, well suited for real-time use, no reference track needed.
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    const size = buffer.length
    let rms = 0
    for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i]
    rms = Math.sqrt(rms / size)
    if (rms < SILENCE_RMS) return -1

    // Trim leading/trailing near-silence so the correlation window is
    // centered on actual signal.
    let start = 0
    let end = size - 1
    const threshold = 0.2
    for (let i = 0; i < size / 2; i++) {
        if (Math.abs(buffer[i]) < threshold) { start = i; break }
    }
    for (let i = 1; i < size / 2; i++) {
        if (Math.abs(buffer[size - i]) < threshold) { end = size - i; break }
    }

    const trimmed = buffer.subarray(start, end)
    const n = trimmed.length
    if (n < 8) return -1

    const correlations = new Float32Array(n)
    for (let lag = 0; lag < n; lag++) {
        let sum = 0
        for (let i = 0; i < n - lag; i++) sum += trimmed[i] * trimmed[i + lag]
        correlations[lag] = sum
    }

    // Skip the initial downslope from lag 0 so we find the first real peak,
    // not the trivial zero-lag self-match.
    let d = 0
    while (d + 1 < n && correlations[d] > correlations[d + 1]) d++

    let maxValue = -1
    let maxLag = -1
    for (let lag = d; lag < n; lag++) {
        if (correlations[lag] > maxValue) {
            maxValue = correlations[lag]
            maxLag = lag
        }
    }
    if (maxLag <= 0) return -1

    // Parabolic interpolation between neighboring lags refines the peak
    // to sub-sample precision, since the true period rarely lands exactly
    // on an integer sample count.
    const prev = correlations[maxLag - 1] ?? correlations[maxLag]
    const curr = correlations[maxLag]
    const next = correlations[maxLag + 1] ?? correlations[maxLag]
    const denom = prev + next - 2 * curr
    const refinedLag = denom ? maxLag - (next - prev) / (2 * denom) : maxLag

    return refinedLag > 0 ? sampleRate / refinedLag : -1
}

export function usePitchMeter() {
    const level = ref(0) // smoothed 0..1, drives the visual bar
    const active = ref(false)
    const error = ref('')

    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let stream: MediaStream | null = null
    let dataBuffer: Float32Array<ArrayBuffer> | null = null
    let detectionTimer: ReturnType<typeof setInterval> | null = null
    let animationFrame: number | null = null
    let targetLevel = 0

    function frequencyToLevel(freq: number): number {
        const clamped = Math.min(Math.max(freq, MIN_FREQ), MAX_FREQ)
        const position = (Math.log2(clamped) - Math.log2(MIN_FREQ)) / (Math.log2(MAX_FREQ) - Math.log2(MIN_FREQ))
        return Math.min(Math.max(position, 0), 1)
    }

    function detect() {
        if (!analyser || !dataBuffer || !audioContext) return
        analyser.getFloatTimeDomainData(dataBuffer)
        const freq = autoCorrelate(dataBuffer, audioContext.sampleRate)
        targetLevel = freq > 0 ? frequencyToLevel(freq) : Math.max(targetLevel - SILENCE_DECAY, 0)
    }

    function animate() {
        level.value += (targetLevel - level.value) * SMOOTHING
        animationFrame = requestAnimationFrame(animate)
    }

    async function start() {
        if (active.value) return
        error.value = ''
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            audioContext = new AudioContext()
            const source = audioContext.createMediaStreamSource(stream)
            analyser = audioContext.createAnalyser()
            analyser.fftSize = 2048
            dataBuffer = new Float32Array(analyser.fftSize)
            source.connect(analyser)

            // Pitch detection is the expensive part, so it runs on its own
            // throttled timer; the visual bar animates smoothly on every
            // frame by easing toward whatever that timer last measured.
            detectionTimer = setInterval(detect, DETECTION_INTERVAL_MS)
            animationFrame = requestAnimationFrame(animate)
            active.value = true
        } catch (err: any) {
            error.value = err?.message || 'Microphone unavailable'
            active.value = false
        }
    }

    function stop() {
        if (detectionTimer) clearInterval(detectionTimer)
        if (animationFrame) cancelAnimationFrame(animationFrame)
        detectionTimer = null
        animationFrame = null
        stream?.getTracks().forEach((track) => track.stop())
        audioContext?.close()
        stream = null
        audioContext = null
        analyser = null
        dataBuffer = null
        targetLevel = 0
        level.value = 0
        active.value = false
    }

    onUnmounted(stop)

    return { level, active, error, start, stop }
}
