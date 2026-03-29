const catClosed = document.getElementById("catClosed");
const catClosedKeyed = document.getElementById("catClosedKeyed");
const catOpen = document.getElementById("catOpen");
const catYuck = document.getElementById("catYuck");
const dogClosed = document.getElementById("dogClosed");
const dogOpen = document.getElementById("dogOpen");
const trackerStatus = document.getElementById("trackerStatus");
const trackerDebug = document.getElementById("trackerDebug");
const fishCounter = document.getElementById("fishCounter");
const muteButton = document.getElementById("muteButton");
const gameControls = document.getElementById("gameControls");
const pauseButton = document.getElementById("pauseButton");
const homeButton = document.getElementById("homeButton");
const inputVideo = document.getElementById("inputVideo");
const scene = document.querySelector(".scene");
const eventFeedbackLayer = document.getElementById("eventFeedbackLayer");
const fishFlightLayer = document.getElementById("fishFlightLayer");
const fishLandedLayer = document.getElementById("fishLandedLayer");
const levelScreen = document.getElementById("levelScreen");
const level1Button = document.getElementById("level1Button");
const level2Button = document.getElementById("level2Button");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverScore = document.getElementById("gameOverScore");
const skipButton = document.getElementById("skipButton");
const skipLevelButton = document.getElementById("skipLevelButton");
const replayButton = document.getElementById("replayButton");
const levelSelectButton = document.getElementById("levelSelectButton");
const countdownOverlay = document.getElementById("countdownOverlay");
const clapCueOverlay = document.getElementById("clapCueOverlay");
const clapCueText = document.getElementById("clapCueText");

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
const PUFFERFISH_IMAGE_SRC = "images/pufferfish.png";
const YUCK_IMAGE_SRC = "images/yuck!.png";
const YUCK_DISPLAY_MS = 2200;
const NOM_SOUND_SRC = "images/543386__thedragonsspark__nom-noise.wav";
const NOM_SOUND_POOL_SIZE = 4;
const NOM_SOUND_VOLUME = 0.88;
const NOM_SOUND_GAIN = 1.14;
const NOM_SOUND_BASS_GAIN_DB = 11;
const NOM_SOUND_BASS_FREQ_HZ = 180;
const NOM_SOUND_PLAYBACK_RATE = 0.92;
const WOOF_SOUND_SRC = "images/bark.mp3";
const WOOF_SOUND_POOL_SIZE = 3;
const WOOF_SOUND_VOLUME = 0.98;
const WOOF_SOUND_COOLDOWN_MS = 130;
const FEEDBACK_STINGER_MIN_GAP_MS = 70;
const FEEDBACK_STINGER_GAIN = 0.14;
const LEVEL1_SONG_SRC = "images/Fish_Catching_Rhythm_Fun_2026-03-24T220746.mp3";
const LEVEL2_SONG_SRC = "images/Bark_with_the_Choir_2026-03-27T182741.mp3";
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
const CAT_CLOSED_HEAD_DOWN_AT_RATIO = 0.46;
const HANDPOSE_MIN_DETECTION_CONFIDENCE = 0.15;
const HANDPOSE_MIN_TRACKING_CONFIDENCE = 0.15;
const LOCK_RELEASE_DISTANCE_SCALE = 1.1;
const LEVEL1_BASE_VOLUME = 0.85;
const LEVEL2_BASE_VOLUME = 0.85;
const LEVEL1_END_LEAD_MS = 2300;
const LEVEL1_FADE_OUT_MS = 1800;
const LEVEL1_FADE_STEP_MS = 40;
const LEVEL2_END_LEAD_MS = 2300;
const LEVEL2_FADE_OUT_MS = 1800;
const LEVEL2_FADE_STEP_MS = 40;
const TOXIC_DRIP_OVERLAY_MAX_MS = 3800;

// Countdown "3 2 1 Go!" — song times (ms) when each label should appear.
// Detected from audio: beat grid ~333 ms; "3" at 10.870 s, "Go!" at 11.868 s.
const LEVEL1_COUNTDOWN_LABELS = ["3", "2", "1", "Go!"];
const LEVEL1_COUNTDOWN_TRIGGERS_MS = [10870, 11198, 11535, 11868];
// Level 2: "3" at 6.000 s, 727 ms spacing — "Go!" animation (820 ms) ends at ~9.000 s.
const LEVEL2_COUNTDOWN_LABELS = ["3", "2", "1", "Go!"];
const LEVEL2_COUNTDOWN_TRIGGERS_MS = [6000, 7000, 8000, 9000];
const LEVEL1_CLAP_CUE_WORDS = ["Clap", "along", "with", "the", "beat", "to", "catch", "the", "fish"];
const LEVEL1_CLAP_CUE_FALLBACK_TRIGGERS_MS = [5050, 5335, 5620, 5905, 6190, 6475, 6760, 7045, 7330];
const LEVEL1_CLAP_LYRIC_SEARCH_START_MS = 4200;
const LEVEL1_CLAP_LYRIC_SEARCH_END_MS = 9000;
const LEVEL1_CLAP_LYRIC_TARGET_START_MS = 5000;
const LEVEL1_CLAP_LYRIC_GLOBAL_OFFSET_MS = 1060;
const LEVEL1_CLAP_CUE_PRE_ROLL_MS = 260;
const LEVEL1_CLAP_CUE_POST_ROLL_MS = 620;
const LEVEL1_CLAP_WORD_ACTIVE_WINDOW_MS = 210;
const FEEDBACK_POP_LIFETIME_MS = 820;

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
let yuckActiveUntil = 0;
let yuckResetTimerId = null;
let fishSpriteSrc = FISH_IMAGE_SRC;
let fishWidthRatioToFrame = 0.12;
let pufferfishSpriteSrc = PUFFERFISH_IMAGE_SRC;
let pufferfishWidthRatioToFrame = 0.12;
let eatenFishCount = 0;
let missedFishCount = 0;
let level1ThrownCount = 0;
let isGameStarted = false;
let isGamePaused = false;
let trackingReadyAtMs = 0;
let currentLevel = null;
let currentSpawnIntervalMs = LEVEL_CONFIGS[1].spawnIntervalMs;
let currentFlightMinMs = LEVEL_CONFIGS[1].flightMinMs;
let currentFlightMaxMs = LEVEL_CONFIGS[1].flightMaxMs;
let currentCatchRadiusScale = LEVEL_CONFIGS[1].catchRadiusScale;
let activeClosedSprite = catClosed;
let activeOpenSprite = catOpen;
let level1SongAudio = null;
let level2SongAudio = null;
let nomSoundPool = [];
let nextNomSoundIndex = 0;
let nomAudioContext = null;
let nomAudioBuffer = null;
let nomBassFilterNode = null;
let nomOutputGainNode = null;
let nomSoundLoadPromise = null;
let woofSoundPool = [];
let nextWoofSoundIndex = 0;
let lastWoofAt = 0;
let isNomSoundMuted = false;
let lastFeedbackStingerAt = 0;
let level1ClapCueTimesMs = [];
let level1DerivedClapLyricCueMs = null;
let isLevel1CueAnalysisDone = false;
let isLevel1CueAnalysisPending = false;
let level1EstimatedBeatMs = 60000 / LEVEL1_FALLBACK_BPM;
let level1EstimatedOffsetMs = LEVEL1_FALLBACK_OFFSET_MS;
let lastScheduledLevel1BeatSongMs = -Infinity;
let lastClosedMouthDownbeatIndex = null;
let catClosedKeyingFrameId = null;
let catClosedKeyColor = null;
let catClosedKeyContext = null;
let isLevel1Ending = false;
let level1FadeIntervalId = null;
let isLevel2Ending = false;
let level2FadeIntervalId = null;
let countdownFrameId = null;
let countdownLastStep = -1;
let sceneEffectsFrameId = null;
let level1ClapCueWordEls = [];
let isAudioMuted = false;

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

const clearLevel2EndFlow = () => {
	isLevel2Ending = false;

	if (level2FadeIntervalId) {
		window.clearInterval(level2FadeIntervalId);
		level2FadeIntervalId = null;
	}

	if (level2SongAudio) {
		level2SongAudio.volume = LEVEL2_BASE_VOLUME;
	}
};

const finishLevel2Round = () => {
	if (currentLevel !== 2) {
		return;
	}

	if (level2SongAudio) {
		level2SongAudio.pause();
	}

	isGameStarted = false;
	setStatus("Song finished");
	showGameOverScreen();
};

const startLevel2SongFadeOut = () => {
	if (!level2SongAudio || isLevel2Ending || currentLevel !== 2 || !isGameStarted) {
		return;
	}

	isLevel2Ending = true;
	setStatus("Song ending...");

	const initialVolume = level2SongAudio.volume;
	const totalSteps = Math.max(1, Math.round(LEVEL2_FADE_OUT_MS / LEVEL2_FADE_STEP_MS));
	let currentStep = 0;

	level2FadeIntervalId = window.setInterval(() => {
		currentStep += 1;
		const ratio = Math.max(0, 1 - currentStep / totalSteps);
		level2SongAudio.volume = initialVolume * ratio;

		if (currentStep < totalSteps) {
			return;
		}

		window.clearInterval(level2FadeIntervalId);
		level2FadeIntervalId = null;
		finishLevel2Round();
		clearLevel2EndFlow();
	}, LEVEL2_FADE_STEP_MS);
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

const deriveLevel1ClapLyricCueMs = (speechCueMs, fallbackCueMs) => {
	const pool = Array.isArray(speechCueMs) && speechCueMs.length >= LEVEL1_CLAP_CUE_WORDS.length
		? speechCueMs
		: fallbackCueMs;

	if (!Array.isArray(pool) || pool.length === 0) {
		return null;
	}

	const requiredCount = LEVEL1_CLAP_CUE_WORDS.length;
	const minGapMs = 120;
	const maxGapMs = 700;
	const inWindow = pool.filter((cueMs) => cueMs >= LEVEL1_CLAP_LYRIC_SEARCH_START_MS && cueMs <= LEVEL1_CLAP_LYRIC_SEARCH_END_MS);
	const source = inWindow.length >= requiredCount ? inWindow : pool;
	let bestSequence = null;
	let bestScore = Infinity;

	for (let i = 0; i <= source.length - requiredCount; i += 1) {
		const sequence = source.slice(i, i + requiredCount);
		let valid = true;
		let gapMean = 0;

		for (let j = 1; j < sequence.length; j += 1) {
			const gapMs = sequence[j] - sequence[j - 1];
			if (gapMs < minGapMs || gapMs > maxGapMs) {
				valid = false;
				break;
			}
			gapMean += gapMs;
		}

		if (!valid) {
			continue;
		}

		gapMean /= Math.max(1, sequence.length - 1);
		let gapVariance = 0;
		for (let j = 1; j < sequence.length; j += 1) {
			const gapMs = sequence[j] - sequence[j - 1];
			const diff = gapMs - gapMean;
			gapVariance += diff * diff;
		}

		const phraseStartPreference = Math.abs(sequence[0] - LEVEL1_CLAP_LYRIC_TARGET_START_MS);
		const score = gapVariance + phraseStartPreference * 0.9;
		if (score < bestScore) {
			bestScore = score;
			bestSequence = sequence;
		}
	}

	if (bestSequence) {
		return bestSequence;
	}

	const firstContiguous = source.slice(0, requiredCount);
	if (firstContiguous.length === requiredCount) {
		return firstContiguous;
	}

	return null;
};

const getActiveLevel1ClapLyricCueMs = () => {
	if (Array.isArray(level1DerivedClapLyricCueMs) && level1DerivedClapLyricCueMs.length === LEVEL1_CLAP_CUE_WORDS.length) {
		return level1DerivedClapLyricCueMs.map((cueMs) => cueMs + LEVEL1_CLAP_LYRIC_GLOBAL_OFFSET_MS);
	}

	return LEVEL1_CLAP_CUE_FALLBACK_TRIGGERS_MS.map((cueMs) => cueMs + LEVEL1_CLAP_LYRIC_GLOBAL_OFFSET_MS);
};

const ensureLevel1Song = () => {
	if (level1SongAudio) {
		return level1SongAudio;
	}

	level1SongAudio = new Audio(LEVEL1_SONG_SRC);
	level1SongAudio.loop = false;
	level1SongAudio.preload = "auto";
	level1SongAudio.volume = LEVEL1_BASE_VOLUME;
	level1SongAudio.muted = isAudioMuted;
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

const ensureLevel2Song = () => {
	if (level2SongAudio) {
		return level2SongAudio;
	}

	level2SongAudio = new Audio(LEVEL2_SONG_SRC);
	level2SongAudio.loop = false;
	level2SongAudio.preload = "auto";
	level2SongAudio.volume = LEVEL2_BASE_VOLUME;
	level2SongAudio.muted = isAudioMuted;
	level2SongAudio.addEventListener("timeupdate", () => {
		if (!level2SongAudio || !Number.isFinite(level2SongAudio.duration) || currentLevel !== 2 || !isGameStarted) {
			return;
		}

		const remainingMs = (level2SongAudio.duration - level2SongAudio.currentTime) * 1000;
		if (remainingMs <= LEVEL2_END_LEAD_MS) {
			startLevel2SongFadeOut();
		}
	});
	level2SongAudio.addEventListener("ended", () => {
		if (currentLevel !== 2) {
			return;
		}

		if (!isLevel2Ending && isGameStarted) {
			startLevel2SongFadeOut();
		}
	});
	return level2SongAudio;
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

const ensureWoofSoundPool = () => {
	if (woofSoundPool.length > 0) {
		return woofSoundPool;
	}

	woofSoundPool = Array.from({ length: WOOF_SOUND_POOL_SIZE }, () => {
		const audio = new Audio(WOOF_SOUND_SRC);
		audio.preload = "auto";
		audio.volume = WOOF_SOUND_VOLUME;
		audio.muted = isAudioMuted;
		return audio;
	});

	return woofSoundPool;
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

const playWoofSound = () => {
	if (currentLevel !== 2 || !isGameStarted || isGamePaused) {
		return;
	}

	const now = performance.now();
	if (now - lastWoofAt < WOOF_SOUND_COOLDOWN_MS) {
		return;
	}
	lastWoofAt = now;

	const pool = ensureWoofSoundPool();
	if (pool.length === 0) {
		return;
	}

	const audio = pool[nextWoofSoundIndex % pool.length];
	nextWoofSoundIndex = (nextWoofSoundIndex + 1) % pool.length;
	audio.playbackRate = 1;
	audio.volume = WOOF_SOUND_VOLUME;
	audio.currentTime = 0;
	audio.play().catch(() => {
		// Ignore autoplay/momentary playback errors and continue gameplay.
	});
};

const playFeedbackStinger = (tone) => {
	const context = ensureNomAudioContext();
	if (!context || !nomOutputGainNode) {
		return;
	}

	const nowMs = performance.now();
	if (nowMs - lastFeedbackStingerAt < FEEDBACK_STINGER_MIN_GAP_MS) {
		return;
	}
	lastFeedbackStingerAt = nowMs;

	if (context.state === "suspended") {
		context.resume().catch(() => {
			// If resume is blocked, skip this stinger.
		});
	}

	const startAt = context.currentTime + 0.006;

	const scheduleTone = (frequencyHz, offsetSec, durationSec, options = {}) => {
		const oscillator = context.createOscillator();
		const gainNode = context.createGain();
		const type = options.type || "triangle";
		const peakGain = Number.isFinite(options.peakGain) ? options.peakGain : FEEDBACK_STINGER_GAIN;

		oscillator.type = type;
		oscillator.frequency.setValueAtTime(frequencyHz, startAt + offsetSec);
		if (Number.isFinite(options.endFrequencyHz)) {
			oscillator.frequency.exponentialRampToValueAtTime(
				Math.max(20, options.endFrequencyHz),
				startAt + offsetSec + durationSec
			);
		}

		gainNode.gain.setValueAtTime(0.0001, startAt + offsetSec);
		gainNode.gain.linearRampToValueAtTime(peakGain, startAt + offsetSec + Math.min(0.016, durationSec * 0.3));
		gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + offsetSec + durationSec);

		oscillator.connect(gainNode);
		gainNode.connect(nomOutputGainNode);
		oscillator.start(startAt + offsetSec);
		oscillator.stop(startAt + offsetSec + durationSec + 0.02);
	};

	const scheduleClickNoise = (offsetSec, durationSec, options = {}) => {
		const sampleCount = Math.max(32, Math.round(context.sampleRate * durationSec));
		const noiseBuffer = context.createBuffer(1, sampleCount, context.sampleRate);
		const data = noiseBuffer.getChannelData(0);
		for (let i = 0; i < sampleCount; i += 1) {
			data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
		}

		const source = context.createBufferSource();
		const filter = context.createBiquadFilter();
		const gainNode = context.createGain();
		source.buffer = noiseBuffer;
		filter.type = options.filterType || "highpass";
		filter.frequency.setValueAtTime(options.filterHz || 1800, startAt + offsetSec);

		const peakGain = Number.isFinite(options.peakGain) ? options.peakGain : 0.08;
		gainNode.gain.setValueAtTime(0.0001, startAt + offsetSec);
		gainNode.gain.linearRampToValueAtTime(peakGain, startAt + offsetSec + Math.min(0.008, durationSec * 0.25));
		gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + offsetSec + durationSec);

		source.connect(filter);
		filter.connect(gainNode);
		gainNode.connect(nomOutputGainNode);
		source.start(startAt + offsetSec);
		source.stop(startAt + offsetSec + durationSec + 0.01);
	};

	const schedulePercHit = (frequencyHz, offsetSec, options = {}) => {
		scheduleTone(frequencyHz, offsetSec, options.durationSec || 0.052, {
			type: options.type || "square",
			peakGain: options.toneGain || 0.1,
			endFrequencyHz: options.endFrequencyHz
		});
		scheduleClickNoise(offsetSec, options.noiseDurationSec || 0.024, {
			filterType: options.noiseFilterType || "highpass",
			filterHz: options.noiseFilterHz || 2000,
			peakGain: options.noiseGain || 0.07
		});
	};

	if (tone === "positive") {
		schedulePercHit(960, 0, {
			durationSec: 0.048,
			type: "square",
			toneGain: 0.1,
			endFrequencyHz: 1020,
			noiseDurationSec: 0.018,
			noiseFilterHz: 2200,
			noiseGain: 0.06
		});
		schedulePercHit(1280, 0.07, {
			durationSec: 0.052,
			type: "square",
			toneGain: 0.11,
			endFrequencyHz: 1360,
			noiseDurationSec: 0.02,
			noiseFilterHz: 2400,
			noiseGain: 0.065
		});
		schedulePercHit(1620, 0.145, {
			durationSec: 0.058,
			type: "triangle",
			toneGain: 0.11,
			endFrequencyHz: 1700,
			noiseDurationSec: 0.022,
			noiseFilterHz: 2600,
			noiseGain: 0.06
		});
		return;
	}

	schedulePercHit(340, 0, {
		durationSec: 0.072,
		type: "square",
		toneGain: 0.1,
		endFrequencyHz: 270,
		noiseDurationSec: 0.026,
		noiseFilterType: "bandpass",
		noiseFilterHz: 900,
		noiseGain: 0.068
	});
	schedulePercHit(250, 0.082, {
		durationSec: 0.084,
		type: "square",
		toneGain: 0.095,
		endFrequencyHz: 190,
		noiseDurationSec: 0.03,
		noiseFilterType: "bandpass",
		noiseFilterHz: 780,
		noiseGain: 0.07
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

		const zcr = new Float32Array(frameCount);
		let zcrSum = 0;
		let zcrSqSum = 0;
		for (let frame = 0; frame < frameCount; frame += 1) {
			const offset = frame * hopSize;
			let crossings = 0;
			let previous = mono[offset];
			for (let i = 1; i < frameSize; i += 1) {
				const sample = mono[offset + i];
				if ((previous >= 0 && sample < 0) || (previous < 0 && sample >= 0)) {
					crossings += 1;
				}
				previous = sample;
			}
			const frameZcr = crossings / frameSize;
			zcr[frame] = frameZcr;
			zcrSum += frameZcr;
			zcrSqSum += frameZcr * frameZcr;
		}

		const energyMean = energy.reduce((sum, value) => sum + value, 0) / Math.max(1, frameCount);
		const energyVariance = energy.reduce((sum, value) => {
			const delta = value - energyMean;
			return sum + delta * delta;
		}, 0) / Math.max(1, frameCount);
		const energyStdDev = Math.sqrt(Math.max(0, energyVariance));

		const zcrMean = zcrSum / Math.max(1, frameCount);
		const zcrVariance = Math.max(0, zcrSqSum / Math.max(1, frameCount) - zcrMean * zcrMean);
		const zcrStdDev = Math.sqrt(zcrVariance);

		const speechScore = new Float32Array(frameCount);
		let speechSum = 0;
		let speechSqSum = 0;
		for (let frame = 0; frame < frameCount; frame += 1) {
			const zcrBoost = Math.max(0, (zcr[frame] - zcrMean) / Math.max(1e-6, zcrStdDev * 1.2));
			const noKickPenalty = energy[frame] > energyMean + energyStdDev * 1.9 ? 0.25 : 1;
			const score = novelty[frame] * (1 + zcrBoost) * noKickPenalty;
			speechScore[frame] = score;
			speechSum += score;
			speechSqSum += score * score;
		}

		const speechMean = speechSum / Math.max(1, frameCount);
		const speechVariance = Math.max(0, speechSqSum / Math.max(1, frameCount) - speechMean * speechMean);
		const speechStdDev = Math.sqrt(speechVariance);
		const speechThreshold = speechMean + speechStdDev * 1.15;
		const speechGapFrames = Math.max(1, Math.round((sampleRate * 0.12) / hopSize));
		const speechCues = [];
		let lastSpeechPeakFrame = -speechGapFrames;

		for (let frame = 1; frame < frameCount - 1; frame += 1) {
			if (frame - lastSpeechPeakFrame < speechGapFrames) {
				continue;
			}

			const inLyricWindow = frame * hopSize * 1000 / sampleRate >= LEVEL1_CLAP_LYRIC_SEARCH_START_MS
				&& frame * hopSize * 1000 / sampleRate <= LEVEL1_CLAP_LYRIC_SEARCH_END_MS;
			if (!inLyricWindow) {
				continue;
			}

			const isSpeechPeak = speechScore[frame] > speechThreshold
				&& speechScore[frame] >= speechScore[frame - 1]
				&& speechScore[frame] > speechScore[frame + 1];
			if (!isSpeechPeak) {
				continue;
			}

			const cueTimeMs = (frame * hopSize * 1000) / sampleRate;
			speechCues.push(cueTimeMs);
			lastSpeechPeakFrame = frame;
		}

		level1ClapCueTimesMs = cues;
		estimateLevel1BeatGridFromCues(cues);
		level1DerivedClapLyricCueMs = deriveLevel1ClapLyricCueMs(speechCues, cues);
		isLevel1CueAnalysisDone = true;
	} catch (error) {
		console.warn("Level 1 clap-cue analysis failed.", error);
		level1DerivedClapLyricCueMs = null;
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

const getCountdownLabels = () => currentLevel === 2 ? LEVEL2_COUNTDOWN_LABELS : LEVEL1_COUNTDOWN_LABELS;
const getCountdownTriggersMs = () => currentLevel === 2 ? LEVEL2_COUNTDOWN_TRIGGERS_MS : LEVEL1_COUNTDOWN_TRIGGERS_MS;
const getCountdownAudio = () => currentLevel === 2 ? level2SongAudio : level1SongAudio;

const showCountdownStep = (stepIndex) => {
	if (!countdownOverlay) {
		return;
	}

	const labels = getCountdownLabels();
	countdownOverlay.innerHTML = "";
	const isGo = stepIndex === labels.length - 1;
	const el = document.createElement("span");
	el.className = "countdown-label";
	el.textContent = labels[stepIndex];
	el.setAttribute("data-anim", isGo ? "go" : "count");
	countdownOverlay.appendChild(el);
	el.addEventListener("animationend", () => el.remove(), { once: true });
};

const tickCountdown = () => {
	const audio = getCountdownAudio();
	const triggersMs = getCountdownTriggersMs();

	if (!audio || !isGameStarted) {
		countdownFrameId = null;
		return;
	}

	const songMs = audio.currentTime * 1000;
	const lastTriggerMs = triggersMs[triggersMs.length - 1];

	// Advance through any steps whose trigger time has passed
	for (let i = countdownLastStep + 1; i < triggersMs.length; i += 1) {
		if (songMs >= triggersMs[i]) {
			countdownLastStep = i;
			showCountdownStep(i);
		}
	}

	// Stop polling once the last label's animation has had time to finish
	if (countdownLastStep >= triggersMs.length - 1 && songMs > lastTriggerMs + 1200) {
		countdownFrameId = null;
		return;
	}

	countdownFrameId = window.requestAnimationFrame(tickCountdown);
};

const startCountdownDisplay = () => {
	clearCountdownDisplay();

	const audio = getCountdownAudio();
	const triggersMs = getCountdownTriggersMs();

	if (!audio) {
		return;
	}

	// Seed lastStep so we don't replay already-passed beats (e.g. on replay)
	const songMs = audio.currentTime * 1000;
	for (let i = 0; i < triggersMs.length; i += 1) {
		if (songMs >= triggersMs[i]) {
			countdownLastStep = i;
		}
	}

	const lastTriggerMs = triggersMs[triggersMs.length - 1];
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

const playLevel2Song = async () => {
	try {
		const audio = ensureLevel2Song();
		audio.currentTime = 0;
		audio.volume = LEVEL2_BASE_VOLUME;
		await audio.play();
	} catch (error) {
		console.warn("Level 2 song could not start.", error);
	}
};

const stopLevel1Song = () => {
	if (!level1SongAudio) {
		stopSceneEffectsLoop();
		return;
	}

	clearLevel1EndFlow();
	clearCountdownDisplay();
	level1SongAudio.pause();
	level1SongAudio.currentTime = 0;
	stopSceneEffectsLoop();
};

const stopLevel2Song = () => {
	if (!level2SongAudio) {
		return;
	}

	clearLevel2EndFlow();
	clearCountdownDisplay();
	level2SongAudio.pause();
	level2SongAudio.currentTime = 0;
};

const stopLevelSongs = () => {
	stopLevel1Song();
	stopLevel2Song();
};

const applyAudioMuteState = () => {
	if (level1SongAudio) {
		level1SongAudio.muted = isAudioMuted;
	}

	if (level2SongAudio) {
		level2SongAudio.muted = isAudioMuted;
	}

	if (woofSoundPool.length > 0) {
		for (let i = 0; i < woofSoundPool.length; i += 1) {
			woofSoundPool[i].muted = isAudioMuted;
		}
	}

	setNomSoundMuted(isAudioMuted);

	if (!muteButton) {
		return;
	}

	muteButton.textContent = isAudioMuted ? "🔇" : "🔊";
	muteButton.setAttribute("aria-pressed", String(isAudioMuted));
	muteButton.setAttribute("aria-label", isAudioMuted ? "Unmute music" : "Mute music");
};

const LEVEL_METRICS = {
	1: {
		mouthXRatio: 0.715,
		mouthYRatio: 0.62,
		feedbackXRatio: 0.7,
		feedbackYRatio: 0.38,
		catchXRatio: 0.73,
		catchYRatio: 0.64,
		landXRatio: 0.78,
		landYRatio: 0.9
	},
	2: {
		mouthXRatio: 0.5,
		mouthYRatio: 0.62,
		feedbackXRatio: 0.5,
		feedbackYRatio: 0.39,
		catchXRatio: 0.5,
		catchYRatio: 0.64,
		landXRatio: 0.54,
		landYRatio: 0.9
	}
};

const isYuckActive = () => currentLevel === 1 && performance.now() < yuckActiveUntil;

const CAT_CLOSED_KEY_THRESHOLD = 36;
const CAT_CLOSED_KEY_SOFTNESS = 26;

const restartClosedMouthImageAnimation = () => {
	if (!(catClosed instanceof HTMLImageElement)) {
		return;
	}

	const currentSrc = catClosed.getAttribute("src");
	if (!currentSrc) {
		return;
	}

	catClosed.setAttribute("src", "");
	catClosed.setAttribute("src", currentSrc);
};

const stopClosedMouthKeyingLoop = () => {
	if (catClosedKeyingFrameId) {
		window.cancelAnimationFrame(catClosedKeyingFrameId);
		catClosedKeyingFrameId = null;
	}
};

const getClosedMouthKeySample = (pixels, width, height) => {
	const sampleSize = Math.max(4, Math.floor(Math.min(width, height) * 0.04));
	const anchors = [
		{ x: 0, y: 0 },
		{ x: width - sampleSize, y: 0 },
		{ x: 0, y: height - sampleSize },
		{ x: width - sampleSize, y: height - sampleSize }
	];

	let rSum = 0;
	let gSum = 0;
	let bSum = 0;
	let count = 0;

	for (let a = 0; a < anchors.length; a += 1) {
		const anchor = anchors[a];
		for (let y = 0; y < sampleSize; y += 1) {
			for (let x = 0; x < sampleSize; x += 1) {
				const px = anchor.x + x;
				const py = anchor.y + y;
				const index = (py * width + px) * 4;
				const alpha = pixels[index + 3];
				if (alpha < 12) {
					continue;
				}
				rSum += pixels[index];
				gSum += pixels[index + 1];
				bSum += pixels[index + 2];
				count += 1;
			}
		}
	}

	if (count === 0) {
		return null;
	}

	return {
		r: rSum / count,
		g: gSum / count,
		b: bSum / count
	};
};

const ensureClosedMouthKeyContext = () => {
	if (!(catClosed instanceof HTMLVideoElement) || !(catClosedKeyed instanceof HTMLCanvasElement)) {
		return null;
	}

	const videoWidthPx = catClosed.videoWidth || 0;
	const videoHeightPx = catClosed.videoHeight || 0;
	if (videoWidthPx <= 0 || videoHeightPx <= 0) {
		return null;
	}

	if (catClosedKeyed.width !== videoWidthPx || catClosedKeyed.height !== videoHeightPx) {
		catClosedKeyed.width = videoWidthPx;
		catClosedKeyed.height = videoHeightPx;
		catClosedKeyColor = null;
	}

	if (!catClosedKeyContext) {
		catClosedKeyContext = catClosedKeyed.getContext("2d", { willReadFrequently: true });
	}

	return catClosedKeyContext;
};

const renderClosedMouthKeyedFrame = () => {
	const context = ensureClosedMouthKeyContext();
	if (!context || !(catClosed instanceof HTMLVideoElement) || !(catClosedKeyed instanceof HTMLCanvasElement)) {
		return;
	}

	context.drawImage(catClosed, 0, 0, catClosedKeyed.width, catClosedKeyed.height);
	const imageData = context.getImageData(0, 0, catClosedKeyed.width, catClosedKeyed.height);
	const pixels = imageData.data;

	const sampledColor = getClosedMouthKeySample(pixels, catClosedKeyed.width, catClosedKeyed.height);
	if (sampledColor) {
		if (!catClosedKeyColor) {
			catClosedKeyColor = sampledColor;
		} else {
			const smoothing = 0.08;
			catClosedKeyColor.r = catClosedKeyColor.r * (1 - smoothing) + sampledColor.r * smoothing;
			catClosedKeyColor.g = catClosedKeyColor.g * (1 - smoothing) + sampledColor.g * smoothing;
			catClosedKeyColor.b = catClosedKeyColor.b * (1 - smoothing) + sampledColor.b * smoothing;
		}
	}

	if (!catClosedKeyColor) {
		return;
	}

	const thresholdSq = CAT_CLOSED_KEY_THRESHOLD * CAT_CLOSED_KEY_THRESHOLD;
	const softnessSq = (CAT_CLOSED_KEY_THRESHOLD + CAT_CLOSED_KEY_SOFTNESS) * (CAT_CLOSED_KEY_THRESHOLD + CAT_CLOSED_KEY_SOFTNESS);
	const fadeRangeSq = Math.max(1, softnessSq - thresholdSq);

	for (let i = 0; i < pixels.length; i += 4) {
		const alpha = pixels[i + 3];
		if (alpha <= 0) {
			continue;
		}

		const dr = pixels[i] - catClosedKeyColor.r;
		const dg = pixels[i + 1] - catClosedKeyColor.g;
		const db = pixels[i + 2] - catClosedKeyColor.b;
		const distanceSq = dr * dr + dg * dg + db * db;

		if (distanceSq <= thresholdSq) {
			pixels[i + 3] = 0;
			continue;
		}

		if (distanceSq < softnessSq) {
			const keepRatio = (distanceSq - thresholdSq) / fadeRangeSq;
			pixels[i + 3] = Math.round(alpha * keepRatio);
		}
	}

	context.putImageData(imageData, 0, 0);
};

const startClosedMouthKeyingLoop = () => {
	if (catClosedKeyingFrameId || !(catClosed instanceof HTMLVideoElement)) {
		return;
	}

	const tick = () => {
		catClosedKeyingFrameId = null;

		if (!catClosed.paused && !catClosed.ended) {
			renderClosedMouthKeyedFrame();
		}

		catClosedKeyingFrameId = window.requestAnimationFrame(tick);
	};

	tick();
};

const hideYuckSprite = () => {
	if (catYuck) {
		catYuck.classList.add("is-hidden");
	}
};

const resetClosedMouthAnimation = () => {
	if (catClosed instanceof HTMLImageElement) {
		return;
	}

	if (!(catClosed instanceof HTMLVideoElement)) {
		return;
	}

	catClosed.pause();
	stopClosedMouthKeyingLoop();
	try {
		catClosed.currentTime = 0;
	} catch {
		// Ignore seek errors before metadata is available.
	}

	if (catClosedKeyContext && catClosedKeyed instanceof HTMLCanvasElement) {
		catClosedKeyContext.clearRect(0, 0, catClosedKeyed.width, catClosedKeyed.height);
	}
};

const playClosedMouthAnimation = () => {
	if (catClosed instanceof HTMLImageElement) {
		return;
	}

	if (!(catClosed instanceof HTMLVideoElement)) {
		return;
	}

	const playPromise = catClosed.play();
	startClosedMouthKeyingLoop();
	if (playPromise && typeof playPromise.catch === "function") {
		playPromise.catch(() => {
			// Muted autoplay may still reject in some browsers.
		});
	}
};

const showYuck = () => {
	if (!catYuck) {
		return;
	}

	resetClosedMouthAnimation();

	if (activeClosedSprite) {
		activeClosedSprite.classList.add("is-hidden");
	}

	if (activeOpenSprite) {
		activeOpenSprite.classList.add("is-hidden");
	}

	catYuck.classList.remove("is-hidden");
	isMouthOpen = false;
};

const showClosed = () => {
	if (isYuckActive()) {
		showYuck();
		return;
	}

	hideYuckSprite();

	if (activeClosedSprite) {
		activeClosedSprite.classList.remove("is-hidden");
	}

	if (activeOpenSprite) {
		activeOpenSprite.classList.add("is-hidden");
	}

	if ((activeClosedSprite === catClosedKeyed || activeClosedSprite === catClosed) && currentLevel === 1) {
		playClosedMouthAnimation();
	}

	isMouthOpen = false;
};

const showOpen = () => {
	const wasOpen = isMouthOpen;

	if (isYuckActive()) {
		showYuck();
		return;
	}

	hideYuckSprite();

	if (activeClosedSprite) {
		activeClosedSprite.classList.add("is-hidden");
	}

	if (activeOpenSprite) {
		activeOpenSprite.classList.remove("is-hidden");
	}

	if ((activeClosedSprite === catClosedKeyed || activeClosedSprite === catClosed) && currentLevel === 1) {
		resetClosedMouthAnimation();
	}

	isMouthOpen = true;

	if (!wasOpen && currentLevel === 2 && activeOpenSprite === dogOpen) {
		playWoofSound();
	}
};


const setStatus = () => {
	if (trackerStatus) {
		trackerStatus.textContent = "Bring hands together";
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
	fishCounter.innerHTML = `${levelText}Eaten: <span class="fish-counter-value">${eatenFishCount}</span> | Missed: <span class="fish-counter-value">${missedFishCount}</span>`;
};

const updatePauseButtonUI = () => {
	if (!pauseButton) {
		return;
	}

	pauseButton.setAttribute("aria-pressed", String(isGamePaused));
	pauseButton.setAttribute("aria-label", isGamePaused ? "Resume level" : "Pause level");
	pauseButton.classList.toggle("is-paused", isGamePaused);
};

const showGameplayControls = () => {
	if (!gameControls) {
		return;
	}

	gameControls.classList.remove("is-hidden");
	gameControls.setAttribute("aria-hidden", "false");
	updatePauseButtonUI();
};

const hideGameplayControls = () => {
	if (!gameControls) {
		return;
	}

	gameControls.classList.add("is-hidden");
	gameControls.setAttribute("aria-hidden", "true");
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
		activeClosedSprite = catClosedKeyed || catClosed;
		activeOpenSprite = catOpen;
	}

	if (catClosed) {
		catClosed.classList.add("is-hidden");
	}

	if (catClosedKeyed) {
		catClosedKeyed.classList.add("is-hidden");
	}

	if (catOpen) {
		catOpen.classList.add("is-hidden");
	}

	if (catYuck) {
		catYuck.classList.add("is-hidden");
	}

	if (dogClosed) {
		dogClosed.classList.add("is-hidden");
	}

	if (dogOpen) {
		dogOpen.classList.add("is-hidden");
	}

	if (levelNumber === 2) {
		resetClosedMouthAnimation();
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
		feedbackX: bounds.width * ratios.feedbackXRatio,
		feedbackY: bounds.height * ratios.feedbackYRatio,
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

const createFishSprite = (spriteSrc) => {
	const fish = document.createElement("img");
	fish.className = "fish-sprite";
	fish.src = spriteSrc;
	fish.alt = "";
	return fish;
};

const getLevel1BeatSpawnType = () => {
	const throwIndex = level1ThrownCount + 1;
	if (throwIndex <= 5) {
		return "fish";
	}

	const throwsAfterIntro = throwIndex - 5;
	const progression = Math.min(1, throwsAfterIntro / 44);
	const pufferChance = lerp(0.12, 0.78, progression);
	return Math.random() < pufferChance ? "pufferfish" : "fish";
};

const ensureClapCueWords = () => {
	if (!clapCueText || clapCueText.childElementCount > 0) {
		return;
	}

	for (let i = 0; i < LEVEL1_CLAP_CUE_WORDS.length; i += 1) {
		const word = document.createElement("span");
		word.className = "clap-cue-word";
		word.textContent = LEVEL1_CLAP_CUE_WORDS[i];
		clapCueText.appendChild(word);
		level1ClapCueWordEls.push(word);
	}
};

const resetClapCueOverlay = () => {
	if (clapCueOverlay) {
		clapCueOverlay.classList.remove("is-visible");
		clapCueOverlay.setAttribute("aria-hidden", "true");
	}

	for (let i = 0; i < level1ClapCueWordEls.length; i += 1) {
		level1ClapCueWordEls[i].classList.remove("is-active", "is-complete");
	}
};

const spawnEventFeedback = (text, tone) => {
	if (!eventFeedbackLayer || !scene) {
		return;
	}

	const metrics = getSceneMetrics();
	const toneClass = tone === "positive"
		? "is-positive"
		: tone === "toxic"
			? "is-toxic"
			: "is-negative";
	const pop = document.createElement("p");
	pop.className = `event-feedback ${toneClass}`;
	pop.textContent = text;
	pop.style.left = `${metrics.feedbackX}px`;
	pop.style.top = `${metrics.feedbackY}px`;
	pop.setAttribute("aria-hidden", "true");
	pop.addEventListener("animationend", () => pop.remove(), { once: true });
	window.setTimeout(() => pop.remove(), FEEDBACK_POP_LIFETIME_MS + 80);
	eventFeedbackLayer.appendChild(pop);
	playFeedbackStinger(tone === "toxic" ? "negative" : tone);
};

const spawnYuckImageFeedback = () => {
	if (Number(currentLevel) !== 1 || !catYuck) {
		return;
	}

	yuckActiveUntil = performance.now() + YUCK_DISPLAY_MS;

	if (yuckResetTimerId) {
		window.clearTimeout(yuckResetTimerId);
	}

	showYuck();
	yuckResetTimerId = window.setTimeout(() => {
		yuckActiveUntil = 0;
		yuckResetTimerId = null;
		showClosed();
	}, YUCK_DISPLAY_MS);
};

const spawnPufferfishCaughtEffects = () => {
	spawnToxicDripEffect();
	spawnYuckImageFeedback();
	spawnEventFeedback("Yuck!", "toxic");
};


const getCatchFeedback = (fishType) => {
	if (fishType === "pufferfish") {
		return { text: "Yuck!", tone: "toxic" };
	}

	return { text: "Nice!", tone: "positive" };
};

const getMissFeedback = (fishType) => {
	if (fishType === "pufferfish") {
		return { text: "Nice!", tone: "positive" };
	}

	return { text: "Miss!", tone: "negative" };
};

const spawnToxicDripEffect = () => {
	if (!scene) {
		return;
	}

	const existingOverlay = scene.querySelector(".toxic-drip-overlay");
	if (existingOverlay) {
		existingOverlay.remove();
	}

	const overlay = document.createElement("div");
	overlay.className = "toxic-drip-overlay toxic-drip-video-overlay";
	overlay.setAttribute("aria-hidden", "true");

	let isDisposed = false;
	const cleanup = () => {
		if (isDisposed) {
			return;
		}
		isDisposed = true;
		overlay.remove();
	};

	scene.appendChild(overlay);
	window.setTimeout(cleanup, TOXIC_DRIP_OVERLAY_MAX_MS);
};

const updateClapCueOverlay = (songMs) => {
	if (!clapCueOverlay || level1ClapCueWordEls.length === 0) {
		return;
	}

	const cueTriggersMs = getActiveLevel1ClapLyricCueMs();
	const cueCount = Math.min(level1ClapCueWordEls.length, cueTriggersMs.length);
	if (cueCount === 0) {
		resetClapCueOverlay();
		return;
	}

	const firstCueMs = cueTriggersMs[0];
	const lastCueMs = cueTriggersMs[cueCount - 1];
	const visibleStartMs = firstCueMs - LEVEL1_CLAP_CUE_PRE_ROLL_MS;
	const visibleEndMs = lastCueMs + LEVEL1_CLAP_CUE_POST_ROLL_MS;

	if (!Number.isFinite(songMs) || songMs < visibleStartMs || songMs > visibleEndMs) {
		resetClapCueOverlay();
		return;
	}

	clapCueOverlay.classList.add("is-visible");
	clapCueOverlay.setAttribute("aria-hidden", "false");

	let activeCueIndex = -1;
	let nearestCueDeltaMs = Infinity;
	for (let i = 0; i < cueCount; i += 1) {
		const cueDeltaMs = songMs - cueTriggersMs[i];
		const absCueDeltaMs = Math.abs(cueDeltaMs);

		level1ClapCueWordEls[i].classList.toggle("is-complete", cueDeltaMs > LEVEL1_CLAP_WORD_ACTIVE_WINDOW_MS * 0.45);

		if (absCueDeltaMs <= LEVEL1_CLAP_WORD_ACTIVE_WINDOW_MS && absCueDeltaMs < nearestCueDeltaMs) {
			nearestCueDeltaMs = absCueDeltaMs;
			activeCueIndex = i;
		}
	}

	for (let i = 0; i < level1ClapCueWordEls.length; i += 1) {
		level1ClapCueWordEls[i].classList.toggle("is-active", i === activeCueIndex);
		if (i >= cueCount) {
			level1ClapCueWordEls[i].classList.remove("is-complete");
		}
	}
};

const syncClosedMouthAnimationToDownbeat = (targetDownbeatSongMs = null) => {
	if (catClosed instanceof HTMLImageElement) {
		restartClosedMouthImageAnimation();
		return;
	}

	if (!(catClosed instanceof HTMLVideoElement)) {
		return;
	}

	if (
		currentLevel !== 1
		|| !isGameStarted
		|| isGamePaused
		|| isMouthOpen
		|| isYuckActive()
		|| (activeClosedSprite && activeClosedSprite.classList.contains("is-hidden"))
	) {
		return;
	}

	const beatMs = level1EstimatedBeatMs || 60000 / LEVEL1_FALLBACK_BPM;
	const downbeatSpanMs = beatMs * Math.max(1, LEVEL1_DOWNBEAT_SPAN_BEATS);
	const durationSec = Number.isFinite(catClosed.duration) && catClosed.duration > 0 ? catClosed.duration : null;

	if (durationSec && Number.isFinite(downbeatSpanMs) && downbeatSpanMs > 0) {
		// Slow the loop so one cycle maps to each downbeat span.
		const desiredRate = (durationSec * 1000) / downbeatSpanMs;
		catClosed.playbackRate = Math.max(0.25, Math.min(1.25, desiredRate));
	}

	if (
		durationSec
		&& level1SongAudio
		&& Number.isFinite(targetDownbeatSongMs)
		&& Number.isFinite(level1SongAudio.currentTime)
	) {
		const nowSongMs = level1SongAudio.currentTime * 1000;
		const msUntilDownbeat = targetDownbeatSongMs - nowSongMs;
		const durationMs = durationSec * 1000;
		const headDownMs = durationMs * CAT_CLOSED_HEAD_DOWN_AT_RATIO;
		const currentRate = catClosed.playbackRate || 1;
		const phaseMs = ((headDownMs - msUntilDownbeat * currentRate) % durationMs + durationMs) % durationMs;

		try {
			catClosed.currentTime = phaseMs / 1000;
		} catch {
			// Ignore seek errors before metadata is available.
		}
	} else {
		try {
			catClosed.currentTime = 0;
		} catch {
			// Ignore seek errors before metadata is available.
		}
	}

	playClosedMouthAnimation();
};

const syncClosedMouthAnimationToSongDownbeat = (songMs) => {
	if (!Number.isFinite(songMs) || currentLevel !== 1) {
		return;
	}

	const beatMs = level1EstimatedBeatMs || 60000 / LEVEL1_FALLBACK_BPM;
	if (!Number.isFinite(beatMs) || beatMs <= 0) {
		return;
	}

	const downbeatSpanMs = beatMs * Math.max(1, LEVEL1_DOWNBEAT_SPAN_BEATS);
	if (!Number.isFinite(downbeatSpanMs) || downbeatSpanMs <= 0) {
		return;
	}

	const downbeatIndex = Math.floor((songMs - level1EstimatedOffsetMs) / downbeatSpanMs);
	if (!Number.isFinite(downbeatIndex)) {
		return;
	}

	if (lastClosedMouthDownbeatIndex === null) {
		lastClosedMouthDownbeatIndex = downbeatIndex;
		const downbeatSongMs = downbeatIndex * downbeatSpanMs + level1EstimatedOffsetMs;
		syncClosedMouthAnimationToDownbeat(downbeatSongMs);
		return;
	}

	if (downbeatIndex === lastClosedMouthDownbeatIndex) {
		return;
	}

	lastClosedMouthDownbeatIndex = downbeatIndex;
	const downbeatSongMs = downbeatIndex * downbeatSpanMs + level1EstimatedOffsetMs;
	syncClosedMouthAnimationToDownbeat(downbeatSongMs);
};

const animateSceneEffects = () => {
	if (!isGameStarted) {
		sceneEffectsFrameId = null;
		resetClapCueOverlay();
		return;
	}

	const songMs = currentLevel === 1 && level1SongAudio ? level1SongAudio.currentTime * 1000 : NaN;
	updateClapCueOverlay(songMs);
	syncClosedMouthAnimationToSongDownbeat(songMs);
	sceneEffectsFrameId = window.requestAnimationFrame(animateSceneEffects);
};

const startSceneEffectsLoop = () => {
	if (sceneEffectsFrameId) {
		return;
	}

	sceneEffectsFrameId = window.requestAnimationFrame(animateSceneEffects);
};

const stopSceneEffectsLoop = () => {
	if (sceneEffectsFrameId) {
		window.cancelAnimationFrame(sceneEffectsFrameId);
		sceneEffectsFrameId = null;
	}

	resetClapCueOverlay();
};

const prepareSpriteAsset = async (imageSrc) => {
	const fallbackWidthRatio = 0.12;

	try {
		const image = new Image();
		image.src = imageSrc;
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
			return {
				spriteSrc: imageSrc,
				widthRatio: fallbackWidthRatio
			};
		}

		const cropWidth = maxX - minX + 1;
		const cropHeight = maxY - minY + 1;
		const croppedCanvas = document.createElement("canvas");
		croppedCanvas.width = cropWidth;
		croppedCanvas.height = cropHeight;
		const croppedContext = croppedCanvas.getContext("2d");
		croppedContext.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

		return {
			spriteSrc: croppedCanvas.toDataURL("image/png"),
			widthRatio: Math.max(0.03, Math.min(0.25, cropWidth / FIGMA_FRAME_WIDTH))
		};
	} catch (error) {
		console.warn(`Failed to prepare cropped sprite for ${imageSrc}, using fallback.`, error);
		return {
			spriteSrc: imageSrc,
			widthRatio: fallbackWidthRatio
		};
	}
};

const prepareFishSprites = async () => {
	const [fishAsset, pufferAsset] = await Promise.all([
		prepareSpriteAsset(FISH_IMAGE_SRC),
		prepareSpriteAsset(PUFFERFISH_IMAGE_SRC)
	]);

	fishSpriteSrc = fishAsset.spriteSrc;
	fishWidthRatioToFrame = fishAsset.widthRatio;
	pufferfishSpriteSrc = pufferAsset.spriteSrc;
	pufferfishWidthRatioToFrame = pufferAsset.widthRatio;
};

const spawnFish = (options = {}) => {
	if (!fishFlightLayer || !scene) {
		return;
	}

	const metrics = getSceneMetrics();
	const fishType = options.fishType === "pufferfish" ? "pufferfish" : "fish";
	const spriteSrc = fishType === "pufferfish" ? pufferfishSpriteSrc : fishSpriteSrc;
	const widthRatio = fishType === "pufferfish" ? pufferfishWidthRatioToFrame : fishWidthRatioToFrame;
	const sprite = createFishSprite(spriteSrc);
	const isLevel1 = currentLevel === 1;
	const fishWidth = Math.max(34, metrics.width * widthRatio);
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
		type: fishType,
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
					const catchFeedback = getCatchFeedback(fish.type);
					if (fish.type !== "pufferfish") {
						eatenFishCount += 1;
					} else {
						removeFish(fish, i);
						spawnPufferfishCaughtEffects();
					}
					if (fish.type !== "pufferfish") {
						spawnEventFeedback(catchFeedback.text, catchFeedback.tone);
					}
					updateFishCounter();
					isMouthLockedClosed = true;
					clapOpenUntil = 0;
					showClosed();
					if (fish.type !== "pufferfish") {
						removeFish(fish, i);
					}
				} else {
					const missFeedback = getMissFeedback(fish.type);
					if (fish.type !== "pufferfish") {
						missedFishCount += 1;
					}
					spawnEventFeedback(missFeedback.text, missFeedback.tone);
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
					const catchFeedback = getCatchFeedback(fish.type);
					if (fish.type !== "pufferfish") {
						eatenFishCount += 1;
					} else {
						removeFish(fish, i);
						spawnPufferfishCaughtEffects();
					}
					if (fish.type !== "pufferfish") {
						spawnEventFeedback(catchFeedback.text, catchFeedback.tone);
					}
					updateFishCounter();
					isMouthLockedClosed = true;
					clapOpenUntil = 0;
					showClosed();
					if (fish.type !== "pufferfish") {
						removeFish(fish, i);
					}
				} else {
					const missFeedback = getMissFeedback(fish.type);
					if (fish.type !== "pufferfish") {
						missedFishCount += 1;
					}
					spawnEventFeedback(missFeedback.text, missFeedback.tone);
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
	lastClosedMouthDownbeatIndex = null;
};

const pauseFishStream = () => {
	stopFishSpawnTimers();

	if (fishAnimationFrameId) {
		window.cancelAnimationFrame(fishAnimationFrameId);
		fishAnimationFrameId = null;
	}
};

const resumeFishStream = () => {
	if (!isGameStarted || isGamePaused) {
		return;
	}

	if (currentLevel === 1) {
		scheduleLevel1BeatSpawn();
	}

	if (!fishAnimationFrameId) {
		fishAnimationFrameId = window.requestAnimationFrame(animateFish);
	}
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
		const fishType = getLevel1BeatSpawnType();
		spawnFish({ targetArrivalSongMs: beatSongMs, fishType });
		level1ThrownCount += 1;
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

	resumeFishStream();
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

	if (gameOverScore) {
		gameOverScore.textContent = `${eatenFishCount} FISH`;
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
	pauseFishStream();

	clearAllFish();
};

const pauseCurrentLevel = () => {
	if (!isGameStarted || isGamePaused) {
		return;
	}

	isGamePaused = true;
	isMouthLockedClosed = true;
	clapOpenUntil = 0;
	showClosed();
	resetClosedMouthAnimation();
	pauseFishStream();
	clearCountdownDisplay();
	stopSceneEffectsLoop();

	if (level1SongAudio && currentLevel === 1) {
		level1SongAudio.pause();
	}

	if (level2SongAudio && currentLevel === 2) {
		level2SongAudio.pause();
	}

	setStatus("Paused");
	setDebug(["game: paused", `level: ${currentLevel || "-"}`]);
	updatePauseButtonUI();
};

const resumeCurrentLevel = () => {
	if (!isGameStarted || !isGamePaused) {
		return;
	}

	isGamePaused = false;
	isMouthLockedClosed = false;
	wasPalmsTouching = false;

	if (currentLevel === 1 && level1SongAudio) {
		level1SongAudio.play().catch(() => {
			setStatus("Tap anywhere, then press Resume");
		});
		startCountdownDisplay();
		startSceneEffectsLoop();
		setStatus("Level resumed");
	} else if (currentLevel === 2 && level2SongAudio) {
		level2SongAudio.play().catch(() => {
			setStatus("Tap anywhere, then press Resume");
		});
		startCountdownDisplay();
		setStatus("Level resumed");
	} else {
		setStatus("Level resumed");
	}

	setDebug(["game: running", `level: ${currentLevel || "-"}`]);
	resumeFishStream();
	updatePauseButtonUI();
};

const togglePause = () => {
	if (!isGameStarted) {
		return;
	}

	if (isGamePaused) {
		resumeCurrentLevel();
		return;
	}

	pauseCurrentLevel();
};

const returnToHomeScreen = () => {
	yuckActiveUntil = 0;
	if (yuckResetTimerId) {
		window.clearTimeout(yuckResetTimerId);
		yuckResetTimerId = null;
	}
	hideYuckSprite();
	pauseFishStream();
	stopFishStream();
	stopLevelSongs();
	isGameStarted = false;
	isGamePaused = false;
	currentLevel = null;
	level1ThrownCount = 0;
	eatenFishCount = 0;
	missedFishCount = 0;
	isMouthLockedClosed = false;
	clapOpenUntil = 0;
	wasPalmsTouching = false;
	applyLevelVisuals(1);
	stopSceneEffectsLoop();
	showClosed();
	updateFishCounter();
	hideGameOverScreen();
	hideGameplayControls();
	showLevelScreen();
	setStatus("Select a level to begin");
	setDebug(["level: waiting for selection"]);
	updatePauseButtonUI();
};

const startGameplayForCurrentLevel = () => {
	if (!isGameStarted) {
		return;
	}

	hideGameOverScreen();
	showGameplayControls();

	if (currentLevel === 1) {
		startSceneEffectsLoop();
		stopLevel2Song();
		playLevel1Song();
		startCountdownDisplay();
		setStatus("Hand tracking ready - waiting for song count-in");
		setDebug([`camera: ${videoWidth}x${videoHeight}`, "ml5: model ready", "song: waiting for 3-2-1-go"]);
	} else {
		stopSceneEffectsLoop();
		stopLevel1Song();
		playLevel2Song();
		startCountdownDisplay();
	}

	startFishStream();
};

const startLevel = (levelNumber) => {
	if (isGameStarted) {
		return;
	}

	yuckActiveUntil = 0;
	if (yuckResetTimerId) {
		window.clearTimeout(yuckResetTimerId);
		yuckResetTimerId = null;
	}
	hideYuckSprite();

	isGameStarted = true;
	isGamePaused = false;
	isMouthLockedClosed = false;
	clapOpenUntil = 0;
	wasPalmsTouching = false;
	currentLevel = levelNumber;
	level1ThrownCount = 0;
	eatenFishCount = 0;
	missedFishCount = 0;
	applyLevelConfig(levelNumber);
	applyLevelVisuals(levelNumber);
	updateFishCounter();
	hideLevelScreen();
	hideGameOverScreen();
	showGameplayControls();
	updatePauseButtonUI();
	setStatus(`Level ${currentLevel} started`);
	setDebug(["level: selected", `current: ${currentLevel}`, "camera: starting..."]);
	stopFishStream();
	lastScheduledLevel1BeatSongMs = -Infinity;
	stopLevelSongs();
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

			isGamePaused = false;
			isGameStarted = false;
			startLevel(currentLevel);
		});
	}

	if (skipButton) {
		skipButton.addEventListener("click", () => {
			// Development: Skip to end screen
			if (level1SongAudio) {
				level1SongAudio.pause();
				level1SongAudio.currentTime = 0;
			}
			isGameStarted = false;
			isGamePaused = false;
			showGameOverScreen();
		});
	}

	if (levelSelectButton) {
		levelSelectButton.addEventListener("click", returnToHomeScreen);
	}

	if (pauseButton) {
		pauseButton.addEventListener("click", togglePause);
	}

	if (skipLevelButton) {
		skipLevelButton.addEventListener("click", () => {
			// Development: Skip to end screen
			if (level1SongAudio) {
				level1SongAudio.pause();
				level1SongAudio.currentTime = 0;
			}
			isGameStarted = false;
			isGamePaused = false;
			stopFishSpawnTimers();
			showGameOverScreen();
		});
	}

	if (homeButton) {
		homeButton.addEventListener("click", returnToHomeScreen);
	}

	setStatus("Select a level to begin");
	setDebug(["level: waiting for selection"]);
	updatePauseButtonUI();
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
	if (!isGameStarted || isGamePaused) {
		showClosed();
		if (isGamePaused) {
			setStatus("Paused");
		}
		return;
	}

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

	const isMouthOpenNow = contactClap && !isYuckActive();
	if (isYuckActive()) {
		showYuck();
		setStatus(contactClap ? "Hands touching" : "Bring hands together");
	} else if (isMouthOpenNow) {
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
		isAudioMuted = !isAudioMuted;
		applyAudioMuteState();
	});

	applyAudioMuteState();
};

const init = async () => {
	updateFishCounter();
	ensureClapCueWords();
	ensureNomSoundReady();
	ensureWoofSoundPool();
	await prepareFishSprites();
	setupLevelScreen();
	setupMuteButton();
};

init();
