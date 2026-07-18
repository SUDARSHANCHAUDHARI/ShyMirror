(() => {
  "use strict";

  const scene = document.querySelector("#mirror-scene");
  const realCharacter = document.querySelector("#real-character");
  const realHead = document.querySelector("#real-head");
  const realPupils = document.querySelector("#real-pupils");
  const realMouth = document.querySelector("#real-mouth");
  const reflectionCharacter = document.querySelector("#reflection-character");
  const reflectionHead = document.querySelector("#reflection-head");
  const reflectionPupils = document.querySelector("#reflection-pupils");
  const reflectionMouth = document.querySelector("#reflection-mouth");
  const reflectionBrowLeft = document.querySelector("#reflection-brow-left");
  const reflectionBrowRight = document.querySelector("#reflection-brow-right");
  const replacementCharacter = document.querySelector("#replacement-character");
  const doodles = document.querySelector("#glass-doodles");
  const sparkles = document.querySelector("#sparkles");

  const behaviorStatus = document.querySelector("#behavior-status");
  const interactionCount = document.querySelector("#interaction-count");
  const syncProgress = document.querySelector("#sync-progress");
  const syncCopy = document.querySelector("#sync-copy");
  const activityLog = document.querySelector("#activity-log");
  const surpriseButton = document.querySelector("#surprise-button");
  const soundButton = document.querySelector("#sound-button");
  const soundLabel = soundButton.querySelector(".sound-label");
  const resetButton = document.querySelector("#reset-button");

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const SYNC_INTERVAL = 5;
  const NORMAL_DELAY_MS = 360;
  const LONG_DELAY_MS = 1250;

  const behaviorCatalog = {
    lookAway: {
      status: "The reflection is studying something much more interesting.",
      log: "Looked pointedly in the wrong direction.",
      duration: 2600,
      sound: "peek",
    },
    hide: {
      status: "The reflection is hiding behind the frame.",
      log: "Vanished behind the mirror frame.",
      duration: 2500,
      sound: "hide",
    },
    wave: {
      status: "The reflection is waving. You are not.",
      log: "Waved without asking permission.",
      duration: 2700,
      sound: "wave",
    },
    expression: {
      status: "The reflection has chosen a completely different mood.",
      log: "Tried on a new expression.",
      duration: 2900,
      sound: "mood",
    },
    delay: {
      status: "The reflection is several thoughts behind.",
      log: "Added a very dramatic delay.",
      duration: 3300,
      sound: "delay",
    },
    refuse: {
      status: "The reflection refuses to copy that pose.",
      log: "Countered your pose with a shrug.",
      duration: 3000,
      sound: "nope",
    },
    leave: {
      status: "The reflection has left the mirror. Rude.",
      log: "Walked straight out of view.",
      duration: 3100,
      sound: "leave",
    },
    draw: {
      status: "The reflection is drawing on the glass.",
      log: "Decorated the glass with a firm “NOPE!”",
      duration: 3600,
      sound: "draw",
    },
    turn: {
      status: "The reflection has turned its back on the whole arrangement.",
      log: "Turned around instead of reflecting.",
      duration: 2900,
      sound: "turn",
    },
    replace: {
      status: "That is not your reflection. That is a cat.",
      log: "Sent in an unimpressed understudy.",
      duration: 3400,
      sound: "replace",
    },
  };

  const createCharacterState = () => ({
    lookX: 0,
    lookY: 0,
    headAngle: 0,
    bodyX: 0,
    bodyY: 0,
    bodyAngle: 0,
    expression: "neutral",
  });

  const state = {
    real: createCharacterState(),
    reflection: createCharacterState(),
    pointerTarget: { x: 0, y: 0 },
    sampleQueue: [],
    activeBehavior: null,
    behaviorStartedAt: 0,
    behaviorEndsAt: 0,
    behaviorTimer: 0,
    syncTimer: 0,
    interactions: 0,
    syncProgress: 0,
    syncing: false,
    soundEnabled: true,
    lastMeaningfulPoint: null,
    lastInteractionAt: 0,
    expressionChoice: "frown",
    behaviorBag: [],
    audioContext: null,
    lastFrameAt: performance.now(),
  };

  const lerp = (from, to, amount) => from + (to - from) * amount;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function nextBehavior() {
    if (state.behaviorBag.length === 0) {
      state.behaviorBag = shuffle(Object.keys(behaviorCatalog));
    }
    return state.behaviorBag.pop();
  }

  function ensureAudio(allowUnlock = false) {
    if (!state.soundEnabled) return null;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!state.audioContext) {
      if (!allowUnlock) return null;
      state.audioContext = new AudioContextClass();
    }
    if (state.audioContext.state === "suspended") {
      if (!allowUnlock) return null;
      state.audioContext.resume().catch(() => {});
    }
    return state.audioContext;
  }

  function playNotes(notes, waveform = "sine") {
    const context = ensureAudio();
    if (!context) return;

    const startAt = context.currentTime + 0.015;
    notes.forEach(({ frequency, offset, length, volume = 0.055 }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, startAt + offset);
      gain.gain.setValueAtTime(0.0001, startAt + offset);
      gain.gain.exponentialRampToValueAtTime(volume, startAt + offset + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + length);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt + offset);
      oscillator.stop(startAt + offset + length + 0.03);
    });
  }

  function playSound(type) {
    const motifs = {
      peek: [[470, 0, 0.11], [590, 0.1, 0.1]],
      hide: [[410, 0, 0.1], [300, 0.08, 0.14]],
      wave: [[520, 0, 0.08], [660, 0.09, 0.08], [520, 0.18, 0.08]],
      mood: [[370, 0, 0.13], [550, 0.11, 0.16]],
      delay: [[440, 0, 0.08], [440, 0.18, 0.08], [440, 0.42, 0.08]],
      nope: [[330, 0, 0.11], [247, 0.09, 0.18]],
      leave: [[550, 0, 0.09], [440, 0.08, 0.09], [330, 0.16, 0.15]],
      draw: [[620, 0, 0.07], [690, 0.08, 0.07], [760, 0.16, 0.1]],
      turn: [[480, 0, 0.09], [390, 0.08, 0.13]],
      replace: [[262, 0, 0.1], [392, 0.09, 0.1], [523, 0.18, 0.18]],
      sync: [[392, 0, 0.16], [523, 0.12, 0.16], [659, 0.24, 0.24]],
      reset: [[520, 0, 0.08], [390, 0.08, 0.12]],
    };
    const notes = (motifs[type] || motifs.peek).map(([frequency, offset, length]) => ({
      frequency,
      offset,
      length,
    }));
    playNotes(notes, type === "draw" ? "triangle" : "sine");
  }

  function addLog(message, label = "Now") {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const copy = document.createElement("span");
    time.textContent = label;
    copy.textContent = message;
    item.append(time, copy);
    activityLog.prepend(item);

    while (activityLog.children.length > 3) {
      activityLog.lastElementChild.remove();
    }
  }

  function updateInteractionPanel() {
    interactionCount.textContent = String(state.interactions);
    syncProgress.value = state.syncing ? SYNC_INTERVAL : state.syncProgress;
    syncProgress.textContent = `${state.syncProgress} of ${SYNC_INTERVAL} interactions`;

    if (state.syncing) {
      syncCopy.textContent = "briefly in sync";
    } else {
      const remaining = SYNC_INTERVAL - state.syncProgress;
      syncCopy.textContent = `${remaining} until it behaves`;
    }
  }

  function announce(message) {
    behaviorStatus.textContent = message;
  }

  function recordInteraction(message) {
    const now = performance.now();
    if (now - state.lastInteractionAt < 420) return false;

    state.lastInteractionAt = now;
    state.interactions += 1;
    state.syncProgress += 1;
    addLog(message);

    if (state.syncProgress >= SYNC_INTERVAL) {
      state.syncProgress = 0;
      startSynchronization();
    }

    updateInteractionPanel();
    return true;
  }

  function setExpression(expression) {
    const expressions = {
      neutral: {
        mouth: "M-25-151q25 22 50 0",
        leftBrow: "M-53-220q21-10 38 0",
        rightBrow: "M15-220q21-10 38 0",
      },
      frown: {
        mouth: "M-25-143q25-20 50 0",
        leftBrow: "M-53-214q21-17 38-4",
        rightBrow: "M15-218q21-13 38 4",
      },
      grin: {
        mouth: "M-30-156q30 36 60 0",
        leftBrow: "M-53-224q21-5 38 2",
        rightBrow: "M15-222q21-7 38-2",
      },
      suspicious: {
        mouth: "M-25-150q25 4 50-2",
        leftBrow: "M-53-225q21 3 38 7",
        rightBrow: "M15-214q21-18 38-5",
      },
    };
    const next = expressions[expression] || expressions.neutral;
    reflectionMouth.setAttribute("d", next.mouth);
    reflectionBrowLeft.setAttribute("d", next.leftBrow);
    reflectionBrowRight.setAttribute("d", next.rightBrow);

    if (!reducedMotionQuery.matches && reflectionMouth.animate) {
      const timing = { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" };
      reflectionMouth.animate(
        [
          { opacity: 0.35, transform: "translateY(5px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        timing,
      );
      reflectionBrowLeft.animate(
        [
          { opacity: 0.45, transform: "translateY(4px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        timing,
      );
      reflectionBrowRight.animate(
        [
          { opacity: 0.45, transform: "translateY(4px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        timing,
      );
    }
  }

  function clearBehaviorPresentation() {
    reflectionCharacter.classList.remove(
      "is-waving",
      "is-drawing",
      "is-shrugging",
      "is-turned",
      "is-hiding",
    );
    replacementCharacter.classList.remove("is-visible");
    replacementCharacter.setAttribute("aria-hidden", "true");
    doodles.classList.remove("is-visible");
    setExpression("neutral");
  }

  function endBehavior({ schedule = true } = {}) {
    state.activeBehavior = null;
    state.behaviorStartedAt = 0;
    state.behaviorEndsAt = 0;
    clearBehaviorPresentation();

    if (!state.syncing) {
      announce("The reflection is pretending to behave.");
      if (schedule) scheduleRebellion();
    }
  }

  function scheduleRebellion(delay) {
    window.clearTimeout(state.behaviorTimer);
    if (document.hidden || state.syncing) return;

    const wait = delay ?? (reducedMotionQuery.matches ? 5800 : 3600 + Math.random() * 2600);
    state.behaviorTimer = window.setTimeout(() => startBehavior(nextBehavior()), wait);
  }

  function startBehavior(name, { afterSync = false } = {}) {
    if (state.syncing || !behaviorCatalog[name]) return;

    window.clearTimeout(state.behaviorTimer);
    clearBehaviorPresentation();
    const behavior = behaviorCatalog[name];
    const durationScale = reducedMotionQuery.matches ? 0.7 : 1;
    const now = performance.now();
    state.activeBehavior = name;
    state.behaviorStartedAt = now;
    state.behaviorEndsAt = now + behavior.duration * durationScale;

    if (name === "wave") reflectionCharacter.classList.add("is-waving");
    if (name === "hide") reflectionCharacter.classList.add("is-hiding");
    if (name === "refuse") reflectionCharacter.classList.add("is-shrugging");
    if (name === "turn") reflectionCharacter.classList.add("is-turned");
    if (name === "draw") {
      reflectionCharacter.classList.add("is-drawing");
      doodles.classList.add("is-visible");
    }
    if (name === "replace") {
      replacementCharacter.classList.add("is-visible");
      replacementCharacter.setAttribute("aria-hidden", "false");
    }
    if (name === "expression") {
      const choices = ["frown", "grin", "suspicious"];
      state.expressionChoice = choices[Math.floor(Math.random() * choices.length)];
      setExpression(state.expressionChoice);
    }

    announce(behavior.status);
    addLog(behavior.log, afterSync ? "Again" : "Mirror");
    playSound(behavior.sound);

    state.behaviorTimer = window.setTimeout(
      () => endBehavior(),
      behavior.duration * durationScale,
    );
  }

  function startSynchronization() {
    if (state.syncing) return;

    window.clearTimeout(state.behaviorTimer);
    endBehavior({ schedule: false });
    state.syncing = true;
    sparkles.classList.add("is-visible");
    announce("For one suspicious moment, character and reflection are perfectly in sync.");
    addLog("Matched every move. Briefly.", "Sync");
    playSound("sync");
    updateInteractionPanel();

    const syncDuration = reducedMotionQuery.matches ? 1500 : 2500;
    state.syncTimer = window.setTimeout(() => {
      state.syncing = false;
      sparkles.classList.remove("is-visible");
      updateInteractionPanel();
      startBehavior(nextBehavior(), { afterSync: true });
    }, syncDuration);
  }

  function sampleAtDelay(now, delay) {
    const targetTime = now - delay;
    let sample = state.sampleQueue[0] || state.real;

    for (let index = state.sampleQueue.length - 1; index >= 0; index -= 1) {
      if (state.sampleQueue[index].time <= targetTime) {
        sample = state.sampleQueue[index];
        break;
      }
    }
    return sample;
  }

  function copyToward(target, source, amount) {
    target.lookX = lerp(target.lookX, source.lookX, amount);
    target.lookY = lerp(target.lookY, source.lookY, amount);
    target.headAngle = lerp(target.headAngle, source.headAngle, amount);
    target.bodyX = lerp(target.bodyX, source.bodyX, amount);
    target.bodyY = lerp(target.bodyY, source.bodyY, amount);
    target.bodyAngle = lerp(target.bodyAngle, source.bodyAngle, amount);
  }

  function updateRealCharacter(now) {
    const motionAmount = reducedMotionQuery.matches ? 1 : 0.13;
    const target = state.pointerTarget;
    const real = state.real;
    const idleBob = reducedMotionQuery.matches ? 0 : Math.sin(now / 520) * 1.8;

    real.lookX = lerp(real.lookX, target.x, motionAmount);
    real.lookY = lerp(real.lookY, target.y, motionAmount);
    real.headAngle = lerp(real.headAngle, target.x * 7, motionAmount);
    real.bodyX = lerp(real.bodyX, target.x * 11, motionAmount);
    real.bodyY = lerp(real.bodyY, target.y * 5 + idleBob, motionAmount);
    real.bodyAngle = lerp(real.bodyAngle, target.x * 2.2, motionAmount);

    state.sampleQueue.push({ ...real, time: now });
    while (state.sampleQueue.length > 0 && state.sampleQueue[0].time < now - 2400) {
      state.sampleQueue.shift();
    }
  }

  function updateReflection(now) {
    const reflection = state.reflection;
    const smoothAmount = reducedMotionQuery.matches ? 1 : 0.16;

    if (state.syncing) {
      copyToward(reflection, state.real, reducedMotionQuery.matches ? 1 : 0.32);
      return;
    }

    const delay = state.activeBehavior === "delay" ? LONG_DELAY_MS : NORMAL_DELAY_MS;
    const delayed = sampleAtDelay(now, delay);
    copyToward(reflection, delayed, smoothAmount);

    switch (state.activeBehavior) {
      case "lookAway":
        reflection.lookX = lerp(reflection.lookX, state.real.lookX > 0 ? -1 : 1, 0.2);
        reflection.lookY = lerp(reflection.lookY, -0.6, 0.2);
        reflection.headAngle = lerp(reflection.headAngle, state.real.lookX > 0 ? -10 : 10, 0.15);
        break;
      case "refuse":
        reflection.lookX = lerp(reflection.lookX, -state.real.lookX, 0.2);
        reflection.headAngle = lerp(reflection.headAngle, -state.real.headAngle - 8, 0.18);
        reflection.bodyAngle = lerp(reflection.bodyAngle, -state.real.bodyAngle - 4, 0.18);
        reflection.bodyY = lerp(reflection.bodyY, -8, 0.18);
        break;
      case "turn":
        reflection.headAngle = lerp(reflection.headAngle, 0, 0.2);
        reflection.lookX = 0;
        reflection.lookY = 0;
        break;
      default:
        break;
    }
  }

  function renderCharacter(character, head, pupils, characterState, baseX, baseY, options = {}) {
    const { offsetX = 0, offsetY = 0, opacity = 1 } = options;
    const x = baseX + characterState.bodyX + offsetX;
    const y = baseY + characterState.bodyY + offsetY;
    character.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${characterState.bodyAngle.toFixed(2)})`);
    character.setAttribute("opacity", String(opacity));
    head.setAttribute("transform", `rotate(${characterState.headAngle.toFixed(2)} 0 -194)`);
    pupils.setAttribute(
      "transform",
      `translate(${(characterState.lookX * 8).toFixed(2)} ${(characterState.lookY * 7).toFixed(2)})`,
    );
  }

  function render(now) {
    renderCharacter(realCharacter, realHead, realPupils, state.real, 337, 487);

    let offsetX = 0;
    let offsetY = 0;
    let opacity = 1;
    const behaviorProgress = state.behaviorEndsAt > state.behaviorStartedAt
      ? clamp((now - state.behaviorStartedAt) / (state.behaviorEndsAt - state.behaviorStartedAt), 0, 1)
      : 0;

    if (state.activeBehavior === "hide") {
      offsetX = reducedMotionQuery.matches ? 125 : 188;
      opacity = 0.42;
    }
    if (state.activeBehavior === "leave") {
      const eased = 1 - Math.pow(1 - behaviorProgress, 3);
      offsetX = eased * (reducedMotionQuery.matches ? 250 : 360);
      offsetY = -eased * 42;
      opacity = 1 - clamp((behaviorProgress - 0.55) * 2.2, 0, 1);
    }
    if (state.activeBehavior === "replace") opacity = 0;

    renderCharacter(
      reflectionCharacter,
      reflectionHead,
      reflectionPupils,
      state.reflection,
      886,
      487,
      { offsetX, offsetY, opacity },
    );

    const replacementBob = reducedMotionQuery.matches ? 0 : Math.sin(now / 220) * 3;
    replacementCharacter.setAttribute("transform", `translate(886 ${487 + replacementBob})`);
  }

  function animationFrame(now) {
    updateRealCharacter(now);
    updateReflection(now);
    render(now);
    state.lastFrameAt = now;
    window.requestAnimationFrame(animationFrame);
  }

  function updatePointerTarget(event) {
    const bounds = scene.getBoundingClientRect();
    const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const normalizedY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    state.pointerTarget.x = clamp(normalizedX, -1, 1);
    state.pointerTarget.y = clamp(normalizedY, -1, 1);

    const point = { x: event.clientX, y: event.clientY };
    if (!state.lastMeaningfulPoint) {
      state.lastMeaningfulPoint = point;
      return;
    }

    const distance = Math.hypot(
      point.x - state.lastMeaningfulPoint.x,
      point.y - state.lastMeaningfulPoint.y,
    );
    if (distance > 72 && recordInteraction("You made a deliberate move.")) {
      state.lastMeaningfulPoint = point;
    }
  }

  function nudgeWithKeyboard(event) {
    const changes = {
      ArrowLeft: [-0.22, 0],
      ArrowRight: [0.22, 0],
      ArrowUp: [0, -0.22],
      ArrowDown: [0, 0.22],
    };
    const change = changes[event.key];
    if (!change) return false;

    event.preventDefault();
    ensureAudio(true);
    state.pointerTarget.x = clamp(state.pointerTarget.x + change[0], -1, 1);
    state.pointerTarget.y = clamp(state.pointerTarget.y + change[1], -1, 1);
    recordInteraction(`You nudged the character ${event.key.replace("Arrow", "").toLowerCase()}.`);
    return true;
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    soundButton.setAttribute("aria-pressed", String(state.soundEnabled));
    soundLabel.textContent = state.soundEnabled ? "Sound on" : "Sound off";
    if (state.soundEnabled) {
      ensureAudio(true);
      playSound("peek");
    }
  }

  function resetExperience() {
    ensureAudio(true);
    window.clearTimeout(state.behaviorTimer);
    window.clearTimeout(state.syncTimer);
    state.real = createCharacterState();
    state.reflection = createCharacterState();
    state.pointerTarget = { x: 0, y: 0 };
    state.sampleQueue = [];
    state.activeBehavior = null;
    state.behaviorStartedAt = 0;
    state.behaviorEndsAt = 0;
    state.interactions = 0;
    state.syncProgress = 0;
    state.syncing = false;
    state.lastMeaningfulPoint = null;
    state.lastInteractionAt = 0;
    state.behaviorBag = [];
    sparkles.classList.remove("is-visible");
    clearBehaviorPresentation();
    realMouth.setAttribute("d", "M-25-151q25 22 50 0");
    activityLog.replaceChildren();
    addLog("Everything is back where it started.", "Reset");
    announce("The reflection is pretending to behave.");
    updateInteractionPanel();
    playSound("reset");
    scheduleRebellion(3200);
  }

  scene.addEventListener("pointermove", updatePointerTarget);
  scene.addEventListener("pointerdown", (event) => {
    ensureAudio(true);
    updatePointerTarget(event);
    scene.focus({ preventScroll: true });
    recordInteraction("You tapped the rehearsal room.");
  });

  scene.addEventListener("keydown", (event) => {
    if (nudgeWithKeyboard(event)) return;
    if (event.code === "Space") {
      event.preventDefault();
      ensureAudio(true);
      recordInteraction("You asked the mirror to improvise.");
      startBehavior(nextBehavior());
    }
  });

  surpriseButton.addEventListener("click", () => {
    ensureAudio(true);
    recordInteraction("You asked the mirror to improvise.");
    startBehavior(nextBehavior());
  });
  soundButton.addEventListener("click", toggleSound);
  resetButton.addEventListener("click", resetExperience);

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.matches("button") && (event.key === " " || event.key === "Enter")) return;

    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      toggleSound();
    }
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      resetExperience();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearTimeout(state.behaviorTimer);
    } else if (!state.syncing && !state.activeBehavior) {
      scheduleRebellion(1800);
    }
  });

  reducedMotionQuery.addEventListener?.("change", () => {
    if (!state.syncing && !state.activeBehavior) scheduleRebellion();
  });

  updateInteractionPanel();
  setExpression("neutral");
  scheduleRebellion(3000);
  window.requestAnimationFrame(animationFrame);
})();
