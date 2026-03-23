const catClosed = document.getElementById("catClosed");
const catOpen = document.getElementById("catOpen");
const trackerStatus = document.getElementById("trackerStatus");
const inputVideo = document.getElementById("inputVideo");

let closeTimeoutId = null;
let isTrackingStarted = false;
let lastClapAt = 0;
let clapArmed = true;
let togetherFrames = 0;
let apartFrames = 0;
let videoWidth = 640;
let videoHeight = 480;

const showClosed = () => {
	catClosed.classList.remove("is-hidden");
	catOpen.classList.add("is-hidden");
};

const showOpen = () => {
	catClosed.classList.add("is-hidden");
	catOpen.classList.remove("is-hidden");
};

const triggerMouthOpen = () => {
	showOpen();
	window.clearTimeout(closeTimeoutId);
	closeTimeoutId = window.setTimeout(showClosed, 450);
};


const setStatus = (message) => {
	if (trackerStatus) {
		trackerStatus.textContent = message;
	}
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

	if (Array.isArray(hand.landmarks) && hand.landmarks.length >= 21) {
		return hand.landmarks.map(toPoint);
	}

	if (Array.isArray(hand.keypoints) && hand.keypoints.length >= 21) {
		return hand.keypoints.slice(0, 21).map(toPoint);
	}

	return null;
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

const detectClapFromHands = (multiHandLandmarks) => {
	if (!multiHandLandmarks || multiHandLandmarks.length < 2) {
		togetherFrames = 0;
		apartFrames += 1;

		if (apartFrames >= 4) {
			clapArmed = true;
		}

		setStatus("Show both hands to detect a clap");
		return;
	}

	const firstHand = getLandmarks(multiHandLandmarks[0]);
	const secondHand = getLandmarks(multiHandLandmarks[1]);

	if (!firstHand || !secondHand) {
		setStatus("Keep both hands in the camera frame");
		return;
	}

	const firstPalm = palmCenter(firstHand);
	const secondPalm = palmCenter(secondHand);
	const dx = firstPalm.x - secondPalm.x;
	const dy = firstPalm.y - secondPalm.y;
	const palmDistance = Math.hypot(dx, dy);

	const now = performance.now();
	const clapCooldownPassed = now - lastClapAt > 140;
	const touchThresholdPx = Math.max(120, Math.min(videoWidth, videoHeight) * 0.38);
	const palmsTouching = palmDistance < touchThresholdPx;

	if (palmsTouching) {
		togetherFrames += 1;
		apartFrames = 0;
	} else {
		togetherFrames = 0;
		apartFrames += 1;
	}

	if (apartFrames >= 2) {
		clapArmed = true;
	}

	const hasConfirmedClap = togetherFrames >= 2;

	if (clapArmed && clapCooldownPassed && hasConfirmedClap) {
		lastClapAt = now;
		clapArmed = false;
		togetherFrames = 0;
		triggerMouthOpen();
		setStatus("Clap detected");
	} else {
		setStatus("Touch both palms together");
	}
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
		return;
	}

	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		setStatus("Camera is not supported on this browser");
		return;
	}

	try {
		setStatus("Starting camera...");
		await startVideo();

		setStatus("Loading ml5 hand model...");
		const handPose = await window.ml5.handPose({
			maxHands: 2,
			flipped: true
		});

		isTrackingStarted = true;
		setStatus("Hand tracking ready");

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

startHandTracking();
