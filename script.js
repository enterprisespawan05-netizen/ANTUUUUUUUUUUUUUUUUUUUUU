/**
 * Lavender Magic Birthday Web Application
 * Multi-scene interactive experience for Bestie's Birthday 💜
 */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     STATE MANAGEMENT
     ========================================================= */
  const CORRECT_PIN = '1510';
  let currentPin = '';
  let isUnlocked = false;
  let currentSceneIndex = 1;
  let isMuted = false;
  let isAudioPlaying = false;
  let wishCountdownTimer = null;
  let introTreeAnimationId = null;

  /* =========================================================
     AUDIO CONTROLLER (DUAL ENGINE: MP3 + WEB AUDIO SYNTH)
     ========================================================= */
  const bgAudioEl = document.getElementById('bg-music');
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  let audioCtx = null;
  let synthGainNode = null;
  let isSynthPlaying = false;
  let synthTimeoutIds = [];

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        synthGainNode = audioCtx.createGain();
        synthGainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
        synthGainNode.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Web Audio Music Box Melody: "Happy Birthday" Notes & Frequencies
  const birthdayMelody = [
    { note: 'G4', freq: 392.00, dur: 0.35, pause: 0.1 },
    { note: 'G4', freq: 392.00, dur: 0.35, pause: 0.1 },
    { note: 'A4', freq: 440.00, dur: 0.7, pause: 0.1 },
    { note: 'G4', freq: 392.00, dur: 0.7, pause: 0.1 },
    { note: 'C5', freq: 523.25, dur: 0.7, pause: 0.1 },
    { note: 'B4', freq: 493.88, dur: 1.2, pause: 0.3 },

    { note: 'G4', freq: 392.00, dur: 0.35, pause: 0.1 },
    { note: 'G4', freq: 392.00, dur: 0.35, pause: 0.1 },
    { note: 'A4', freq: 440.00, dur: 0.7, pause: 0.1 },
    { note: 'G4', freq: 392.00, dur: 0.7, pause: 0.1 },
    { note: 'D5', freq: 587.33, dur: 0.7, pause: 0.1 },
    { note: 'C5', freq: 523.25, dur: 1.2, pause: 0.3 },

    { note: 'G4', freq: 392.00, dur: 0.35, pause: 0.1 },
    { note: 'G4', freq: 392.00, dur: 0.35, pause: 0.1 },
    { note: 'G5', freq: 783.99, dur: 0.7, pause: 0.1 },
    { note: 'E5', freq: 659.25, dur: 0.7, pause: 0.1 },
    { note: 'C5', freq: 523.25, dur: 0.7, pause: 0.1 },
    { note: 'B4', freq: 493.88, dur: 0.7, pause: 0.1 },
    { note: 'A4', freq: 440.00, dur: 1.0, pause: 0.3 },

    { note: 'F5', freq: 698.46, dur: 0.35, pause: 0.1 },
    { note: 'F5', freq: 698.46, dur: 0.35, pause: 0.1 },
    { note: 'E5', freq: 659.25, dur: 0.7, pause: 0.1 },
    { note: 'C5', freq: 523.25, dur: 0.7, pause: 0.1 },
    { note: 'D5', freq: 587.33, dur: 0.7, pause: 0.1 },
    { note: 'C5', freq: 523.25, dur: 1.5, pause: 0.8 },
  ];

  // Play a single celestial bell/music-box chime tone
  function playMusicBoxChime(freq, duration) {
    if (!audioCtx || isMuted) return;
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const chimeGain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Harmonic bell overtone
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.02, now);

    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.6);

    osc1.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(synthGainNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.7);
    osc2.stop(now + duration + 0.7);
  }

  // Play loop of synth melody
  function startSynthMelodyLoop() {
    if (!audioCtx || isSynthPlaying) return;
    isSynthPlaying = true;

    function playLoop() {
      let cumulativeTime = 0;
      synthTimeoutIds = [];

      birthdayMelody.forEach((item) => {
        const id = setTimeout(() => {
          if (isSynthPlaying && !isMuted) {
            playMusicBoxChime(item.freq, item.dur);
          }
        }, cumulativeTime * 1000);
        synthTimeoutIds.push(id);
        cumulativeTime += item.dur + item.pause;
      });

      const loopId = setTimeout(() => {
        if (isSynthPlaying) playLoop();
      }, (cumulativeTime + 1.2) * 1000);
      synthTimeoutIds.push(loopId);
    }

    playLoop();
  }

  function stopSynthMelody() {
    isSynthPlaying = false;
    synthTimeoutIds.forEach(id => clearTimeout(id));
    synthTimeoutIds = [];
  }

  // Interactive Sound Effects (Chime, Error, Click, Popper)
  function playSoundEffect(type) {
    if (!audioCtx || isMuted) return;
    const now = audioCtx.currentTime;

    if (type === 'tap') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'success') {
      // Magic unlock chime
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        setTimeout(() => playMusicBoxChime(freq, 0.4), i * 110);
      });
    } else if (type === 'error') {
      // Error buzz
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'blow') {
      // Blow candle wind puff
      const bufferSize = audioCtx.sampleRate * 0.4;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.4);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      whiteNoise.start(now);
    }
  }

  // Start background audio (with fallback to synth if mp3 is missing)
  function startMusicExperience() {
    initAudioContext();
    isAudioPlaying = true;
    updateMusicButtonUI();

    if (bgAudioEl) {
      bgAudioEl.volume = 0.55;
      const playPromise = bgAudioEl.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // MP3 file played successfully!
        }).catch(() => {
          // MP3 failed or not found - gracefully fallback to web audio synth!
          startSynthMelodyLoop();
        });
      }
    } else {
      startSynthMelodyLoop();
    }
  }

  // Toggle Mute / Unmute
  function toggleMusic() {
    isMuted = !isMuted;
    if (bgAudioEl) {
      bgAudioEl.muted = isMuted;
    }
    if (synthGainNode) {
      synthGainNode.gain.setValueAtTime(isMuted ? 0 : 0.35, audioCtx ? audioCtx.currentTime : 0);
    }
    updateMusicButtonUI();
  }

  function updateMusicButtonUI() {
    if (isMuted) {
      musicToggleBtn.classList.add('muted');
      musicToggleBtn.title = "Unmute Birthday Music";
    } else {
      musicToggleBtn.classList.remove('muted');
      musicToggleBtn.title = "Mute Birthday Music";
    }
  }

  musicToggleBtn.addEventListener('click', () => {
    initAudioContext();
    if (!isAudioPlaying) {
      startMusicExperience();
    } else {
      toggleMusic();
    }
  });

  // Duck audio volume for Scene 5 & 6 (reading letter and invitation)
  function setVolumeForScene(sceneNum) {
    if (!audioCtx) return;
    if (sceneNum === 5 || sceneNum === 6) {
      if (bgAudioEl) bgAudioEl.volume = 0.25;
      if (synthGainNode) synthGainNode.gain.setValueAtTime(isMuted ? 0 : 0.16, audioCtx.currentTime);
    } else {
      if (bgAudioEl) bgAudioEl.volume = 0.55;
      if (synthGainNode) synthGainNode.gain.setValueAtTime(isMuted ? 0 : 0.35, audioCtx.currentTime);
    }
  }

  /* =========================================================
     SCENE NAVIGATION SYSTEM
     ========================================================= */
  function navigateToScene(sceneNum) {
    if (sceneNum > 2 && !isUnlocked) {
      // Guard against accessing later scenes before unlocking
      navigateToScene(2);
      return;
    }

    const currentScene = document.querySelector('.scene.active');
    const targetScene = document.getElementById(`scene-${sceneNum}`);
    if (!targetScene || currentScene === targetScene) return;

    if (wishCountdownTimer) {
      clearInterval(wishCountdownTimer);
      wishCountdownTimer = null;
    }

    currentSceneIndex = sceneNum;
    setVolumeForScene(sceneNum);

    // Fade out current
    currentScene.style.opacity = '0';
    currentScene.style.transform = 'scale(0.96) translateY(-10px)';

    setTimeout(() => {
      currentScene.classList.remove('active');
      currentScene.style.display = 'none';

      targetScene.style.display = 'flex';
      targetScene.style.opacity = '0';
      targetScene.style.transform = 'scale(0.96) translateY(15px)';

      setTimeout(() => {
        targetScene.classList.add('active');
        targetScene.style.opacity = '1';
        targetScene.style.transform = 'scale(1) translateY(0)';

        // Trigger scene specific actions
        onSceneEntered(sceneNum);
      }, 40);
    }, 450);
  }

  function onSceneEntered(sceneNum) {
    if (sceneNum === 2) {
      // Focus pin slot
      document.body.classList.add('theme-lavender');
    } else if (sceneNum === 4) {
      // Start wish countdown (5 seconds auto-advance)
      startWishCountdown();
      spawnPastelBalloons();
    } else if (sceneNum === 5) {
      // Animate letter text appearance
      revealLetterParagraphs();
    } else if (sceneNum === 6) {
      // Initialize Scene 6 Invitation Countdown & effects
      startInvitationCountdown();
      triggerConfettiBurst();
    }
  }

  /* =========================================================
     SCENE 1: CINEMATIC INTRO & TREE CANVAS ANIMATION
     ========================================================= */
  const treeCanvas = document.getElementById('tree-canvas');
  const treeCtx = treeCanvas.getContext('2d');
  const tapOverlay = document.getElementById('tap-to-begin-overlay');
  const startExpBtn = document.getElementById('start-experience-btn');
  const skipIntroBtn = document.getElementById('skip-intro-btn');
  const introTitleBox = document.getElementById('intro-title-box');

  function resizeTreeCanvas() {
    treeCanvas.width = window.innerWidth;
    treeCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeTreeCanvas);
  resizeTreeCanvas();

  // Branch data structure for procedural tree
  let treeBranches = [];
  let blossomingHearts = [];
  let treeStartTime = 0;
  let treeAnimationComplete = false;

  function generateTreeStructure() {
    treeBranches = [];
    blossomingHearts = [];

    const startX = treeCanvas.width / 2;
    const startY = treeCanvas.height;
    const trunkLength = Math.min(treeCanvas.height * 0.28, 180);

    function createBranch(x, y, length, angle, depth, delay) {
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;

      const branch = {
        startX: x,
        startY: y,
        endX: endX,
        endY: endY,
        width: Math.max(depth * 1.5, 1.5),
        depth: depth,
        progress: 0,
        delay: delay,
        duration: 800,
        completed: false
      };
      treeBranches.push(branch);

      if (depth > 1) {
        const subLength = length * 0.76;
        const angleSpread = 0.45 + (Math.random() * 0.15 - 0.07);
        // Left sub-branch
        createBranch(endX, endY, subLength, angle - angleSpread, depth - 1, delay + 500);
        // Right sub-branch
        createBranch(endX, endY, subLength, angle + angleSpread, depth - 1, delay + 500);
        // Center branch on main forks
        if (depth > 3 && Math.random() > 0.4) {
          createBranch(endX, endY, subLength * 0.65, angle + (Math.random() * 0.2 - 0.1), depth - 1, delay + 700);
        }
      } else {
        // Tip branch: spawn a blossoming heart
        blossomingHearts.push({
          x: endX,
          y: endY,
          size: Math.random() * 10 + 10,
          scale: 0,
          targetScale: 1,
          color: ['#F7C6E0', '#B497D6', '#E6D9F5', '#d4a5db'][Math.floor(Math.random() * 4)],
          delay: delay + 600 + Math.random() * 1200,
          rotation: (Math.random() - 0.5) * 0.5
        });
      }
    }

    createBranch(startX, startY, trunkLength, -Math.PI / 2, 6, 0);
  }

  // Draw procedural heart on canvas
  function drawHeart(ctx, x, y, size, color, scale, rotation) {
    if (scale <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    const d = size / 2;
    ctx.moveTo(0, d * 0.3);
    ctx.bezierCurveTo(-d, -d * 0.8, -d * 1.5, d * 0.4, 0, d * 1.4);
    ctx.bezierCurveTo(d * 1.5, d * 0.4, d, -d * 0.8, 0, d * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function renderTreeFrame(timestamp) {
    if (!treeStartTime) treeStartTime = timestamp;
    const elapsed = timestamp - treeStartTime;

    treeCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);

    let allBranchesDone = true;

    // Render tree branches
    treeBranches.forEach(branch => {
      if (elapsed < branch.delay) {
        allBranchesDone = false;
        return;
      }
      const branchElapsed = elapsed - branch.delay;
      branch.progress = Math.min(branchElapsed / branch.duration, 1);
      if (branch.progress < 1) allBranchesDone = false;

      // Draw branch segment
      const curEndX = branch.startX + (branch.endX - branch.startX) * branch.progress;
      const curEndY = branch.startY + (branch.endY - branch.startY) * branch.progress;

      treeCtx.save();
      treeCtx.beginPath();
      treeCtx.moveTo(branch.startX, branch.startY);
      treeCtx.lineTo(curEndX, curEndY);
      treeCtx.strokeStyle = '#cbb8e8';
      treeCtx.lineWidth = branch.width;
      treeCtx.lineCap = 'round';
      treeCtx.shadowColor = '#B497D6';
      treeCtx.shadowBlur = 4;
      treeCtx.stroke();
      treeCtx.restore();
    });

    // Render blossoming hearts
    let allHeartsDone = true;
    blossomingHearts.forEach(heart => {
      if (elapsed > heart.delay) {
        const heartElapsed = elapsed - heart.delay;
        const heartProgress = Math.min(heartElapsed / 600, 1);
        // Spring ease
        heart.scale = 1 + Math.sin(heartProgress * Math.PI) * 0.25;
        if (heartProgress >= 1) heart.scale = 1;
        if (heartProgress < 1) allHeartsDone = false;

        drawHeart(treeCtx, heart.x, heart.y, heart.size, heart.color, heart.scale, heart.rotation);
      } else {
        allHeartsDone = false;
      }
    });

    // Background transition from black to lavender
    if (elapsed > 2400) {
      document.body.classList.add('theme-lavender');
    }

    // Title reveal at ~3.5s
    if (elapsed > 3200 && !introTitleBox.classList.contains('visible')) {
      introTitleBox.classList.add('visible');
    }

    // Auto-advance to Scene 2 after title has shone for ~3 seconds
    if (elapsed > 6600 && !treeAnimationComplete) {
      treeAnimationComplete = true;
      navigateToScene(2);
      return;
    }

    if (!treeAnimationComplete) {
      introTreeAnimationId = requestAnimationFrame(renderTreeFrame);
    }
  }

  function startCinematicIntro() {
    tapOverlay.classList.add('hidden');
    startMusicExperience();
    generateTreeStructure();
    treeStartTime = 0;
    introTreeAnimationId = requestAnimationFrame(renderTreeFrame);
  }

  startExpBtn.addEventListener('click', () => {
    playSoundEffect('tap');
    startCinematicIntro();
  });

  skipIntroBtn.addEventListener('click', () => {
    playSoundEffect('tap');
    treeAnimationComplete = true;
    if (introTreeAnimationId) cancelAnimationFrame(introTreeAnimationId);
    document.body.classList.add('theme-lavender');
    navigateToScene(2);
  });

  /* =========================================================
     SCENE 2: PASSWORD GATE
     ========================================================= */
  const pinInput = document.getElementById('pin-input');
  const pinSlots = document.querySelectorAll('.pin-slot');
  const pinErrorMsg = document.getElementById('pin-error-msg');
  const passwordCard = document.getElementById('password-card');
  const lockIconBox = document.getElementById('lock-icon-box');
  const lockIcon = document.getElementById('lock-icon');
  const unlockSubmitBtn = document.getElementById('unlock-submit-btn');

  function updatePinDisplay() {
    pinSlots.forEach((slot, index) => {
      if (index < currentPin.length) {
        slot.classList.add('filled');
      } else {
        slot.classList.remove('filled');
      }
    });
  }

  function addPinDigit(digit) {
    if (currentPin.length < 4) {
      currentPin += digit;
      playSoundEffect('tap');
      updatePinDisplay();
      pinErrorMsg.textContent = '';
      if (currentPin.length === 4) {
        // Auto-check on 4 digits or allow hitting Unlock/Enter
        setTimeout(validatePinCode, 200);
      }
    }
  }

  function removePinDigit() {
    if (currentPin.length > 0) {
      currentPin = currentPin.slice(0, -1);
      playSoundEffect('tap');
      updatePinDisplay();
      pinErrorMsg.textContent = '';
    }
  }

  function clearPin() {
    currentPin = '';
    updatePinDisplay();
    pinErrorMsg.textContent = '';
  }

  function validatePinCode() {
    if (currentPin === CORRECT_PIN) {
      // SUCCESS!
      isUnlocked = true;
      playSoundEffect('success');
      lockIconBox.classList.add('unlocked');
      lockIcon.className = 'fas fa-lock-open';
      pinErrorMsg.style.color = '#34d399';
      pinErrorMsg.textContent = 'Unlocked with love! 💖✨';

      // Confetti burst
      triggerConfettiBurst();

      setTimeout(() => {
        navigateToScene(3);
      }, 900);
    } else {
      // WRONG PIN
      playSoundEffect('error');
      passwordCard.classList.add('shake-error');
      pinErrorMsg.style.color = '#F7C6E0';
      pinErrorMsg.textContent = 'Oops, try again 💜';

      setTimeout(() => {
        passwordCard.classList.remove('shake-error');
        clearPin();
      }, 650);
    }
  }

  // Keypad clicks
  document.querySelectorAll('.key-btn[data-val]').forEach(btn => {
    btn.addEventListener('click', () => {
      addPinDigit(btn.getAttribute('data-val'));
    });
  });

  const clearBtn = document.getElementById('key-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', removePinDigit);
  }

  const submitKey = document.getElementById('key-submit');
  if (submitKey) {
    submitKey.addEventListener('click', validatePinCode);
  }

  unlockSubmitBtn.addEventListener('click', () => {
    playSoundEffect('tap');
    validatePinCode();
  });

  // Physical keyboard typing listener
  window.addEventListener('keydown', (e) => {
    if (currentSceneIndex !== 2) return;

    if (e.key >= '0' && e.key <= '9') {
      addPinDigit(e.key);
    } else if (e.key === 'Backspace') {
      removePinDigit();
    } else if (e.key === 'Enter') {
      validatePinCode();
    }
  });

  /* =========================================================
     SCENE 3: RASMALAI CAKE & BLOW CANDLE
     ========================================================= */
  const blowCandleBtn = document.getElementById('blow-candle-btn');
  const candleFlame = document.getElementById('candle-flame');
  const flameHalo = document.querySelector('.flame-glow-halo');
  const smokeWisp = document.getElementById('smoke-wisp');
  const blowHint = document.getElementById('blow-hint');
  let candleBlown = false;

  blowCandleBtn.addEventListener('click', () => {
    if (candleBlown) return;
    candleBlown = true;

    playSoundEffect('blow');

    // Extinguish candle flame
    candleFlame.classList.add('blown');
    if (flameHalo) flameHalo.classList.add('blown');
    smokeWisp.classList.add('active');

    blowCandleBtn.textContent = '✨ Wish Made! ✨';
    blowCandleBtn.style.background = 'linear-gradient(135deg, #a7f3d0 0%, #34d399 100%)';
    blowCandleBtn.style.color = '#065f46';
    blowHint.textContent = 'May all your heartfelt wishes blossom into reality! 💜';

    // Celebration effect: multi-angle confetti burst & chimes
    setTimeout(() => {
      playSoundEffect('success');
      triggerCelebrationConfetti();
    }, 200);

    // Auto-advance to Scene 4 after ~3.5s
    setTimeout(() => {
      navigateToScene(4);
    }, 3600);
  });

  function triggerConfettiBurst() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#B497D6', '#F7C6E0', '#E6D9F5', '#5B3A8C', '#ffffff']
      });
    }
  }

  function triggerCelebrationConfetti() {
    if (typeof confetti === 'function') {
      const end = Date.now() + 2000;
      const colors = ['#B497D6', '#F7C6E0', '#ffccd5', '#ffd700', '#ffffff', '#e6d9f5'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }

  /* =========================================================
     SCENE 4: BIRTHDAY WISH & FLOATING BALLOONS
     ========================================================= */
  const continueToLetterBtn = document.getElementById('continue-to-letter-btn');
  const countdownWishNum = document.getElementById('countdown-wish-num');
  const balloonsLayer = document.getElementById('balloons-floating-layer');

  function spawnPastelBalloons() {
    balloonsLayer.innerHTML = '';
    const balloonColors = [
      'radial-gradient(circle at 35% 35%, #F7C6E0, #e8a2c7)',
      'radial-gradient(circle at 35% 35%, #E6D9F5, #B497D6)',
      'radial-gradient(circle at 35% 35%, #fff3b0, #ffd166)',
      'radial-gradient(circle at 35% 35%, #c7ecee, #7ed6df)',
      'radial-gradient(circle at 35% 35%, #e0c3fc, #8ec5fc)'
    ];

    for (let i = 0; i < 14; i++) {
      const balloon = document.createElement('div');
      balloon.className = 'floating-balloon';
      balloon.style.left = `${Math.random() * 95}%`;
      balloon.style.background = balloonColors[Math.floor(Math.random() * balloonColors.length)];
      balloon.style.animationDelay = `${Math.random() * 5}s`;
      balloon.style.animationDuration = `${7 + Math.random() * 4}s`;
      balloonsLayer.appendChild(balloon);
    }
  }

  function startWishCountdown() {
    let timeLeft = 5;
    if (countdownWishNum) countdownWishNum.textContent = timeLeft;

    wishCountdownTimer = setInterval(() => {
      timeLeft--;
      if (countdownWishNum) countdownWishNum.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(wishCountdownTimer);
        wishCountdownTimer = null;
        navigateToScene(5);
      }
    }, 1000);
  }

  continueToLetterBtn.addEventListener('click', () => {
    playSoundEffect('tap');
    if (wishCountdownTimer) {
      clearInterval(wishCountdownTimer);
      wishCountdownTimer = null;
    }
    navigateToScene(5);
  });

  /* =========================================================
     SCENE 5: MEMORIES, LETTER & REPLAY
     ========================================================= */
  const letterParagraphs = document.querySelectorAll('.letter-paragraph');
  const openInvitationBtn = document.getElementById('open-invitation-btn');
  const rsvpBtn = document.getElementById('rsvp-btn');
  const rsvpFeedbackBanner = document.getElementById('rsvp-feedback-banner');
  const replayBtnFinal = document.getElementById('replay-btn-final');

  function revealLetterParagraphs() {
    letterParagraphs.forEach((p, idx) => {
      p.style.opacity = '0';
      p.style.transform = 'translateY(12px)';
      p.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
      setTimeout(() => {
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
      }, 300 + idx * 450);
    });
  }

  if (openInvitationBtn) {
    openInvitationBtn.addEventListener('click', () => {
      playSoundEffect('tap');
      navigateToScene(6);
    });
  }

  /* =========================================================
     SCENE 6: PARK INVITATION & LIVE COUNTDOWN (15 OCT 2026 7:30 PM)
     ========================================================= */
  let countdownInterval = null;

  function startInvitationCountdown() {
    // Target: October 15, 2026, 19:30:00 (7:30 PM)
    const targetDate = new Date(2026, 9, 15, 19, 30, 0).getTime(); // Note: month index 9 = October

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetDate - now;

      const daysEl = document.getElementById('count-days');
      const hoursEl = document.getElementById('count-hours');
      const minsEl = document.getElementById('count-minutes');
      const secsEl = document.getElementById('count-seconds');

      if (distance < 0) {
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  if (rsvpBtn) {
    rsvpBtn.addEventListener('click', () => {
      playSoundEffect('success');
      triggerCelebrationConfetti();
      rsvpBtn.innerHTML = '<i class="fas fa-heart"></i> See You There! 💜';
      rsvpBtn.style.background = 'linear-gradient(135deg, #a7f3d0 0%, #34d399 100%)';
      rsvpBtn.style.color = '#065f46';
      if (rsvpFeedbackBanner) {
        rsvpFeedbackBanner.classList.add('active');
      }
    });
  }

  function resetAllScenes() {
    candleBlown = false;
    candleFlame.classList.remove('blown');
    if (flameHalo) flameHalo.classList.remove('blown');
    smokeWisp.classList.remove('active');
    blowCandleBtn.textContent = 'Blow the candle 🕯️💨';
    blowCandleBtn.style.background = '';
    blowCandleBtn.style.color = '';
    blowHint.textContent = 'Click or tap to make your birthday wish come true ✨';

    clearPin();
    lockIconBox.classList.remove('unlocked');
    lockIcon.className = 'fas fa-lock';

    if (countdownInterval) clearInterval(countdownInterval);

    if (rsvpBtn) {
      rsvpBtn.innerHTML = '<i class="fas fa-check-circle"></i> I\'ll Be There! 💜';
      rsvpBtn.style.background = '';
      rsvpBtn.style.color = '';
    }
    if (rsvpFeedbackBanner) {
      rsvpFeedbackBanner.classList.remove('active');
    }

    navigateToScene(1);
    tapOverlay.classList.remove('hidden');
    introTitleBox.classList.remove('visible');
    treeAnimationComplete = false;
  }

  if (replayBtnFinal) {
    replayBtnFinal.addEventListener('click', () => {
      playSoundEffect('tap');
      resetAllScenes();
    });
  }

  /* =========================================================
     LIGHTBOX FOR PHOTO PREVIEWS
     ========================================================= */
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');

  document.querySelectorAll('.zoomable-photo').forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-img');
      if (src) {
        playSoundEffect('tap');
        lightboxImage.src = src;
        lightboxModal.classList.add('active');
        lightboxModal.setAttribute('aria-hidden', 'false');
      }
    });
  });

  function closeLightbox() {
    lightboxModal.classList.remove('active');
    lightboxModal.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
  }

  lightboxCloseBtn.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);

  /* =========================================================
     AMBIENT STARS CANVAS BACKGROUND
     ========================================================= */
  const ambientCanvas = document.getElementById('ambient-canvas');
  const ambientCtx = ambientCanvas.getContext('2d');
  let ambientStars = [];

  function resizeAmbientCanvas() {
    ambientCanvas.width = window.innerWidth;
    ambientCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeAmbientCanvas);
  resizeAmbientCanvas();

  class AmbientStar {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * ambientCanvas.width;
      this.y = Math.random() * ambientCanvas.height;
      this.size = Math.random() * 2.2 + 0.8;
      this.alpha = Math.random() * 0.8 + 0.2;
      this.speed = Math.random() * 0.015 + 0.005;
      this.color = Math.random() > 0.5 ? '#E6D9F5' : '#F7C6E0';
    }
    update() {
      this.alpha += this.speed;
      if (this.alpha > 0.95 || this.alpha < 0.15) {
        this.speed = -this.speed;
      }
    }
    draw() {
      ambientCtx.save();
      ambientCtx.globalAlpha = Math.abs(this.alpha);
      ambientCtx.fillStyle = this.color;
      ambientCtx.beginPath();
      ambientCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ambientCtx.fill();
      ambientCtx.restore();
    }
  }

  for (let i = 0; i < 65; i++) {
    ambientStars.push(new AmbientStar());
  }

  function renderAmbient() {
    ambientCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
    ambientStars.forEach(star => {
      star.update();
      star.draw();
    });
    requestAnimationFrame(renderAmbient);
  }
  renderAmbient();

  /* =========================================================
     MOUSE / TOUCH TRAIL: PURPLE HEARTS & SPARKLES
     ========================================================= */
  let lastParticleTime = 0;
  function spawnCursorParticle(x, y) {
    const now = Date.now();
    if (now - lastParticleTime < 50) return;
    lastParticleTime = now;

    const particle = document.createElement('div');
    particle.className = 'cursor-particle';
    particle.innerHTML = ['💜', '✨', '🌸', '⭐', '💕'][Math.floor(Math.random() * 5)];
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    const dx = (Math.random() - 0.5) * 50;
    const dy = (Math.random() - 0.8) * 50;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 750);
  }

  window.addEventListener('mousemove', (e) => spawnCursorParticle(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      spawnCursorParticle(e.touches[0].clientX, e.touches[0].clientY);
    }
  });

});
