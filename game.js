(() => {
  const {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Composite,
    Events,
    Vector
  } = Matter;

  const stage = document.getElementById("gameRoot");
  const heightValue = document.getElementById("heightValue");
  const nextPreview = document.getElementById("nextPreview");
  const pauseBtn = document.getElementById("pauseBtn");
  const musicBtn = document.getElementById("musicBtn");
  const restartBtn = document.getElementById("restartBtn");
  const playAgainBtn = document.getElementById("playAgain");
  const overlay = document.getElementById("overlay");
  const fireworksCanvas = document.getElementById("fireworksCanvas");
  const targetRow = stage.querySelector(".target-row");
  const targetLabel = targetRow.querySelector("p");
  const resultTitle = document.getElementById("resultTitle");
  const finalHeight = document.getElementById("finalHeight");

  const WIDTH = 480;
  const HEIGHT = 680;
  const GROUND_Y = HEIGHT - 64;
  const MAX_PLACE_Y = Math.round(HEIGHT * 0.56);
  const LEVELS = {
    1: { targetRatio: 0.6, targetTopPercent: 60 },
    2: { targetRatio: 0.52, targetTopPercent: 52 },
    3: { targetRatio: 0.44, targetTopPercent: 44 }
  };

  const engine = Engine.create({
    gravity: { x: 0, y: 1.05 },
    positionIterations: 10,
    velocityIterations: 8
  });

  const render = Render.create({
    element: stage,
    engine,
    options: {
      width: WIDTH,
      height: HEIGHT,
      wireframes: false,
      background: "#f8fbff",
      pixelRatio: window.devicePixelRatio || 1
    }
  });

  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);

  const ground = Bodies.rectangle(WIDTH / 2, GROUND_Y, 400, 24, {
    isStatic: true,
    friction: 0.98,
    frictionStatic: 1,
    restitution: 0.05,
    chamfer: { radius: 10 },
    render: { fillStyle: "#a8afb9" }
  });

  World.add(engine.world, ground);

  const ASSET_META = {
    boxBlue: { texture: "assets/box-blue.svg", width: 164, height: 237 },
    boxGreen: { texture: "assets/box-green.svg", width: 281, height: 211 },
    boxOrange: { texture: "assets/box-orange.svg", width: 178, height: 239 },
    boxRed: { texture: "assets/box-red.svg", width: 98, height: 309 },
    eggSoftBlue: { texture: "assets/egg-softblue.svg", width: 92, height: 107 },
    eggGreen: { texture: "assets/egg-green.svg", width: 114, height: 116 },
    eggPink: { texture: "assets/egg-pink.svg", width: 114, height: 116 },
    bird: { texture: "assets/chocolate-bird.svg", width: 87, height: 94 },
    rabbit: { texture: "assets/chocolate-rabbit.svg", width: 115, height: 165 }
  };
  const SIZE_UP = 1.34;
  const HITBOX_SCALE = 0.98;
  const SPRITE_FILL_SCALE = 0.88;

  const pieceCatalog = [
    {
      kind: "boxBlue",
      weight: 6,
      preview: ASSET_META.boxBlue.texture,
      maker: (x, y) => makeSpriteRect(x, y, 66 * SIZE_UP, 96 * SIZE_UP, ASSET_META.boxBlue, 0.98, 0.06, 0.0022, 1.12)
    },
    {
      kind: "boxGreen",
      weight: 6,
      preview: ASSET_META.boxGreen.texture,
      maker: (x, y) => makeSpriteRect(x, y, 110 * SIZE_UP, 84 * SIZE_UP, ASSET_META.boxGreen, 0.98, 0.05, 0.0021, 1.14)
    },
    {
      kind: "boxOrange",
      weight: 6,
      preview: ASSET_META.boxOrange.texture,
      maker: (x, y) => makeSpriteRect(x, y, 72 * SIZE_UP, 96 * SIZE_UP, ASSET_META.boxOrange, 0.97, 0.05, 0.00215, 1.12)
    },
    {
      kind: "boxRed",
      weight: 6,
      preview: ASSET_META.boxRed.texture,
      maker: (x, y) => makeSpriteRect(x, y, 38 * SIZE_UP, 120 * SIZE_UP, ASSET_META.boxRed, 0.99, 0.04, 0.0023, 1.16)
    },
    {
      kind: "eggSoftBlue",
      weight: 1,
      preview: ASSET_META.eggSoftBlue.texture,
      maker: (x, y) => makeSpriteEllipse(x, y, 25 * SIZE_UP, 29 * SIZE_UP, ASSET_META.eggSoftBlue, 0.9, 0.22, 0.0018, 1.1)
    },
    {
      kind: "eggGreen",
      weight: 1,
      preview: ASSET_META.eggGreen.texture,
      maker: (x, y) => makeSpriteEllipse(x, y, 28 * SIZE_UP, 30 * SIZE_UP, ASSET_META.eggGreen, 0.9, 0.2, 0.00185, 1.1)
    },
    {
      kind: "eggPink",
      weight: 1,
      preview: ASSET_META.eggPink.texture,
      maker: (x, y) => makeSpriteEllipse(x, y, 28 * SIZE_UP, 30 * SIZE_UP, ASSET_META.eggPink, 0.9, 0.2, 0.00185, 1.1)
    },
    {
      kind: "chocoBird",
      weight: 1,
      preview: ASSET_META.bird.texture,
      maker: (x, y) => makeSpriteCircle(x, y, 25 * SIZE_UP, ASSET_META.bird, 0.92, 0.16, 0.00195, 1.08)
    },
    {
      kind: "chocoRabbit",
      weight: 1,
      preview: ASSET_META.rabbit.texture,
      maker: (x, y) => makeSpriteRect(x, y, 52 * SIZE_UP, 74 * SIZE_UP, ASSET_META.rabbit, 0.94, 0.13, 0.002, 1.1)
    }
  ];

  let currentPiece = null;
  let droppedBodies = [];
  let pending = randomPiece();
  let paused = false;
  let gameEnded = false;
  let pointer = null;
  let spawnTimer = null;
  let towerTopY = GROUND_Y;
  let stableFrames = 0;
  const WIN_SETTLE_MS = 900;
  let currentLevel = 1;
  let currentTargetY = HEIGHT * LEVELS[1].targetRatio;
  let roundResult = null;
  const fireworksCtx = fireworksCanvas.getContext("2d");
  const fireworks = [];
  let fireworksAnimId = null;
  let fireworksSpawnTimer = null;
  let audioCtx = null;
  let bgmTimer = null;
  let bgmStep = 0;
  let musicOn = true;

  setupInputs();
  applyLevel(1);
  spawnPiece();
  updateNextPanel();

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    runner.enabled = !paused;
    pauseBtn.textContent = paused ? "▶" : "II";
  });
  musicBtn.addEventListener("click", toggleMusic);

  restartBtn.addEventListener("click", () => resetGame(1));
  playAgainBtn.addEventListener("click", onOverlayAction);
  window.addEventListener("resize", () => {
    if (fireworksAnimId) resizeFireworksCanvas();
  });

  Events.on(engine, "beforeUpdate", () => {
    if (paused || gameEnded) return;

    if (currentPiece && currentPiece.rotating && !currentPiece.dragging) {
      const next = currentPiece.body.angle + currentPiece.spin;
      Body.setAngle(currentPiece.body, next);
    }

    updateHeight();
    if (checkWinCondition()) return;
    checkEndCondition();
  });

  function setupInputs() {
    const canvas = render.canvas;

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
  }

  function pointerToWorld(evt) {
    const rect = render.canvas.getBoundingClientRect();
    const x = ((evt.clientX - rect.left) / rect.width) * WIDTH;
    const y = ((evt.clientY - rect.top) / rect.height) * HEIGHT;
    return { x, y };
  }

  function onPointerDown(evt) {
    ensureMusicStarted();
    if (gameEnded || paused || !currentPiece) return;

    const pos = pointerToWorld(evt);
    pointer = {
      id: evt.pointerId,
      start: pos,
      prev: pos,
      dragging: false,
      downAt: performance.now()
    };

    render.canvas.setPointerCapture(evt.pointerId);
  }

  function onPointerMove(evt) {
    if (!pointer || pointer.id !== evt.pointerId || !currentPiece || gameEnded || paused) return;
    if (evt.pointerType === "mouse" && (evt.buttons & 1) !== 1) return;

    const pos = pointerToWorld(evt);
    const moved = Vector.magnitude(Vector.sub(pos, pointer.start));

    if (moved > 8) {
      pointer.dragging = true;
      currentPiece.dragging = true;
      currentPiece.rotating = false;

      const clampedX = clamp(pos.x, 70, WIDTH - 70);
      const clampedY = clamp(pos.y, 70, MAX_PLACE_Y);
      Body.setPosition(currentPiece.body, { x: clampedX, y: clampedY });
      Body.setVelocity(currentPiece.body, { x: 0, y: 0 });
      Body.setAngularVelocity(currentPiece.body, 0);
    }

    pointer.prev = pos;
  }

  function onPointerUp(evt) {
    if (!pointer || pointer.id !== evt.pointerId || !currentPiece || gameEnded || paused) return;

    const piece = currentPiece;
    const tapTime = performance.now() - pointer.downAt;

    if (!pointer.dragging && tapTime < 220) {
      piece.rotating = !piece.rotating;
    } else {
      dropCurrentPiece();
    }

    if (piece === currentPiece) {
      piece.dragging = false;
    }
    pointer = null;
  }

  function dropCurrentPiece() {
    if (!currentPiece) return;

    const body = currentPiece.body;
    body.plugin = body.plugin || {};
    body.plugin.droppedAt = performance.now();
    body.collisionFilter.mask = 0xFFFFFFFF;
    Body.setStatic(body, false);
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);

    droppedBodies.push(body);
    currentPiece = null;

    if (spawnTimer) clearTimeout(spawnTimer);
    spawnTimer = setTimeout(() => {
      if (!gameEnded) spawnPiece();
      spawnTimer = null;
    }, 600);
  }

  function spawnPiece() {
    if (currentPiece || gameEnded) return;

    const descriptor = pending;
    const next = randomPiece();
    pending = next;
    updateNextPanel();

    const spawnPos = { x: WIDTH / 2, y: 96 };
    const body = descriptor.maker(spawnPos.x, spawnPos.y);

    Body.setStatic(body, true);
    body.collisionFilter.mask = 0;

    World.add(engine.world, body);

    currentPiece = {
      descriptor,
      body,
      rotating: true,
      spin: (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.01),
      dragging: false
    };
  }

  function randomPiece() {
    let totalWeight = 0;
    for (const p of pieceCatalog) totalWeight += p.weight ?? 1;

    let roll = Math.random() * totalWeight;
    for (const p of pieceCatalog) {
      roll -= p.weight ?? 1;
      if (roll <= 0) return p;
    }
    return pieceCatalog[pieceCatalog.length - 1];
  }

  function updateNextPanel() {
    nextPreview.innerHTML = `<img src="${pending.preview}" alt="${pending.kind}" />`;
  }

  function updateHeight() {
    if (!droppedBodies.length) {
      towerTopY = GROUND_Y;
      heightValue.textContent = "0.0 m";
      return;
    }

    let minY = GROUND_Y;
    for (const body of droppedBodies) {
      if (!body || !body.bounds) continue;
      minY = Math.min(minY, body.bounds.min.y);
    }

    towerTopY = minY;
    const px = Math.max(0, GROUND_Y - minY);
    const meters = px / 28;
    heightValue.textContent = `${meters.toFixed(1)} m`;
  }

  function checkWinCondition() {
    if (!droppedBodies.length) return false;
    if (!isTowerStable()) {
      stableFrames = 0;
      return false;
    }
    stableFrames += 1;
    if (stableFrames < 20) return false;
    if (towerTopY <= currentTargetY) {
      endRound("win");
      return true;
    }
    return false;
  }

  function isTowerStable() {
    const now = performance.now();
    for (const body of droppedBodies) {
      if (!body || body.isStatic) continue;
      const droppedAt = body.plugin?.droppedAt ?? 0;
      if (now - droppedAt < WIN_SETTLE_MS) return false;
      if (body.speed > 0.22) return false;
      if (Math.abs(body.angularVelocity) > 0.02) return false;
    }
    return true;
  }

  function checkEndCondition() {
    for (const body of droppedBodies) {
      if (!body || body.isStatic) continue;
      if (body.position.y > HEIGHT + 130 || body.position.x < -150 || body.position.x > WIDTH + 150) {
        endRound("lose");
        return;
      }
    }
  }

  function endRound(result) {
    if (gameEnded) return;

    gameEnded = true;
    paused = true;
    runner.enabled = false;
    if (spawnTimer) {
      clearTimeout(spawnTimer);
      spawnTimer = null;
    }
    roundResult = result;
    if (result === "win") {
      if (currentLevel < 3) {
        resultTitle.textContent = `Level ${currentLevel} Complete!`;
        finalHeight.textContent = `Height: ${heightValue.textContent} · Next: Level ${currentLevel + 1}`;
        playAgainBtn.textContent = "Next Level";
      } else {
        resultTitle.textContent = "You Win!";
        finalHeight.textContent = `Height: ${heightValue.textContent}`;
        playAgainBtn.textContent = "Play Again";
      }
    } else {
      resultTitle.textContent = "Game Over";
      finalHeight.textContent = `Height: ${heightValue.textContent} · Level ${currentLevel}`;
      playAgainBtn.textContent = "Try Again";
    }
    stage.classList.add("result-open");
    overlay.classList.remove("hidden");
    if (result === "win") {
      startFireworks();
    } else {
      stopFireworks();
    }
  }

  function onOverlayAction() {
    if (roundResult === "win" && currentLevel < 3) {
      resetGame(currentLevel + 1);
      return;
    }
    if (roundResult === "lose") {
      resetGame(currentLevel);
      return;
    }
    resetGame(1);
  }

  function resetGame(level = currentLevel) {
    overlay.classList.add("hidden");
    stage.classList.remove("result-open");
    stopFireworks();
    gameEnded = false;
    roundResult = null;
    paused = false;
    runner.enabled = true;
    pauseBtn.textContent = "II";
    playAgainBtn.textContent = "Play Again";
    pointer = null;
    applyLevel(level);
    if (spawnTimer) {
      clearTimeout(spawnTimer);
      spawnTimer = null;
    }

    // Ensure no previous round bodies remain in the physics world.
    for (const b of Composite.allBodies(engine.world)) {
      if (b.id !== ground.id) Composite.remove(engine.world, b);
    }
    droppedBodies = [];
    towerTopY = GROUND_Y;
    stableFrames = 0;

    currentPiece = null;

    pending = randomPiece();
    updateNextPanel();
    spawnPiece();
    updateHeight();
  }

  function applyLevel(level) {
    currentLevel = clamp(Math.round(level), 1, 3);
    const cfg = LEVELS[currentLevel];
    currentTargetY = HEIGHT * cfg.targetRatio;
    targetRow.style.top = `${cfg.targetTopPercent}%`;
    targetLabel.textContent = `TARGET · LV ${currentLevel}`;
  }

  function ensureMusicStarted() {
    if (!musicOn) return;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    if (!bgmTimer) {
      bgmStep = 0;
      playBgmStep();
      bgmTimer = setInterval(playBgmStep, 420);
    }
  }

  function toggleMusic() {
    musicOn = !musicOn;
    musicBtn.textContent = musicOn ? "♪" : "🔇";
    if (musicOn) {
      ensureMusicStarted();
    } else {
      if (bgmTimer) {
        clearInterval(bgmTimer);
        bgmTimer = null;
      }
    }
  }

  function playBgmStep() {
    if (!audioCtx || audioCtx.state !== "running") return;
    const melody = [392, 440, 523.25, 440, 392, 349.23, 329.63, 349.23];
    const freq = melody[bgmStep % melody.length];
    bgmStep += 1;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const pad = audioCtx.createOscillator();
    const padGain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    pad.type = "sine";
    pad.frequency.setValueAtTime(freq / 2, now);
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.exponentialRampToValueAtTime(0.02, now + 0.06);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    pad.connect(padGain);
    padGain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
    pad.start(now);
    pad.stop(now + 0.4);
  }

  function resizeFireworksCanvas() {
    const rect = overlay.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    fireworksCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
    fireworksCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
    fireworksCanvas.style.width = `${rect.width}px`;
    fireworksCanvas.style.height = `${rect.height}px`;
    fireworksCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function startFireworks() {
    stopFireworks();
    resizeFireworksCanvas();
    spawnBurst();
    spawnBurst();
    fireworksSpawnTimer = setInterval(spawnBurst, 420);
    let lastTs = performance.now();
    const frame = (ts) => {
      const dt = Math.min(34, ts - lastTs);
      lastTs = ts;
      renderFireworks(dt);
      fireworksAnimId = requestAnimationFrame(frame);
    };
    fireworksAnimId = requestAnimationFrame(frame);
  }

  function stopFireworks() {
    if (fireworksSpawnTimer) {
      clearInterval(fireworksSpawnTimer);
      fireworksSpawnTimer = null;
    }
    if (fireworksAnimId) {
      cancelAnimationFrame(fireworksAnimId);
      fireworksAnimId = null;
    }
    fireworks.length = 0;
    fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  }

  function spawnBurst() {
    const w = fireworksCanvas.clientWidth || 1;
    const h = fireworksCanvas.clientHeight || 1;
    const cx = 28 + Math.random() * (w - 56);
    const cy = 36 + Math.random() * (h * 0.42);
    const palette = ["#ffd166", "#8dd3ff", "#9be7a8", "#f6b0cc", "#c7b5ff", "#ffffff"];
    const count = 34 + Math.floor(Math.random() * 18);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.7 + Math.random() * 2.4;
      fireworks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (0.4 + Math.random() * 0.9),
        life: 520 + Math.random() * 520,
        age: 0,
        size: 1.8 + Math.random() * 2.6,
        color: palette[Math.floor(Math.random() * palette.length)]
      });
    }
  }

  function renderFireworks(dt) {
    const w = fireworksCanvas.clientWidth || 1;
    const h = fireworksCanvas.clientHeight || 1;
    fireworksCtx.clearRect(0, 0, w, h);
    for (let i = fireworks.length - 1; i >= 0; i -= 1) {
      const p = fireworks[i];
      p.age += dt;
      if (p.age >= p.life) {
        fireworks.splice(i, 1);
        continue;
      }
      p.vy += 0.022;
      p.vx *= 0.992;
      p.vy *= 0.992;
      p.x += p.vx * (dt * 0.06);
      p.y += p.vy * (dt * 0.06);
      const alpha = Math.max(0, 1 - p.age / p.life);
      fireworksCtx.globalAlpha = alpha;
      fireworksCtx.fillStyle = p.color;
      fireworksCtx.beginPath();
      fireworksCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fireworksCtx.fill();
    }
    fireworksCtx.globalAlpha = 1;
  }

  function makeSpriteRect(x, y, width, height, asset, friction, restitution, density, spriteScale = 1) {
    const bodyWidth = width * HITBOX_SCALE;
    const bodyHeight = height * HITBOX_SCALE;
    return Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
      chamfer: { radius: 1.5 },
      friction,
      frictionStatic: 1,
      restitution,
      density,
      render: {
        sprite: {
          texture: asset.texture,
          xScale: (width / asset.width) * spriteScale * SPRITE_FILL_SCALE,
          yScale: (height / asset.height) * spriteScale * SPRITE_FILL_SCALE
        }
      }
    });
  }

  function makeSpriteCircle(x, y, radius, asset, friction, restitution, density, spriteScale = 1) {
    const bodyRadius = radius * HITBOX_SCALE;
    return Bodies.circle(x, y, bodyRadius, {
      friction,
      frictionStatic: 1,
      restitution,
      density,
      render: {
        sprite: {
          texture: asset.texture,
          xScale: ((radius * 2) / asset.width) * spriteScale * SPRITE_FILL_SCALE,
          yScale: ((radius * 2) / asset.height) * spriteScale * SPRITE_FILL_SCALE
        }
      }
    });
  }

  function makeSpriteEllipse(x, y, rx, ry, asset, friction, restitution, density, spriteScale = 1) {
    const bodyRx = rx * HITBOX_SCALE;
    const bodyRy = ry * HITBOX_SCALE;
    const verts = [];
    for (let i = 0; i < 22; i += 1) {
      const t = (i / 22) * Math.PI * 2;
      const squash = t < Math.PI ? 1.08 : 0.88;
      verts.push({
        x: x + Math.cos(t) * bodyRx * squash,
        y: y + Math.sin(t) * bodyRy
      });
    }

    return Bodies.fromVertices(x, y, [verts], {
      friction,
      frictionStatic: 1,
      restitution,
      density,
      render: {
        sprite: {
          texture: asset.texture,
          xScale: ((rx * 2.1) / asset.width) * spriteScale * SPRITE_FILL_SCALE,
          yScale: ((ry * 2.1) / asset.height) * spriteScale * SPRITE_FILL_SCALE
        }
      }
    }, true);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
})();
