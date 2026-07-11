// app.js
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('/kronos/sw.js',
			{ scope: '/kronos/' }).then(
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

const STEP_PRE_SHOOT = "PRÉ-TIR";
const STEP_SHOOT = "TIR";

let interval;
let timeLeft = 0;
let isSoundEnabled = false;
let isPreShootDisabled = false;
let selectedShooting = null;
let selectedSequence = null;
let currentSequenceIndex = 0;

let shootings = [
	{ key: "individuel_6", readyTime: 3, shootTime: 35 , warningTime: 30},
	{ key: "individuel_3", readyTime: 10, shootTime: 120 , warningTime: 30},
	{ key: "individuel_1", readyTime: 10, shootTime: 20 , warningTime: 10},
	{ key: "equipe_3_6", readyTime: 10, shootTime: 120 , warningTime: 30},
	{ key: "equipe_3_3", readyTime: 10, shootTime: 60 , warningTime: 30},
	{ key: "equipe_2_4", readyTime: 10, shootTime: 80 , warningTime: 20}
];

function refreshUI() {

	console.log("refreshUI");
	let teamHtml = document.getElementById("team");
	let stepHtml = document.getElementById("step");
	let timeHtml = document.getElementById("time");
	let chronoBtnImg = document.getElementById("chrono-btn-img");

	let chrono = document.getElementById("display");
	let step = selectedSequence[currentSequenceIndex].step;
	let warningTime = selectedSequence[currentSequenceIndex].warningTime;

	console.log("step: " + step + ", timeLeft: " + timeLeft);

	let signal = "";

	if (step === STEP_PRE_SHOOT) {
		chrono.classList = "chrono-red";
		console.log("RED");
	}
	else if (step === STEP_SHOOT) {
		if (timeLeft === 0) {
			chrono.classList = "chrono-red";

		} else if (timeLeft <= warningTime) {
			chrono.classList = "chrono-yellow";

		} else if (timeLeft > warningTime) {
			chrono.classList = "chrono-green";

		}
	}

	if (chronoState === CHRONO_STATE_START) { // Démarrer
		timeHtml.textContent = selectedSequence[currentSequenceIndex].time;
		teamHtml.innerHTML = selectedSequence[currentSequenceIndex].team;
		stepHtml.textContent = signal + selectedSequence[currentSequenceIndex].step;
		chronoBtnImg.src = "assets/btn-play.png";
	}
	else if (chronoState === CHRONO_STATE_PAUSED) { // Pause
		timeHtml.textContent = timeLeft;
		teamHtml.innerHTML = selectedSequence[currentSequenceIndex].team;
		stepHtml.textContent = signal + selectedSequence[currentSequenceIndex].step;
		chronoBtnImg.src = "assets/btn-play.png";
	}
	else if (chronoState === CHRONO_STATE_RUNNING) { // Continue
		timeHtml.textContent = timeLeft;
		teamHtml.innerHTML = selectedSequence[currentSequenceIndex].team;
		stepHtml.textContent = signal + selectedSequence[currentSequenceIndex].step;
		chronoBtnImg.src = "assets/btn-pause.png";
	}
	else if (chronoState === CHRONO_STATE_END) { // Relancer
		timeHtml.textContent = "0";
		stepHtml.textContent = "STOP";
		chrono.classList = "chrono-red";
		chronoBtnImg.src = "assets/btn-replay.png";
	}
}

function buzzerSound1() {
	if (isSoundEnabled) {
		document.getElementById("buzzer1").play();
	}
}

function buzzerSound2() {
	if (isSoundEnabled) {
		document.getElementById("buzzer2").play();
	}
}

function runChrono() {

	if (interval) return; // interval/chrono already running

	if (chronoState === CHRONO_STATE_START) { // démarrer
		buzzerSound2();
		refreshUIForChronoState(CHRONO_STATE_RUNNING);
	}

	interval = setInterval(() => {
		chronoRunning();
	}, 1000);

}

function chronoRunning() {

	let currentStep = selectedSequence[currentSequenceIndex].step;
	let currentStepTime = selectedSequence[currentSequenceIndex].time;

	timeLeft--;

	if (currentStep === STEP_PRE_SHOOT && timeLeft === 0) { // when preshoot reaches 0 second, and go to shoot.
		currentSequenceIndex = 1;
		timeLeft = selectedSequence[1].time;
		buzzerSound1();
		refreshUIForChronoState(CHRONO_STATE_RUNNING);
	} else if (currentStep === STEP_SHOOT && timeLeft === 0) { // when shoot reaches 0 second, and go to end.
		buzzerSound2();
		refreshUIForChronoState(CHRONO_STATE_END);
	} else if (timeLeft > 0) { // countdown
		refreshUIForChronoState(CHRONO_STATE_RUNNING);
	} else { // default 
		refreshUIForChronoState(CHRONO_STATE_END);
	}
}

function pauseChrono() {
	console.log("pauseChrono");
	refreshUIForChronoState(CHRONO_STATE_PAUSED)
}



function resetChrono() {

	console.log("resetChrono");

	let selectedShootinIndex = parseInt(document.getElementById("modeSelect").value);
	// let selectedSequenceValue = document.getElementById("sequenceSelect").value;

	selectedShooting = shootings[selectedShootinIndex];
	let readyTime = selectedShooting.readyTime;
	let shootTime = selectedShooting.shootTime;
	let warningTime = selectedShooting.warningTime;

	selectedSequence = [
		{ team: "", step: STEP_PRE_SHOOT, time: readyTime, warningTime: -1 },
		{ team: "", step: STEP_SHOOT, time: shootTime, warningTime: warningTime }
	];

	// Remove preshoot step if disabled
	if (isPreShootDisabled) {
		selectedSequence = selectedSequence.filter(step => step.step !== STEP_PRE_SHOOT);
	}

	console.log(selectedSequence);

	timeLeft = selectedSequence[0].time;
	currentSequenceIndex = 0;
	refreshUIForChronoState(CHRONO_STATE_START);
}

function destroyInterval() {
	clearInterval(interval);
	interval = null;
}

function refreshUIForChronoState(status) {

	chronoState = status;
	
	if(chronoState === CHRONO_STATE_START) {
		destroyInterval(); 
	} else if(chronoState === CHRONO_STATE_RUNNING) {
		// nothing to do
	} else if(chronoState === CHRONO_STATE_PAUSED) {
		destroyInterval();
	} else if(chronoState === CHRONO_STATE_END) {
		destroyInterval();
	}

	refreshUI();
}



function onChronoButton() {

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

function onResetButton() {

	console.log("onResetButton");

	let showAlert = false;

	if (chronoState === CHRONO_STATE_RUNNING) {
		showAlert = true;
		pauseChrono();
	} else if (chronoState === CHRONO_STATE_PAUSED) {
		showAlert = true;
	}

	if (showAlert) {
		if (confirm("Êtes-vous sûr de vouloir réinitialiser le chrono ?")) {
			resetChrono();
		}
	} else {
		resetChrono();
	}

}

function onShootingChange() {
	console.log("onShootingChange");
	onResetButton();
}

function onPreshootToggle() {
	isPreShootDisabled = document.getElementById("disable-preshoot").checked;
	onResetButton();
}

function onSoundToggle() {
	isSoundEnabled = document.getElementById("enable-sound").checked;
}

resetChrono();


// function topFunction() {
// 	console.log("topFunction");

// 	window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });

// //   document.body.scrollTop = 0; // For Safari
// //   document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
// }


// // Initialize deferredPrompt for use later to show browser install prompt.
// let deferredPrompt;

// window.addEventListener('beforeinstallprompt', (e) => {
//   // Prevent the mini-infobar from appearing on mobile
//   e.preventDefault();
//   // Stash the event so it can be triggered later.
//   deferredPrompt = e;
//   // Update UI notify the user they can install the PWA
//   //showInstallPromotion();
//   // Optionally, send analytics event that PWA install promo was shown.
//   console.log(`'beforeinstallprompt' event was fired.`);
// });

// document.getElementById("install-btn").addEventListener('click', async () => {
//   // Hide the app provided install promotion
//  // hideInstallPromotion();
//   // Show the install prompt
//   deferredPrompt.prompt();
//   // Wait for the user to respond to the prompt
//   const { outcome } = await deferredPrompt.userChoice;
//   // Optionally, send analytics event with outcome of user choice
//   console.log(`User response to the install prompt: ${outcome}`);
//   // We've used the prompt and can't use it again, throw it away
//   deferredPrompt = null;
// });


// window.addEventListener('appinstalled', () => {
//   // Hide the app-provided install promotion
//  // hideInstallPromotion();
//   // Clear the deferredPrompt so it can be garbage collected
//   deferredPrompt = null;
//   // Optionally, send analytics event to indicate successful install
//   console.log('PWA was installed');
// });