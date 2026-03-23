const catClosed = document.getElementById("catClosed");
const catOpen = document.getElementById("catOpen");
const trackerStatus = document.getElementById("trackerStatus");
const trackerDebug = document.getElementById("trackerDebug");
const fishCounter = document.getElementById("fishCounter");
const inputVideo = document.getElementById("inputVideo");
const scene = document.querySelector(".scene");
const fishFlightLayer = document.getElementById("fishFlightLayer");
const fishLandedLayer = document.getElementById("fishLandedLayer");

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

const HAND_MEMORY_MS = 180;
const STALE_HOLD_MS = 320;
const MIN_TRIGGER_GAP_MS = 170;
const MAX_LANDED_FISH = 12;
const FISH_IMAGE_SRC = "images/fish 1.png";
const FIGMA_FRAME_WIDTH = 1440;

const activeFish = [];
let fishSpawnTimerId = null;
let fishAnimationFrameId = null;
let isMouthOpen = false;
let fishSpriteSrc = FISH_IMAGE_SRC;
let fishWidthRatioToFrame = 0.12;
let eatenFishCount = 0;
let missedFishCount = 0;

const showClosed = () => {
	catClosed.classList.remove("is-hidden");
	catOpen.classList.add("is-hidden");
	isMouthOpen = false;
};

const showOpen = () => {
	catClosed.classList.add("is-hidden");
	catOpen.classList.remove("is-hidden");
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

const updateFishCounter = () => {
	if (!fishCounter) {
		return;
	}

	fishCounter.textContent = `Eaten: ${eatenFishCount} | Missed: ${missedFishCount}`;
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

const getSceneMetrics = () => {
	const bounds = scene.getBoundingClientRect();
	return {
		width: bounds.width,
		height: bounds.height,
		mouthX: bounds.width * 0.715,
		mouthY: bounds.height * 0.62,
		catchX: bounds.width * 0.73,
		catchY: bounds.height * 0.64,
		landX: bounds.width * 0.78,
		landY: bounds.height * 0.9
	};
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

const spawnFish = () => {
	if (!fishFlightLayer || !scene) {
		return;
	}

	const metrics = getSceneMetrics();
	const sprite = createFishSprite();
	const fishWidth = Math.max(34, metrics.width * fishWidthRatioToFrame);
	const startY = lerp(metrics.height * 0.27, metrics.height * 0.43, Math.random());
	const controlX = lerp(metrics.width * 0.28, metrics.width * 0.5, Math.random());
	const controlY = lerp(metrics.height * 0.03, metrics.height * 0.2, Math.random());
	const endX = metrics.catchX + lerp(-28, 24, Math.random());
	const endY = metrics.catchY + lerp(-14, 10, Math.random());

	sprite.style.width = `${Math.round(fishWidth)}px`;

	fishFlightLayer.appendChild(sprite);
	activeFish.push({
		sprite,
		phase: "flight",
		resolved: false,
		startAt: performance.now(),
		durationMs: lerp(980, 1350, Math.random()),
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
			const oneMinusT = 1 - t;
			const x = oneMinusT * oneMinusT * fish.startX + 2 * oneMinusT * t * fish.controlX + t * t * fish.endX;
			const y = oneMinusT * oneMinusT * fish.startY + 2 * oneMinusT * t * fish.controlY + t * t * fish.endY;
			fish.currentX = x;
			fish.currentY = y;
			const tangentX = 2 * oneMinusT * (fish.controlX - fish.startX) + 2 * t * (fish.endX - fish.controlX);
			const tangentY = 2 * oneMinusT * (fish.controlY - fish.startY) + 2 * t * (fish.endY - fish.controlY);
			const angle = Math.atan2(tangentY, tangentX) * (180 / Math.PI);

			fish.sprite.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
			const mouthDistance = Math.hypot(metrics.mouthX - x, metrics.mouthY - y);
			const mouthCatchRadius = Math.max(30, metrics.width * 0.045);

			if (!fish.resolved && mouthDistance <= mouthCatchRadius) {
				fish.resolved = true;
				if (isMouthOpen) {
					eatenFishCount += 1;
					updateFishCounter();
					removeFish(fish, i);
				} else {
					missedFishCount += 1;
					updateFishCounter();
					landFishBehindCat(fish, x, y);
				}
				continue;
			}

			if (t >= 1) {
				if (fish.resolved) {
					removeFish(fish, i);
				} else if (isMouthOpen) {
					eatenFishCount += 1;
					updateFishCounter();
					removeFish(fish, i);
				} else {
					missedFishCount += 1;
					updateFishCounter();
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

const startFishStream = () => {
	if (fishSpawnTimerId || fishAnimationFrameId) {
		return;
	}

	spawnFish();
	fishSpawnTimerId = window.setInterval(spawnFish, 520);
	fishAnimationFrameId = window.requestAnimationFrame(animateFish);
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
		unknownEntries.sort((a, b) => a.palm.x - b.palm.x);

		for (let i = 0; i < unknownEntries.length; i += 1) {
			const entry = unknownEntries[i];
			if (!leftEntry && !rightEntry && unknownEntries.length === 1) {
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

	if (!leftIsFresh || !rightIsFresh) {
		const leftAge = lastLeftSeenAt > 0 ? now - lastLeftSeenAt : Infinity;
		const rightAge = lastRightSeenAt > 0 ? now - lastRightSeenAt : Infinity;
		const holdThroughDropout = wasPalmsTouching && leftAge <= STALE_HOLD_MS && rightAge <= STALE_HOLD_MS;

		if (holdThroughDropout) {
			showOpen();
			setStatus("Clap detected");
		} else {
			wasPalmsTouching = false;
			showClosed();
			setStatus("Show both palms clearly");
		}

		setDebug([
			`hands: ${handsCount}`,
			"palmDistance: -",
			"threshold: -",
			`leftFresh: ${leftIsFresh ? "yes" : "no"}`,
			`rightFresh: ${rightIsFresh ? "yes" : "no"}`,
			`touching: ${wasPalmsTouching ? "yes" : "no"}`,
			`gap(ms): ${Math.max(0, Math.round(MIN_TRIGGER_GAP_MS - (now - lastTriggerAt)))}`,
			"mode: instant-on-touch"
		]);
		return;
	}

	const palmDistance = pointDistance(lastLeftPalm, lastRightPalm);
	const avgPalmSpan = (lastLeftSpan + lastRightSpan) / 2;

	const baseTouchThresholdPx = Math.min(165, Math.max(78, avgPalmSpan * 1.28));
	const releaseThresholdPx = baseTouchThresholdPx + 16;

	let palmsTouching = false;
	if (wasPalmsTouching) {
		palmsTouching = palmDistance < releaseThresholdPx;
	} else {
		palmsTouching = palmDistance < baseTouchThresholdPx;
	}

	const touchingStarted = palmsTouching && !wasPalmsTouching;
	const canTriggerNow = now - lastTriggerAt > MIN_TRIGGER_GAP_MS;
	if (touchingStarted && canTriggerNow) {
		lastTriggerAt = now;
	}

	if (palmsTouching) {
		showOpen();
		setStatus("Clap detected");
	} else {
		showClosed();
		setStatus("Touch palms together");
	}

	wasPalmsTouching = palmsTouching;

	setDebug([
		`hands: ${handsCount}`,
		`palmDistance: ${Math.round(palmDistance)}px`,
		`palmSpan: ${Math.round(avgPalmSpan)}px`,
		`threshold: ${Math.round(baseTouchThresholdPx)}px`,
		`release: ${Math.round(releaseThresholdPx)}px`,
		`leftFresh: ${leftIsFresh ? "yes" : "no"}`,
		`rightFresh: ${rightIsFresh ? "yes" : "no"}`,
		`touching: ${palmsTouching ? "yes" : "no"}`,
		`touchStart: ${touchingStarted ? "yes" : "no"}`,
		`gap(ms): ${Math.max(0, Math.round(MIN_TRIGGER_GAP_MS - (now - lastTriggerAt)))}`,
		"mode: instant-on-touch"
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
			flipped: true
		});

		isTrackingStarted = true;
		setStatus("Hand tracking ready");
		setDebug([`camera: ${videoWidth}x${videoHeight}`, "ml5: model ready", "hands: waiting..."]);

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
		if (!isTrackingStarted) {
			startHandTracking();
		}
	},
	{ passive: true }
);

const init = async () => {
	updateFishCounter();
	await prepareFishSprite();
	startFishStream();
	startHandTracking();
};

init();
