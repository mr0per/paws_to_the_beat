const catClosed = document.getElementById("catClosed");
const catOpen = document.getElementById("catOpen");
const dogClosed = document.getElementById("dogClosed");
const dogOpen = document.getElementById("dogOpen");
const trackerStatus = document.getElementById("trackerStatus");
const trackerDebug = document.getElementById("trackerDebug");
const fishCounter = document.getElementById("fishCounter");
const muteButton = document.getElementById("muteButton");
const inputVideo = document.getElementById("inputVideo");
const scene = document.querySelector(".scene");
const fishFlightLayer = document.getElementById("fishFlightLayer");
const fishLandedLayer = document.getElementById("fishLandedLayer");
const levelScreen = document.getElementById("levelScreen");
const level1Button = document.getElementById("level1Button");
const level2Button = document.getElementById("level2Button");
const gameOverScreen = document.getElementById("gameOverScreen");
const replayButton = document.getElementById("replayButton");
const levelSelectButton = document.getElementById("levelSelectButton");
const countdownOverlay = document.getElementById("countdownOverlay");

let isTrackingStarted = false;
let videoWidth = 640;
let videoHeight = 480;
let wasPalmsTouching = false;
let lastTriggerAt = 0;
let lastLeftPalm = null;
let lastRightPalm = null;
let lastLeftSpan = 0;
let lastRightSpan = 0;
let lastLeftSeenAt = 0;
let lastRightSeenAt = 0;
let lastPalmDistance = null;
let lastPalmDistanceAt = 0;
let clapOpenUntil = 0;
let isMouthLockedClosed = false;

const HAND_MEMORY_MS = 520;
const STALE_HOLD_MS = 1400;
const MIN_TRIGGER_GAP_MS = 110;
const MAX_LANDED_FISH = 12;
const FISH_IMAGE_SRC = "images/fish 1.png";
const NOM_SOUND_SRC = "images/543386__thedragonsspark__nom-noise.wav";
const NOM_SOUND_POOL_SIZE = 4;
const NOM_SOUND_VOLUME = 0.88;
const NOM_SOUND_GAIN = 1.14;
const NOM_SOUND_BASS_GAIN_DB = 11;
const NOM_SOUND_BASS_FREQ_HZ = 180;
const NOM_SOUND_PLAYBACK_RATE = 0.92;
const LEVEL1_SONG_SRC = "images/Fish_Catching_Rhythm_Fun_2026-03-24T220746.mp3";
const LEVEL1_FALLBACK_BPM = 120;
const LEVEL1_FALLBACK_OFFSET_MS = 0;
const LEVEL1_FALLBACK_TRAVEL_BEATS = 2;
const LEVEL1_DOWNBEAT_SPAN_BEATS = 4;
const LEVEL1_COUNTIN_END_MS = 12200;
const INITIAL_FISH_DELAY_MS = 12000;
const LEVEL1_SYNC_OFFSET_MS = 110;
const FIGMA_FRAME_WIDTH = 1440;
const CLAP_IMPACT_MIN_SPEED_PX_PER_MS = 0.12;
const CLAP_IMPACT_MIN_DISTANCE_DROP_PX = 4;
const CLAP_CONTACT_MIN_DISTANCE_DROP_PX = 2;
const CLAP_OPEN_HOLD_MS = 260;
const CLAP_TOUCH_THRESHOLD_SCALE = 1.6;
const CLAP_TOUCH_MIN_PX = 96;
const CLAP_TOUCH_MAX_PX = 185;
const HANDPOSE_MIN_DETECTION_CONFIDENCE = 0.15;
const HANDPOSE_MIN_TRACKING_CONFIDENCE = 0.15;
const LOCK_RELEASE_DISTANCE_SCALE = 1.1;
const LEVEL1_BASE_VOLUME = 0.85;
const LEVEL1_END_LEAD_MS = 2300;
const LEVEL1_FADE_OUT_MS = 1800;
const LEVEL1_FADE_STEP_MS = 40;

// Countdown "3 2 1 Go!" — song times (ms) when each label should appear.
// Detected from audio: beat grid ~333 ms; "3" at 10.870 s, "Go!" at 11.868 s.
const LEVEL1_COUNTDOWN_LABELS = ["3", "2", "1", "Go!"];
const LEVEL1_COUNTDOWN_TRIGGERS_MS = [10870, 11198, 11535, 11868];

const LEVEL_CONFIGS = {
	1: {
		spawnIntervalMs: 900,
		flightMinMs: 1300,
		flightMaxMs: 1800,
		catchRadiusScale: 1
	},
	2: {
		spawnIntervalMs: 560,
		flightMinMs: 820,
		flightMaxMs: 1250,
		catchRadiusScale: 0.78
	}
};

const activeFish = [];
let fishSpawnTimerId = null;
let level1BeatSpawnTimerId = null;
let fishAnimationFrameId = null;
let fishStartDelayTimerId = null;
let isMouthOpen = false;
let fishSpriteSrc = FISH_IMAGE_SRC;
let fishWidthRatioToFrame = 0.12;
let eatenFishCount = 0;
let missedFishCount = 0;
let isGameStarted = false;
let trackingReadyAtMs = 0;
let currentLevel = null;
let currentSpawnIntervalMs = LEVEL_CONFIGS[1].spawnIntervalMs;
let currentFlightMinMs = LEVEL_CONFIGS[1].flightMinMs;
let currentFlightMaxMs = LEVEL_CONFIGS[1].flightMaxMs;
let currentCatchRadiusScale = LEVEL_CONFIGS[1].catchRadiusScale;
let activeClosedSprite = catClosed;
let activeOpenSprite = catOpen;
let level1SongAudio = null;
let nomSoundPool = [];
let nextNomSoundIndex = 0;
let nomAudioContext = null;
let nomAudioBuffer = null;
let nomBassFilterNode = null;
let nomOutputGainNode = null;
let nomSoundLoadPromise = null;
let isNomSoundMuted = false;
let level1ClapCueTimesMs = [];
let isLevel1CueAnalysisDone = false;
let isLevel1CueAnalysisPending = false;
let level1EstimatedBeatMs = 60000 / LEVEL1_FALLBACK_BPM;
let level1EstimatedOffsetMs = LEVEL1_FALLBACK_OFFSET_MS;
let lastScheduledLevel1BeatSongMs = -Infinity;
let isLevel1Ending = false;
let level1FadeIntervalId = null;
let countdownFrameId = null;
let countdownLastStep = -1;

const clearLevel1EndFlow = () => {
	isLevel1Ending = false;

	if (level1FadeIntervalId) {
		window.clearInterval(level1FadeIntervalId);
		level1FadeIntervalId = null;
	}

	if (level1SongAudio) {
		level1SongAudio.volume = LEVEL1_BASE_VOLUME;
	}
};

const finishLevel1Round = () => {
	if (currentLevel !== 1) {
		return;
	}

	if (level1SongAudio) {
		level1SongAudio.pause();
	}

	isGameStarted = false;
	setStatus("Song finished");
	showGameOverScreen();
};

const startLevel1SongFadeOut = () => {
	if (!level1SongAudio || isLevel1Ending || currentLevel !== 1 || !isGameStarted) {
		return;
	}

	isLevel1Ending = true;
	stopFishStream();
	setStatus("Song ending...");

	const initialVolume = level1SongAudio.volume;
	const totalSteps = Math.max(1, Math.round(LEVEL1_FADE_OUT_MS / LEVEL1_FADE_STEP_MS));
	let currentStep = 0;

	level1FadeIntervalId = window.setInterval(() => {
		currentStep += 1;
		const ratio = Math.max(0, 1 - currentStep / totalSteps);
		level1SongAudio.volume = initialVolume * ratio;

		if (currentStep < totalSteps) {
			return;
		}

		window.clearInterval(level1FadeIntervalId);
		level1FadeIntervalId = null;
		finishLevel1Round();
		clearLevel1EndFlow();
	}, LEVEL1_FADE_STEP_MS);
};

const mod = (value, base) => {
	if (!Number.isFinite(base) || base === 0) {
		return 0;
	}

	return ((value % base) + base) % base;
};

const estimateLevel1BeatGridFromCues = (cuesMs) => {
	if (!Array.isArray(cuesMs) || cuesMs.length < 3) {
		return;
	}

	const candidateIntervals = [];
	for (let i = 1; i < cuesMs.length; i += 1) {
		const delta = cuesMs[i] - cuesMs[i - 1];
		if (delta >= 180 && delta <= 900) {
			candidateIntervals.push(delta);
		}
	}

	if (candidateIntervals.length === 0) {
		return;
	}

	candidateIntervals.sort((a, b) => a - b);
	const medianInterval = candidateIntervals[Math.floor(candidateIntervals.length / 2)];
	if (!Number.isFinite(medianInterval) || medianInterval <= 0) {
		return;
	}

	let bestOffset = level1EstimatedOffsetMs;
	let bestError = Infinity;
	const scanStepMs = 4;

	for (let offset = 0; offset < medianInterval; offset += scanStepMs) {
		let error = 0;
		for (let i = 0; i < cuesMs.length; i += 1) {
			const phase = mod(cuesMs[i] - offset, medianInterval);
			const distance = Math.min(phase, medianInterval - phase);
			error += distance * distance;
		}

		if (error < bestError) {
			bestError = error;
			bestOffset = offset;
		}
	}

	level1EstimatedBeatMs = medianInterval;
	level1EstimatedOffsetMs = bestOffset;
};

const ensureLevel1Song = () => {
	if (level1SongAudio) {
		return level1SongAudio;
	}

	level1SongAudio = new Audio(LEVEL1_SONG_SRC);
	level1SongAudio.loop = false;
	level1SongAudio.preload = "auto";
	level1SongAudio.volume = LEVEL1_BASE_VOLUME;
	level1SongAudio.addEventListener("timeupdate", () => {
		if (!level1SongAudio || !Number.isFinite(level1SongAudio.duration) || currentLevel !== 1 || !isGameStarted) {
			return;
		}

		const remainingMs = (level1SongAudio.duration - level1SongAudio.currentTime) * 1000;
		if (remainingMs <= LEVEL1_END_LEAD_MS) {
			startLevel1SongFadeOut();
		}
	});
	level1SongAudio.addEventListener("ended", () => {
		if (currentLevel !== 1) {
			return;
		}

		if (!isLevel1Ending && isGameStarted) {
			startLevel1SongFadeOut();
		}
	});
	return level1SongAudio;
};

const ensureNomSoundPool = () => {
	if (nomSoundPool.length > 0) {
		return nomSoundPool;
	}

	nomSoundPool = Array.from({ length: NOM_SOUND_POOL_SIZE }, () => {
		const audio = new Audio(NOM_SOUND_SRC);
		audio.preload = "auto";
		audio.volume = NOM_SOUND_VOLUME;
		return audio;
	});

	return nomSoundPool;
};

const ensureNomAudioContext = () => {
	if (nomAudioContext) {
		return nomAudioContext;
	}

	const ContextCtor = window.AudioContext || window.webkitAudioContext;
	if (!ContextCtor) {
		return null;
	}

	nomAudioContext = new ContextCtor();
	nomBassFilterNode = nomAudioContext.createBiquadFilter();
	nomBassFilterNode.type = "lowshelf";
	nomBassFilterNode.frequency.value = NOM_SOUND_BASS_FREQ_HZ;
	nomBassFilterNode.gain.value = NOM_SOUND_BASS_GAIN_DB;

	nomOutputGainNode = nomAudioContext.createGain();
	nomOutputGainNode.gain.value = isNomSoundMuted ? 0 : NOM_SOUND_GAIN;

	nomBassFilterNode.connect(nomOutputGainNode);
	nomOutputGainNode.connect(nomAudioContext.destination);

	return nomAudioContext;
};

const ensureNomSoundReady = async () => {
	if (nomAudioBuffer) {
		return true;
	}

	if (nomSoundLoadPromise) {
		return nomSoundLoadPromise;
	}

	const context = ensureNomAudioContext();
	if (!context) {
		ensureNomSoundPool();
		return false;
	}

	nomSoundLoadPromise = (async () => {
		const response = await fetch(NOM_SOUND_SRC);
		const encoded = await response.arrayBuffer();
		nomAudioBuffer = await context.decodeAudioData(encoded.slice(0));
		return true;
	})()
		.catch((error) => {
			console.warn("Nom sound Web Audio decode failed, using fallback.", error);
			ensureNomSoundPool();
			return false;
		})
		.finally(() => {
			nomSoundLoadPromise = null;
		});

	return nomSoundLoadPromise;
};

const setNomSoundMuted = (isMuted) => {
	isNomSoundMuted = isMuted;

	if (nomAudioContext && nomOutputGainNode) {
		const gainValue = isMuted ? 0 : NOM_SOUND_GAIN;
		nomOutputGainNode.gain.setValueAtTime(gainValue, nomAudioContext.currentTime);
	}

	const pool = ensureNomSoundPool();
	for (let i = 0; i < pool.length; i += 1) {
		pool[i].muted = isMuted;
	}
};

const playNomSound = () => {
	const startWebAudioPlayback = () => {
		if (!nomAudioContext || !nomAudioBuffer || !nomBassFilterNode) {
			return false;
		}

		if (nomAudioContext.state === "suspended") {
			nomAudioContext.resume().catch(() => {
				// If resume fails, fallback will still run.
			});
		}

		const source = nomAudioContext.createBufferSource();
		source.buffer = nomAudioBuffer;
		source.playbackRate.value = NOM_SOUND_PLAYBACK_RATE;
		source.connect(nomBassFilterNode);
		source.start(0);
		return true;
	};

	if (nomAudioBuffer && startWebAudioPlayback()) {
		return;
	}

	ensureNomSoundReady().then((ready) => {
		if (ready) {
			startWebAudioPlayback();
		}
	});

	const pool = ensureNomSoundPool();
	if (pool.length === 0) {
		return;
	}

	const audio = pool[nextNomSoundIndex % pool.length];
	nextNomSoundIndex = (nextNomSoundIndex + 1) % pool.length;

	audio.playbackRate = NOM_SOUND_PLAYBACK_RATE;
	audio.currentTime = 0;
	audio.play().catch(() => {
		// Ignore autoplay/momentary playback errors and continue gameplay.
	});
};

const analyzeLevel1ClapCues = async () => {
	if (isLevel1CueAnalysisDone || isLevel1CueAnalysisPending) {
		return;
	}

	if (!(window.AudioContext || window.webkitAudioContext)) {
		isLevel1CueAnalysisDone = true;
		return;
	}

	isLevel1CueAnalysisPending = true;

	try {
		const response = await fetch(LEVEL1_SONG_SRC);
		const audioBufferData = await response.arrayBuffer();
		const context = new (window.AudioContext || window.webkitAudioContext)();
		const buffer = await context.decodeAudioData(audioBufferData);
		await context.close();

		const channelCount = buffer.numberOfChannels;
		const sampleRate = buffer.sampleRate;
		const sampleCount = buffer.length;
		const mono = new Float32Array(sampleCount);

		for (let ch = 0; ch < channelCount; ch += 1) {
			const channel = buffer.getChannelData(ch);
			for (let i = 0; i < sampleCount; i += 1) {
				mono[i] += channel[i] / channelCount;
			}
		}

		const frameSize = 1024;
		const hopSize = 256;
		const frameCount = Math.max(0, Math.floor((sampleCount - frameSize) / hopSize));
		if (frameCount <= 0) {
			isLevel1CueAnalysisDone = true;
			return;
		}

		const energy = new Float32Array(frameCount);
		for (let frame = 0; frame < frameCount; frame += 1) {
			const offset = frame * hopSize;
			let sum = 0;
			for (let i = 0; i < frameSize; i += 1) {
				const sample = mono[offset + i];
				sum += sample * sample;
			}
			energy[frame] = Math.sqrt(sum / frameSize);
		}

		const novelty = new Float32Array(frameCount);
		const lookback = 8;
		for (let frame = lookback; frame < frameCount; frame += 1) {
			let meanPrev = 0;
			for (let i = frame - lookback; i < frame; i += 1) {
				meanPrev += energy[i];
			}
			meanPrev /= lookback;
			novelty[frame] = Math.max(0, energy[frame] - meanPrev);
		}

		let noveltySum = 0;
		let noveltySqSum = 0;
		for (let i = 0; i < frameCount; i += 1) {
			noveltySum += novelty[i];
			noveltySqSum += novelty[i] * novelty[i];
		}

		const noveltyMean = noveltySum / frameCount;
		const noveltyVariance = Math.max(0, noveltySqSum / frameCount - noveltyMean * noveltyMean);
		const noveltyStdDev = Math.sqrt(noveltyVariance);
		const threshold = noveltyMean + noveltyStdDev * 1.8;
		const minGapFrames = Math.max(1, Math.round((sampleRate * 0.2) / hopSize));
		const cues = [];
		let lastPeakFrame = -minGapFrames;

		for (let frame = 1; frame < frameCount - 1; frame += 1) {
			if (frame - lastPeakFrame < minGapFrames) {
				continue;
			}

			const isPeak = novelty[frame] > threshold && novelty[frame] >= novelty[frame - 1] && novelty[frame] > novelty[frame + 1];
			if (!isPeak) {
				continue;
			}

			const cueTimeMs = (frame * hopSize * 1000) / sampleRate;
			cues.push(cueTimeMs);
			lastPeakFrame = frame;
		}

		level1ClapCueTimesMs = cues;
		estimateLevel1BeatGridFromCues(cues);
		isLevel1CueAnalysisDone = true;
	} catch (error) {
		console.warn("Level 1 clap-cue analysis failed.", error);
		isLevel1CueAnalysisDone = true;
	} finally {
		isLevel1CueAnalysisPending = false;
	}
};

const clearCountdownDisplay = () => {
	if (countdownFrameId) {
		window.cancelAnimationFrame(countdownFrameId);
		countdownFrameId = null;
	}

	countdownLastStep = -1;

	if (countdownOverlay) {
		countdownOverlay.innerHTML = "";
	}
};

const showCountdownStep = (stepIndex) => {
	if (!countdownOverlay) {
		return;
	}

	countdownOverlay.innerHTML = "";
	const isGo = stepIndex === LEVEL1_COUNTDOWN_LABELS.length - 1;
	const el = document.createElement("span");
	el.className = "countdown-label";
	el.textContent = LEVEL1_COUNTDOWN_LABELS[stepIndex];
	el.setAttribute("data-anim", isGo ? "go" : "count");
	countdownOverlay.appendChild(el);
	el.addEventListener("animationend", () => el.remove(), { once: true });
};

const tickCountdown = () => {
	if (!level1SongAudio || !isGameStarted || currentLevel !== 1) {
		countdownFrameId = null;
		return;
	}

	const songMs = level1SongAudio.currentTime * 1000;
	const lastTriggerMs = LEVEL1_COUNTDOWN_TRIGGERS_MS[LEVEL1_COUNTDOWN_TRIGGERS_MS.length - 1];

	// Advance through any steps whose trigger time has passed
	for (let i = countdownLastStep + 1; i < LEVEL1_COUNTDOWN_TRIGGERS_MS.length; i += 1) {
		if (songMs >= LEVEL1_COUNTDOWN_TRIGGERS_MS[i]) {
			countdownLastStep = i;
			showCountdownStep(i);
		}
	}

	// Stop polling once the last label's animation has had time to finish
	if (countdownLastStep >= LEVEL1_COUNTDOWN_TRIGGERS_MS.length - 1 && songMs > lastTriggerMs + 1200) {
		countdownFrameId = null;
		return;
	}

	countdownFrameId = window.requestAnimationFrame(tickCountdown);
};

const startCountdownDisplay = () => {
	clearCountdownDisplay();

	if (!level1SongAudio || currentLevel !== 1) {
		return;
	}

	// Seed lastStep so we don't replay already-passed beats (e.g. on replay)
	const songMs = level1SongAudio.currentTime * 1000;
	for (let i = 0; i < LEVEL1_COUNTDOWN_TRIGGERS_MS.length; i += 1) {
		if (songMs >= LEVEL1_COUNTDOWN_TRIGGERS_MS[i]) {
			countdownLastStep = i;
		}
	}

	const lastTriggerMs = LEVEL1_COUNTDOWN_TRIGGERS_MS[LEVEL1_COUNTDOWN_TRIGGERS_MS.length - 1];
	if (songMs > lastTriggerMs + 1200) {
		return;
	}

	countdownFrameId = window.requestAnimationFrame(tickCountdown);
};

const playLevel1Song = async () => {
	try {
		const audio = ensureLevel1Song();
		analyzeLevel1ClapCues();
		clearLevel1EndFlow();
		audio.currentTime = 0;
		audio.volume = LEVEL1_BASE_VOLUME;
		await audio.play();
	} catch (error) {
		console.warn("Level 1 song could not start.", error);
	}
};

const stopLevel1Song = () => {
	if (!level1SongAudio) {
		return;
	}

	clearLevel1EndFlow();
	clearCountdownDisplay();
	level1SongAudio.pause();
	level1SongAudio.currentTime = 0;
};

const LEVEL_METRICS = {
	1: {
		mouthXRatio: 0.715,
		mouthYRatio: 0.62,
		catchXRatio: 0.73,
		catchYRatio: 0.64,
		landXRatio: 0.78,
		landYRatio: 0.9
	},
	2: {
		mouthXRatio: 0.5,
		mouthYRatio: 0.62,
		catchXRatio: 0.5,
		catchYRatio: 0.64,
		landXRatio: 0.54,
		landYRatio: 0.9
	}
};

const showClosed = () => {
	if (activeClosedSprite) {
		activeClosedSprite.classList.remove("is-hidden");
	}

	if (activeOpenSprite) {
		activeOpenSprite.classList.add("is-hidden");
	}

	isMouthOpen = false;
};

const showOpen = () => {
	if (activeClosedSprite) {
		activeClosedSprite.classList.add("is-hidden");
	}

	if (activeOpenSprite) {
		activeOpenSprite.classList.remove("is-hidden");
	}

	isMouthOpen = true;
};


const setStatus = (message) => {
	if (trackerStatus) {
		trackerStatus.textContent = message;
	}
};

const setDebug = (lines) => {
	if (!trackerDebug) {
		return;
	}

	trackerDebug.textContent = lines.join("\n");
};

const getBeatDebugLine = () => {
	if (currentLevel !== 1 || !Number.isFinite(level1EstimatedBeatMs) || level1EstimatedBeatMs <= 0) {
		return "beat: -";
	}

	const bpm = Math.round(60000 / level1EstimatedBeatMs);
	return `beat: ${bpm} bpm | phase: ${Math.round(level1EstimatedOffsetMs)}ms`;
};

const updateFishCounter = () => {
	if (!fishCounter) {
		return;
	}

	const levelText = currentLevel ? `Level ${currentLevel} | ` : "";
	fishCounter.textContent = `${levelText}Eaten: ${eatenFishCount} | Missed: ${missedFishCount}`;
};

const applyLevelConfig = (levelNumber) => {
	const config = LEVEL_CONFIGS[levelNumber] || LEVEL_CONFIGS[1];
	currentSpawnIntervalMs = config.spawnIntervalMs;
	currentFlightMinMs = config.flightMinMs;
	currentFlightMaxMs = config.flightMaxMs;
	currentCatchRadiusScale = config.catchRadiusScale;
};

const applyLevelVisuals = (levelNumber) => {
	if (!scene) {
		return;
	}

	scene.classList.toggle("is-level-2", levelNumber === 2);

	if (levelNumber === 2) {
		activeClosedSprite = dogClosed;
		activeOpenSprite = dogOpen;
	} else {
		activeClosedSprite = catClosed;
		activeOpenSprite = catOpen;
	}

	if (catClosed) {
		catClosed.classList.add("is-hidden");
	}

	if (catOpen) {
		catOpen.classList.add("is-hidden");
	}

	if (dogClosed) {
		dogClosed.classList.add("is-hidden");
	}

	if (dogOpen) {
		dogOpen.classList.add("is-hidden");
	}

	showClosed();
};

const toPoint = (point) => {
	if (Array.isArray(point)) {
		return { x: point[0], y: point[1] };
	}

	return {
		x: point.x,
		y: point.y
	};
};

const getLandmarks = (hand) => {
	if (!hand) {
		return null;
	}

	let points = null;

	if (Array.isArray(hand.landmarks) && hand.landmarks.length >= 21) {
		points = hand.landmarks.map(toPoint);
	}

	if (!points && Array.isArray(hand.keypoints) && hand.keypoints.length >= 21) {
		points = hand.keypoints.slice(0, 21).map(toPoint);
	}

	if (!points) {
		return null;
	}

	let maxX = 0;
	let maxY = 0;

	for (let i = 0; i < points.length; i += 1) {
		if (points[i].x > maxX) {
			maxX = points[i].x;
		}

		if (points[i].y > maxY) {
			maxY = points[i].y;
		}
	}

	const appearsNormalized = maxX <= 2 && maxY <= 2;

	if (!appearsNormalized) {
		return points;
	}

	return points.map((point) => ({
		x: point.x * videoWidth,
		y: point.y * videoHeight
	}));
};

const palmCenter = (landmarks) => {
	const anchorIndexes = [0, 5, 9, 13, 17];
	let x = 0;
	let y = 0;

	for (let i = 0; i < anchorIndexes.length; i += 1) {
		const point = landmarks[anchorIndexes[i]];
		x += point.x;
		y += point.y;
	}

	return {
		x: x / anchorIndexes.length,
		y: y / anchorIndexes.length
	};
};

const pointDistance = (pointA, pointB) => {
	const dx = pointA.x - pointB.x;
	const dy = pointA.y - pointB.y;
	return Math.hypot(dx, dy);
};

const lerp = (start, end, amount) => start + (end - start) * amount;

const getFishFlightProgress = (linearT, isLevel1) => {
	if (!isLevel1) {
		return linearT;
	}

	const t = Math.max(0, Math.min(1, linearT));
	const slowStart = 0.78;
	const pathAtSlowStart = 0.86;

	if (t <= slowStart) {
		return (t / slowStart) * pathAtSlowStart;
	}

	return pathAtSlowStart + ((t - slowStart) / (1 - slowStart)) * (1 - pathAtSlowStart);
};

const getSceneMetrics = () => {
	const bounds = scene.getBoundingClientRect();
	const ratios = LEVEL_METRICS[currentLevel] || LEVEL_METRICS[1];

	return {
		width: bounds.width,
		height: bounds.height,
		mouthX: bounds.width * ratios.mouthXRatio,
		mouthY: bounds.height * ratios.mouthYRatio,
		catchX: bounds.width * ratios.catchXRatio,
		catchY: bounds.height * ratios.catchYRatio,
		landX: bounds.width * ratios.landXRatio,
		landY: bounds.height * ratios.landYRatio
	};
};

const getBeatSyncedFlightDurationMs = () => {
	if (currentLevel !== 1 || !level1SongAudio || Number.isNaN(level1SongAudio.currentTime)) {
		return null;
	}

	const songNowMs = level1SongAudio.currentTime * 1000;
	const beatMs = level1EstimatedBeatMs || 60000 / LEVEL1_FALLBACK_BPM;
	const targetTravelMs = beatMs * LEVEL1_FALLBACK_TRAVEL_BEATS;
	const targetArrivalMs = songNowMs + targetTravelMs + LEVEL1_SYNC_OFFSET_MS;
	const beatOffsetMs = level1EstimatedOffsetMs;
	const beatsSinceOffset = (targetArrivalMs - beatOffsetMs) / beatMs;
	const nextWholeBeat = Math.ceil(beatsSinceOffset);
	const snappedArrivalMs = nextWholeBeat * beatMs + beatOffsetMs;
	const snappedDurationMs = snappedArrivalMs - songNowMs;

	return Math.max(currentFlightMinMs, Math.min(currentFlightMaxMs, snappedDurationMs));
};

const getNextLevel1BeatSongMs = (afterSongMs) => {
	if (currentLevel !== 1 || !level1SongAudio) {
		return null;
	}
	const beatMs = level1EstimatedBeatMs || 60000 / LEVEL1_FALLBACK_BPM;
	const downbeatSpanMs = beatMs * Math.max(1, LEVEL1_DOWNBEAT_SPAN_BEATS);
	const beatOffsetMs = level1EstimatedOffsetMs;
	const downbeatsSinceOffset = (afterSongMs - beatOffsetMs) / downbeatSpanMs;
	const nextDownbeat = Math.ceil(downbeatsSinceOffset);
	return nextDownbeat * downbeatSpanMs + beatOffsetMs;
};

const getLevel1FlightDurationForArrival = (arrivalSongMs) => {
	if (!level1SongAudio || Number.isNaN(level1SongAudio.currentTime)) {
		return null;
	}

	const nowSongMs = level1SongAudio.currentTime * 1000;
	const rawDurationMs = arrivalSongMs - nowSongMs + LEVEL1_SYNC_OFFSET_MS;
	if (!Number.isFinite(rawDurationMs)) {
		return null;
	}

	// Keep beat-targeted arrivals exact; only guard impossible/negative values.
	return Math.max(120, rawDurationMs);
};

const createFishSprite = () => {
	const fish = document.createElement("img");
	fish.className = "fish-sprite";
	fish.src = fishSpriteSrc;
	fish.alt = "";
	return fish;
};

const prepareFishSprite = async () => {
	try {
		const image = new Image();
		image.src = FISH_IMAGE_SRC;
		await image.decode();

		const canvas = document.createElement("canvas");
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext("2d", { willReadFrequently: true });
		context.drawImage(image, 0, 0);

		const pixelData = context.getImageData(0, 0, image.width, image.height).data;
		let minX = image.width;
		let minY = image.height;
		let maxX = -1;
		let maxY = -1;

		for (let y = 0; y < image.height; y += 1) {
			for (let x = 0; x < image.width; x += 1) {
				const alpha = pixelData[(y * image.width + x) * 4 + 3];
				if (alpha <= 0) {
					continue;
				}

				if (x < minX) {
					minX = x;
				}
				if (y < minY) {
					minY = y;
				}
				if (x > maxX) {
					maxX = x;
				}
				if (y > maxY) {
					maxY = y;
				}
			}
		}

		if (maxX < minX || maxY < minY) {
			return;
		}

		const cropWidth = maxX - minX + 1;
		const cropHeight = maxY - minY + 1;
		const croppedCanvas = document.createElement("canvas");
		croppedCanvas.width = cropWidth;
		croppedCanvas.height = cropHeight;
		const croppedContext = croppedCanvas.getContext("2d");
		croppedContext.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

		fishSpriteSrc = croppedCanvas.toDataURL("image/png");
		fishWidthRatioToFrame = Math.max(0.03, Math.min(0.25, cropWidth / FIGMA_FRAME_WIDTH));
	} catch (error) {
		console.warn("Failed to prepare cropped fish sprite, using fallback.", error);
	}
};

const spawnFish = (options = {}) => {
	if (!fishFlightLayer || !scene) {
		return;
	}

	const metrics = getSceneMetrics();
	const sprite = createFishSprite();
	const isLevel1 = currentLevel === 1;
	const fishWidth = Math.max(34, metrics.width * fishWidthRatioToFrame);
	const startY = lerp(metrics.height * 0.27, metrics.height * 0.43, Math.random());
	const controlX = lerp(metrics.width * 0.28, metrics.width * 0.5, Math.random());
	const controlY = lerp(metrics.height * 0.03, metrics.height * 0.2, Math.random());
	const endX = isLevel1 ? metrics.mouthX : metrics.catchX + lerp(-28, 24, Math.random());
	const endY = isLevel1 ? metrics.mouthY : metrics.catchY + lerp(-14, 10, Math.random());
	const beatSyncedDurationMs = getBeatSyncedFlightDurationMs();
	const arrivalDurationMs = Number.isFinite(options.targetArrivalSongMs)
		? getLevel1FlightDurationForArrival(options.targetArrivalSongMs)
		: null;
	const durationMs = arrivalDurationMs || beatSyncedDurationMs || lerp(currentFlightMinMs, currentFlightMaxMs, Math.random());

	sprite.style.width = `${Math.round(fishWidth)}px`;

	fishFlightLayer.appendChild(sprite);
	activeFish.push({
		sprite,
		phase: "flight",
		resolved: false,
		startAt: performance.now(),
		durationMs,
		startX: -fishWidth - 20,
		startY,
		controlX,
		controlY,
		endX,
		endY,
		landStartAt: 0,
		landStartX: 0,
		landStartY: 0,
		landEndX: metrics.landX + lerp(-26, 28, Math.random()),
		landEndY: metrics.landY + lerp(-8, 8, Math.random()),
		landDurationMs: lerp(260, 420, Math.random()),
		landAngle: lerp(-8, 8, Math.random()),
		currentX: -fishWidth - 20,
		currentY: startY
	});
};

const landFishBehindCat = (fish, startX, startY) => {
	if (!fishLandedLayer) {
		return;
	}

	fish.phase = "landing";
	fish.resolved = true;
	fish.landStartAt = performance.now();
	fish.landStartX = startX;
	fish.landStartY = startY;
	fish.sprite.classList.add("is-landed");
	fishLandedLayer.appendChild(fish.sprite);

	while (fishLandedLayer.childElementCount > MAX_LANDED_FISH) {
		fishLandedLayer.firstElementChild.remove();
	}
};

const removeFish = (fish, index) => {
	fish.sprite.remove();
	activeFish.splice(index, 1);
};

const retireFish = (index) => {
	activeFish.splice(index, 1);
};

const animateFish = () => {
	const now = performance.now();

	for (let i = activeFish.length - 1; i >= 0; i -= 1) {
		const fish = activeFish[i];
		const metrics = getSceneMetrics();

		if (fish.phase === "flight") {
			const t = Math.min(1, (now - fish.startAt) / fish.durationMs);
			const curveT = getFishFlightProgress(t, currentLevel === 1);
			const oneMinusT = 1 - curveT;
			const x = oneMinusT * oneMinusT * fish.startX + 2 * oneMinusT * curveT * fish.controlX + curveT * curveT * fish.endX;
			const y = oneMinusT * oneMinusT * fish.startY + 2 * oneMinusT * curveT * fish.controlY + curveT * curveT * fish.endY;
			fish.currentX = x;
			fish.currentY = y;
			const tangentX = 2 * oneMinusT * (fish.controlX - fish.startX) + 2 * curveT * (fish.endX - fish.controlX);
			const tangentY = 2 * oneMinusT * (fish.controlY - fish.startY) + 2 * curveT * (fish.endY - fish.controlY);
			const angle = Math.atan2(tangentY, tangentX) * (180 / Math.PI);

			fish.sprite.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
			const mouthDistance = Math.hypot(metrics.mouthX - x, metrics.mouthY - y);
			const mouthCatchRadius = Math.max(24, metrics.width * 0.045 * currentCatchRadiusScale);

			if (!fish.resolved && mouthDistance <= mouthCatchRadius) {
				fish.resolved = true;
				if (isMouthOpen) {
					eatenFishCount += 1;
					playNomSound();
					updateFishCounter();
					isMouthLockedClosed = true;
					clapOpenUntil = 0;
					showClosed();
					removeFish(fish, i);
				} else {
					missedFishCount += 1;
					updateFishCounter();
					isMouthLockedClosed = true;
					clapOpenUntil = 0;
					showClosed();
					landFishBehindCat(fish, x, y);
				}
				continue;
			}

			if (t >= 1) {
				if (fish.resolved) {
					removeFish(fish, i);
				} else if (isMouthOpen) {
					eatenFishCount += 1;
					playNomSound();
					updateFishCounter();
					isMouthLockedClosed = true;
					clapOpenUntil = 0;
					showClosed();
					removeFish(fish, i);
				} else {
					missedFishCount += 1;
					updateFishCounter();
					isMouthLockedClosed = true;
					clapOpenUntil = 0;
					showClosed();
					landFishBehindCat(fish, x, y);
				}
			}
			continue;
		}

		if (fish.phase === "landing") {
			const t = Math.min(1, (now - fish.landStartAt) / fish.landDurationMs);
			const eased = t * (2 - t);
			const x = lerp(fish.landStartX, fish.landEndX, eased);
			const y = lerp(fish.landStartY, fish.landEndY, eased);
			fish.sprite.style.transform = `translate(${x}px, ${y}px) rotate(${fish.landAngle}deg)`;

			if (t >= 1) {
				retireFish(i);
			}
		}
	}

	fishAnimationFrameId = window.requestAnimationFrame(animateFish);
};

const stopFishSpawnTimers = () => {
	if (fishSpawnTimerId) {
		window.clearInterval(fishSpawnTimerId);
		fishSpawnTimerId = null;
	}

	if (level1BeatSpawnTimerId) {
		window.clearTimeout(level1BeatSpawnTimerId);
		level1BeatSpawnTimerId = null;
	}

	if (fishStartDelayTimerId) {
		window.clearTimeout(fishStartDelayTimerId);
		fishStartDelayTimerId = null;
	}

	lastScheduledLevel1BeatSongMs = -Infinity;
};

const scheduleLevel1BeatSpawn = () => {
	if (currentLevel !== 1 || !isGameStarted || !level1SongAudio) {
		return;
	}

	const nowSongMs = level1SongAudio.currentTime * 1000;
	if (nowSongMs < LEVEL1_COUNTIN_END_MS) {
		const waitMs = Math.max(40, LEVEL1_COUNTIN_END_MS - nowSongMs);
		level1BeatSpawnTimerId = window.setTimeout(scheduleLevel1BeatSpawn, waitMs);
		return;
	}

	const targetLeadMs = (currentFlightMinMs + currentFlightMaxMs) / 2;
	const beatSongMs = getNextLevel1BeatSongMs(nowSongMs + targetLeadMs);
	if (!Number.isFinite(beatSongMs)) {
		// Retry soon until beat timing data is available.
		level1BeatSpawnTimerId = window.setTimeout(scheduleLevel1BeatSpawn, 120);
		return;
	}

	const spawnDelayMs = Math.max(28, beatSongMs - targetLeadMs - nowSongMs);
	level1BeatSpawnTimerId = window.setTimeout(() => {
		if (currentLevel !== 1 || !isGameStarted) {
			return;
		}

		if (Math.abs(beatSongMs - lastScheduledLevel1BeatSongMs) < 1) {
			scheduleLevel1BeatSpawn();
			return;
		}

		lastScheduledLevel1BeatSongMs = beatSongMs;

		spawnFish({ targetArrivalSongMs: beatSongMs });
		scheduleLevel1BeatSpawn();
	}, spawnDelayMs);
};

const startFishStream = () => {
	if (fishSpawnTimerId || fishAnimationFrameId || fishStartDelayTimerId) {
		return;
	}

	if (isTrackingStarted && trackingReadyAtMs > 0) {
		const elapsedMs = performance.now() - trackingReadyAtMs;
		const remainingMs = INITIAL_FISH_DELAY_MS - elapsedMs;
		if (remainingMs > 0) {
			fishStartDelayTimerId = window.setTimeout(() => {
				fishStartDelayTimerId = null;
				startFishStream();
			}, remainingMs);
			return;
		}
	}

	if (currentLevel !== 1) {
		return;
	}

	scheduleLevel1BeatSpawn();
	fishAnimationFrameId = window.requestAnimationFrame(animateFish);
};

const hideLevelScreen = () => {
	if (!levelScreen) {
		return;
	}

	levelScreen.classList.add("is-hidden");
	levelScreen.setAttribute("aria-hidden", "true");
};

const showLevelScreen = () => {
	if (!levelScreen) {
		return;
	}

	levelScreen.classList.remove("is-hidden");
	levelScreen.setAttribute("aria-hidden", "false");
};

const hideGameOverScreen = () => {
	if (!gameOverScreen) {
		return;
	}

	gameOverScreen.classList.add("is-hidden");
	gameOverScreen.setAttribute("aria-hidden", "true");
};

const showGameOverScreen = () => {
	if (!gameOverScreen) {
		return;
	}

	gameOverScreen.classList.remove("is-hidden");
	gameOverScreen.setAttribute("aria-hidden", "false");
};

const clearAllFish = () => {
	for (let i = activeFish.length - 1; i >= 0; i -= 1) {
		activeFish[i].sprite.remove();
	}
	activeFish.length = 0;

	if (fishLandedLayer) {
		fishLandedLayer.innerHTML = "";
	}

	if (fishFlightLayer) {
		fishFlightLayer.innerHTML = "";
	}
};

const stopFishStream = () => {
	stopFishSpawnTimers();

	if (fishAnimationFrameId) {
		window.cancelAnimationFrame(fishAnimationFrameId);
		fishAnimationFrameId = null;
	}

	clearAllFish();
};

const startGameplayForCurrentLevel = () => {
	if (!isGameStarted) {
		return;
	}

	hideGameOverScreen();

	if (currentLevel === 1) {
		playLevel1Song();
		startCountdownDisplay();
		setStatus("Hand tracking ready - waiting for song count-in");
		setDebug([`camera: ${videoWidth}x${videoHeight}`, "ml5: model ready", "song: waiting for 3-2-1-go"]);
	} else {
		stopLevel1Song();
	}

	startFishStream();
};

const startLevel = (levelNumber) => {
	if (isGameStarted) {
		return;
	}

	isGameStarted = true;
	isMouthLockedClosed = false;
	clapOpenUntil = 0;
	wasPalmsTouching = false;
	currentLevel = levelNumber;
	eatenFishCount = 0;
	missedFishCount = 0;
	applyLevelConfig(levelNumber);
	applyLevelVisuals(levelNumber);
	updateFishCounter();
	hideLevelScreen();
	hideGameOverScreen();
	setStatus(`Level ${currentLevel} started`);
	setDebug(["level: selected", `current: ${currentLevel}`, "camera: starting..."]);
	stopFishStream();
	lastScheduledLevel1BeatSongMs = -Infinity;
	if (levelNumber !== 1) {
		stopLevel1Song();
	}
	if (isTrackingStarted) {
		trackingReadyAtMs = performance.now();
		startGameplayForCurrentLevel();
		return;
	}

	startHandTracking();
};

const setupLevelScreen = () => {
	if (level1Button) {
		level1Button.addEventListener("click", () => startLevel(1));
	}

	if (level2Button) {
		level2Button.addEventListener("click", () => startLevel(2));
	}

	if (replayButton) {
		replayButton.addEventListener("click", () => {
			if (!currentLevel) {
				return;
			}

			isGameStarted = false;
			startLevel(currentLevel);
		});
	}

	if (levelSelectButton) {
		levelSelectButton.addEventListener("click", () => {
			stopFishStream();
			stopLevel1Song();
			isGameStarted = false;
			currentLevel = null;
			eatenFishCount = 0;
			missedFishCount = 0;
			isMouthLockedClosed = false;
			clapOpenUntil = 0;
			wasPalmsTouching = false;
			applyLevelVisuals(1);
			updateFishCounter();
			hideGameOverScreen();
			showLevelScreen();
			setStatus("Select a level to begin");
			setDebug(["level: waiting for selection"]);
		});
	}

	setStatus("Select a level to begin");
	setDebug(["level: waiting for selection"]);
};

const getHandLabel = (hand) => {
	if (typeof hand.handedness === "string") {
		return hand.handedness.toLowerCase();
	}

	if (Array.isArray(hand.handednesses) && hand.handednesses.length > 0) {
		const first = hand.handednesses[0];
		if (typeof first === "string") {
			return first.toLowerCase();
		}

		if (first && typeof first.label === "string") {
			return first.label.toLowerCase();
		}
	}

	return "";
};

const detectClapFromHands = (multiHandLandmarks) => {
	const handsCount = Array.isArray(multiHandLandmarks) ? multiHandLandmarks.length : 0;
	const now = performance.now();

	const entries = [];
	if (Array.isArray(multiHandLandmarks)) {
		for (let i = 0; i < multiHandLandmarks.length; i += 1) {
			const hand = multiHandLandmarks[i];
			const landmarks = getLandmarks(hand);
			if (!landmarks) {
				continue;
			}

			entries.push({
				label: getHandLabel(hand),
				palm: palmCenter(landmarks),
				span: pointDistance(landmarks[5], landmarks[17])
			});
		}
	}

	let leftEntry = null;
	let rightEntry = null;
	const unknownEntries = [];

	for (let i = 0; i < entries.length; i += 1) {
		const entry = entries[i];
		if (entry.label.includes("left") && !leftEntry) {
			leftEntry = entry;
			continue;
		}

		if (entry.label.includes("right") && !rightEntry) {
			rightEntry = entry;
			continue;
		}

		unknownEntries.push(entry);
	}

	if (unknownEntries.length > 0) {
		const remainingEntries = [];

		for (let i = 0; i < unknownEntries.length; i += 1) {
			const entry = unknownEntries[i];
			const canAssignLeftByHistory = !leftEntry && !!lastLeftPalm;
			const canAssignRightByHistory = !rightEntry && !!lastRightPalm;

			if (canAssignLeftByHistory && canAssignRightByHistory) {
				const leftDistance = pointDistance(entry.palm, lastLeftPalm);
				const rightDistance = pointDistance(entry.palm, lastRightPalm);
				if (leftDistance <= rightDistance) {
					leftEntry = entry;
				} else {
					rightEntry = entry;
				}
				continue;
			}

			if (canAssignLeftByHistory) {
				leftEntry = entry;
				continue;
			}

			if (canAssignRightByHistory) {
				rightEntry = entry;
				continue;
			}

			remainingEntries.push(entry);
		}

		remainingEntries.sort((a, b) => a.palm.x - b.palm.x);

		for (let i = 0; i < remainingEntries.length; i += 1) {
			const entry = remainingEntries[i];
			if (!leftEntry && !rightEntry && remainingEntries.length === 1) {
				if (entry.palm.x < videoWidth * 0.5) {
					leftEntry = entry;
				} else {
					rightEntry = entry;
				}
				continue;
			}

			if (!leftEntry) {
				leftEntry = entry;
				continue;
			}

			if (!rightEntry) {
				rightEntry = entry;
			}
		}
	}

	if (leftEntry) {
		lastLeftPalm = leftEntry.palm;
		lastLeftSpan = leftEntry.span;
		lastLeftSeenAt = now;
	}

	if (rightEntry) {
		lastRightPalm = rightEntry.palm;
		lastRightSpan = rightEntry.span;
		lastRightSeenAt = now;
	}

	const leftIsFresh = lastLeftPalm && now - lastLeftSeenAt <= HAND_MEMORY_MS;
	const rightIsFresh = lastRightPalm && now - lastRightSeenAt <= HAND_MEMORY_MS;
	const leftIsUsable = lastLeftPalm && now - lastLeftSeenAt <= STALE_HOLD_MS;
	const rightIsUsable = lastRightPalm && now - lastRightSeenAt <= STALE_HOLD_MS;
	const trackedHandsCount = (leftIsUsable ? 1 : 0) + (rightIsUsable ? 1 : 0);
	const observedHandsCount = Math.max(handsCount, trackedHandsCount);

	if (!leftIsUsable || !rightIsUsable) {
		wasPalmsTouching = false;
		clapOpenUntil = 0;
		isMouthLockedClosed = false;
		showClosed();
		setStatus("Show both palms clearly");

		setDebug([
			`hands: ${observedHandsCount} (raw: ${handsCount} | tracked: ${trackedHandsCount})`,
			"palmDistance: -",
			"threshold: -",
			getBeatDebugLine(),
			`leftFresh: ${leftIsFresh ? "yes" : "no"}`,
			`rightFresh: ${rightIsFresh ? "yes" : "no"}`,
			`leftUsable: ${leftIsUsable ? "yes" : "no"}`,
			`rightUsable: ${rightIsUsable ? "yes" : "no"}`,
			`touching: ${wasPalmsTouching ? "yes" : "no"}`,
			"mode: touch-only"
		]);
		return;
	}

	const palmDistance = pointDistance(lastLeftPalm, lastRightPalm);
	const avgPalmSpan = (lastLeftSpan + lastRightSpan) / 2;

	const baseTouchThresholdPx = Math.min(CLAP_TOUCH_MAX_PX, Math.max(CLAP_TOUCH_MIN_PX, avgPalmSpan * CLAP_TOUCH_THRESHOLD_SCALE));
	const contactThresholdPx = Math.max(42, Math.min(120, baseTouchThresholdPx * 0.72));
	const releaseThresholdPx = contactThresholdPx + 14;

	let palmsTouching = false;
	if (wasPalmsTouching) {
		palmsTouching = palmDistance < releaseThresholdPx;
	} else {
		palmsTouching = palmDistance < contactThresholdPx;
	}

	const contactClap = palmsTouching;
	clapOpenUntil = 0;
	isMouthLockedClosed = false;

	const isMouthOpenNow = contactClap;
	if (isMouthOpenNow) {
		showOpen();
		setStatus("Hands touching");
	} else {
		showClosed();
		setStatus("Bring hands together");
	}

	lastPalmDistance = palmDistance;
	lastPalmDistanceAt = now;
	wasPalmsTouching = palmsTouching;

	setDebug([
		`hands: ${observedHandsCount} (raw: ${handsCount} | tracked: ${trackedHandsCount})`,
		`palmDistance: ${Math.round(palmDistance)}px`,
		`palmSpan: ${Math.round(avgPalmSpan)}px`,
		`threshold: ${Math.round(contactThresholdPx)}px`,
		`release: ${Math.round(releaseThresholdPx)}px`,
		getBeatDebugLine(),
		`leftFresh: ${leftIsFresh ? "yes" : "no"}`,
		`rightFresh: ${rightIsFresh ? "yes" : "no"}`,
		`leftUsable: ${leftIsUsable ? "yes" : "no"}`,
		`rightUsable: ${rightIsUsable ? "yes" : "no"}`,
		`touching: ${palmsTouching ? "yes" : "no"}`,
		`contact: ${contactClap ? "yes" : "no"}`,
		"mode: touch-only"
	]);
};

const startVideo = async () => {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			width: { ideal: 640 },
			height: { ideal: 480 },
			facingMode: "user"
		},
		audio: false
	});

	inputVideo.srcObject = stream;
	inputVideo.muted = true;
	await inputVideo.play();

	videoWidth = inputVideo.videoWidth || 640;
	videoHeight = inputVideo.videoHeight || 480;
};

const startHandTracking = async () => {
	if (isTrackingStarted) {
		return;
	}

	if (!window.ml5 || !window.ml5.handPose) {
		setStatus("ml5 failed to load");
		setDebug(["ml5: not loaded", "camera: not started"]);
		return;
	}

	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		setStatus("Camera is not supported on this browser");
		setDebug(["camera: unsupported browser"]);
		return;
	}

	try {
		setStatus("Starting camera...");
		setDebug(["camera: requesting permission"]);
		await startVideo();

		setStatus("Loading ml5 hand model...");
		setDebug([`camera: ${videoWidth}x${videoHeight}`, "ml5: loading model"]);
		const handPose = await window.ml5.handPose({
			maxHands: 2,
			flipped: true,
			runtime: "mediapipe",
			modelType: "lite",
			minDetectionConfidence: HANDPOSE_MIN_DETECTION_CONFIDENCE,
			minTrackingConfidence: HANDPOSE_MIN_TRACKING_CONFIDENCE
		});

		isTrackingStarted = true;
		trackingReadyAtMs = performance.now();
		setStatus("Hand tracking ready");
		setDebug([`camera: ${videoWidth}x${videoHeight}`, "ml5: model ready", "hands: waiting..."]);

		if (isGameStarted) {
			startGameplayForCurrentLevel();
		}

		if (typeof handPose.detectStart === "function") {
			handPose.detectStart(inputVideo, (results) => {
				detectClapFromHands(results);
			});
			return;
		}

		const detectLoop = async () => {
			if (!isTrackingStarted) {
				return;
			}

			const results = await handPose.detect(inputVideo);
			detectClapFromHands(results);
			window.requestAnimationFrame(detectLoop);
		};

		detectLoop();
	} catch (error) {
		setStatus("Camera permission is required for clap tracking");
		setDebug(["camera: failed", "tip: allow webcam permission"]);
		console.error("Camera access is required for ml5 hand-tracking clap detection.", error);
	}
};


window.addEventListener(
	"pointerdown",
	() => {
		if (isGameStarted && !isTrackingStarted) {
			startHandTracking();
		}
	},
	{ passive: true }
);

const setupMuteButton = () => {
	if (!muteButton) {
		return;
	}

	muteButton.addEventListener("click", () => {
		const audio = ensureLevel1Song();
		audio.muted = !audio.muted;
		setNomSoundMuted(audio.muted);
		muteButton.textContent = audio.muted ? "🔇" : "🔊";
		muteButton.setAttribute("aria-pressed", String(audio.muted));
		muteButton.setAttribute("aria-label", audio.muted ? "Unmute music" : "Mute music");
	});
};

const init = async () => {
	updateFishCounter();
	ensureNomSoundReady();
	await prepareFishSprite();
	setupLevelScreen();
	setupMuteButton();
};

init();
