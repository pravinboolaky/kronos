// app.js
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('/kronos/sw.js').then(
			function (registration) {
				// registration succeed
				console.log(
					'ServiceWorker registration successful with scope: ',
					registration.scope
				);
			},
			function (error) {
				// registration failed
				console.log('ServiceWorker registration failed: ', error);
			}
		);
	});
}

const CHRONO_STATE_START = 1;
const CHRONO_STATE_RUNNING = 2;
const CHRONO_STATE_PAUSED = 3;
const CHRONO_STATE_END = 4;
let chronoState = CHRONO_STATE_START;

let interval;
let timeLeft = 0;
let isSoundEnabled = false;
let isPreShootDisabled = false;
let selectedShooting = null;
let selectedSequence = null;
let currentSequenceIndex = 0;

let shootings = [
	{ key: "individuel_6", readyTime: 2, shootTime: 34},
	{ key: "individuel_3", readyTime: 10, shootTime: 120},
	{ key: "individuel_1", readyTime: 10, shootTime: 20},
	{ key: "equipe_3_6", readyTime: 10, shootTime: 120},
	{ key: "equipe_3_3", readyTime: 10, shootTime: 60},
	{ key: "equipe_2_4", readyTime: 10, shootTime: 80}
];

let rotations = [
	{ key: "SINGLE", description: "L'archer tire seul."},
	{ key: "AB > CD", description: "Les archers AB en premier, et les archers CD tire en second."}
];

function refreshDisplay() {
	console.log("refreshDisplay");
	let teamHtml = document.getElementById("team");
	let stepHtml = document.getElementById("step");
	let timeHtml = document.getElementById("time");
	let chronoBtnImg = document.getElementById("chrono-btn-img");

	let chrono = document.getElementById("display");
	let step = selectedSequence[currentSequenceIndex].step;

	console.log("step: " + step + ", timeLeft: " + timeLeft);

	if(step === "PRE-TIR") {
		chrono.classList = "chrono-red";
		console.log("RED");
	}
	else if(step === "TIR") {
		if(timeLeft === 0) {
			chrono.classList = "chrono-red";
		} else if(timeLeft <= 30) {
			chrono.classList = "chrono-yellow";
		} else if(timeLeft > 30) {
			chrono.classList = "chrono-green";	
		}
	}

	if (chronoState === CHRONO_STATE_START) { // Démarrer
		timeHtml.textContent = selectedSequence[currentSequenceIndex].time;
		teamHtml.innerHTML = selectedSequence[currentSequenceIndex].team;
		stepHtml.textContent = selectedSequence[currentSequenceIndex].step;
		chronoBtnImg.src = "assets/btn-play.png";
	}
	else if (chronoState === CHRONO_STATE_PAUSED) { // Pause
		timeHtml.textContent = timeLeft;
		teamHtml.innerHTML = selectedSequence[currentSequenceIndex].team;
		stepHtml.textContent = selectedSequence[currentSequenceIndex].step;
		chronoBtnImg.src = "assets/btn-play.png";
	}
	else if (chronoState === CHRONO_STATE_RUNNING) { // Continue
		timeHtml.textContent = timeLeft;
		teamHtml.innerHTML = selectedSequence[currentSequenceIndex].team;
		stepHtml.textContent = selectedSequence[currentSequenceIndex].step;
		chronoBtnImg.src = "assets/btn-pause.png";
	}
	else if (chronoState === CHRONO_STATE_END) { // Relancer
		timeHtml.textContent = "0";
		stepHtml.textContent = "FIN TIR";
		chrono.classList = "chrono-red";
		chronoBtnImg.src = "assets/btn-replay.png";
	}
}

function runChrono() {
	if (interval) return;
	updateChronoStateTo(CHRONO_STATE_RUNNING);
	refreshDisplay();

	interval = setInterval(() => {
		if (timeLeft > 0) {
			timeLeft--;
			updateChronoStateTo(CHRONO_STATE_RUNNING);
		} else {
			//document.getElementById("beep").play();
			if (currentSequenceIndex + 1 >= selectedSequence.length) { // end of sequence
				updateChronoStateTo(CHRONO_STATE_END);
				destroyInterval();
			} else { // next sequence step
				currentSequenceIndex++;
				timeLeft = selectedSequence[currentSequenceIndex].time;
			}
		}
		refreshDisplay();
	}, 1000);
}

function pauseChrono() {
	destroyInterval();
	updateChronoStateTo(CHRONO_STATE_PAUSED)
	refreshDisplay();
}

function resetChrono() {

	destroyInterval();
	let selectedModeIndex = parseInt(document.getElementById("modeSelect").value);
	// let selectedSequenceValue = document.getElementById("sequenceSelect").value;

	selectedShooting = shootings[selectedModeIndex];
	let readyTime = selectedShooting.readyTime;
	let shootTime = selectedShooting.shootTime;

	selectedSequence = [
		{ team: "", step: "PRE-TIR", time: readyTime },
		{ team: "", step: "TIR", time: shootTime }
	];
	// switch (selectedSequenceValue) {
	// 	case "SOLO":
	// 		selectedSequence = [
	// 			{ team: "A", step: "PRÉPA", time: readyTime },
	// 			{ team: "A", step: "TIR", time: shootTime }
	// 		]
	// 		break;
	// 	case "ABCD":
	// 		selectedSequence = [
	// 			{ team: "A</br>B", step: "PRÉPA", time: readyTime },
	// 			{ team: "A</br>B", step: "TIR", time: shootTime },
	// 			{ team: "C</br>D", step: "PRÉPA", time: readyTime },
	// 			{ team: "C</br>D", step: "TIR", time: shootTime }
	// 		]
	// 		break;
	// 	case "CDAB":
	// 		selectedSequence = [
	// 			{ team: "C</br>D", step: "PRÉPA", time: readyTime },
	// 			{ team: "C</br>D", step: "TIR", time: shootTime },
	// 			{ team: "A</br>B", step: "PRÉPA", time: readyTime },
	// 			{ team: "A</br>B", step: "TIR", time: shootTime }
	// 		]
	// 		break;
	// }

	// Remove warmup step if warmup is disabled
	if (isPreShootDisabled) {
		selectedSequence = selectedSequence.filter(step => step.step !== "PRÉPA");
	}

	console.log(selectedSequence);

	timeLeft = selectedSequence[0].time;
	currentSequenceIndex = 0;
	updateChronoStateTo(CHRONO_STATE_START);
	refreshDisplay();
}

function destroyInterval() {
	clearInterval(interval);
	interval = null;
}

function updateChronoStateTo(status) {
	chronoState = status;
}

function onResetBtn() {
	resetChrono();
}

function onToggleChronoButton() {

	if (chronoState === CHRONO_STATE_START) { // Démarrer
		runChrono();
	}
	else if (chronoState === CHRONO_STATE_PAUSED) { // Continuer
		runChrono();
	}
	else if (chronoState === CHRONO_STATE_RUNNING) { // Pause
		pauseChrono();
	}
	else if (chronoState === CHRONO_STATE_END) { // Relancer
		resetChrono();
		runChrono();
	}
}

function onWarmupToggle() {
	isPreShootDisabled = document.getElementById("disable-preshoot").checked;
}

function onSoundToggle() {
	isSoundEnabled = document.getElementById("enable-sound").checked;
}
resetChrono();