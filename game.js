(() => {
  const {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Query,
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
  const skipLevelBtn = document.getElementById("skipLevelBtn");
  const antiFallBtn = document.getElementById("antiFallBtn");
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
    1: { targetRatio: 0.62 },
    2: { targetRatio: 0.56 },
    3: { targetRatio: 0.5 },
    4: { targetRatio: 0.44 },
    5: { targetRatio: 0.38 },
    6: { targetRatio: 0.32 }
  };
  const MAX_LEVEL = Math.max(...Object.keys(LEVELS).map(Number));

  const engine = Engine.create({
    gravity: { x: 0, y: 1.05 },
    enableSleeping: false,
    positionIterations: 12,
    velocityIterations: 10
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
    friction: 1,
    frictionStatic: 1.5,
    restitution: 0.05,
    chamfer: { radius: 10 },
    render: { fillStyle: "#a8afb9" }
  });
  const groundGuard = Bodies.rectangle(WIDTH / 2, GROUND_Y + 14, 420, 20, {
    isStatic: true,
    friction: 1,
    frictionStatic: 1.5,
    restitution: 0,
    render: { visible: false }
  });

  World.add(engine.world, [ground, groundGuard]);
  let groundWidth = 400;

  const ASSET_META = {
    boxBlue: { texture: "assets/box-blue.svg", width: 164, height: 237 },
    boxGreen: { texture: "assets/box-green.svg", width: 281, height: 211 },
    boxOrange: { texture: "assets/box-orange.svg", width: 178, height: 239 },
    boxRed: { texture: "assets/box-red.svg", width: 98, height: 309 },
    eggSoftBlue: { texture: "assets/egg-softblue.svg", width: 92, height: 107 },
    eggGreen: { texture: "assets/egg-green.svg", width: 114, height: 116 },
    eggPink: { texture: "assets/egg-pink.svg", width: 114, height: 116 },
    bird: { texture: "assets/chocolate-bird.svg", width: 87, height: 94 },
    rabbit: { texture: "assets/chocolate-rabbit-black.png", width: 630, height: 906 },
    chicken: { texture: "assets/chocolate-chicken.png", width: 735, height: 774 },
    chocoEggs: { texture: "assets/chocolate-eggs.png", width: 606, height: 663 },
    rabbitWhite: { texture: "assets/chocolate-rabbit-white.png", width: 630, height: 906 },
    donut: { texture: "assets/donut.png", width: 756, height: 756 }
  };
  const TETROMINO_SHAPES = {
    boxBlue: [[0, 0], [1, 0], [2, 0], [2, 1]],
    boxGreen: [[0, 0], [1, 0], [1, 1], [2, 1]],
    boxOrange: [[0, 0], [1, 0], [2, 0], [1, 1]],
    boxRed: [[0, 0], [0, 1], [0, 2], [0, 3]]
  };
  const SIZE_UP = 1.34;
  const HITBOX_SCALE = 0.98;
  const SPRITE_FILL_SCALE = 0.88;
  const ROLL_RESIST = {
    frictionMul: 1.28,
    frictionStatic: 1.5,
    frictionAirMul: 1.35,
    restitutionMul: 0.82
  };

  const pieceCatalog = [
    {
      kind: "boxBlue",
      weight: 6,
      preview: ASSET_META.boxBlue.texture,
      maker: (x, y) => makeTetrominoSprite(x, y, 34 * SIZE_UP, TETROMINO_SHAPES.boxBlue, ASSET_META.boxBlue, "#2e64d3", 0.98, 0.06, 0.0022, 1.02)
    },
    {
      kind: "boxGreen",
      weight: 6,
      preview: ASSET_META.boxGreen.texture,
      maker: (x, y) => makeTetrominoSprite(x, y, 33 * SIZE_UP, TETROMINO_SHAPES.boxGreen, ASSET_META.boxGreen, "#76cb98", 0.98, 0.05, 0.0021, 1.04)
    },
    {
      kind: "boxOrange",
      weight: 6,
      preview: ASSET_META.boxOrange.texture,
      maker: (x, y) => makeTetrominoSprite(x, y, 33 * SIZE_UP, TETROMINO_SHAPES.boxOrange, ASSET_META.boxOrange, "#f27b1b", 0.97, 0.05, 0.00215, 1.02)
    },
    {
      kind: "boxRed",
      weight: 6,
      preview: ASSET_META.boxRed.texture,
      maker: (x, y) => makeTetrominoSprite(x, y, 31 * SIZE_UP, TETROMINO_SHAPES.boxRed, ASSET_META.boxRed, "#ea484c", 0.99, 0.04, 0.0023, 1.04)
    },
    {
      kind: "eggSoftBlue",
      weight: 2,
      preview: ASSET_META.eggSoftBlue.texture,
      maker: (x, y) => makeSpriteEllipse(x, y, 25 * SIZE_UP, 29 * SIZE_UP, ASSET_META.eggSoftBlue, 0.9, 0.22, 0.0018, 1.1)
    },
    {
      kind: "eggGreen",
      weight: 2,
      preview: ASSET_META.eggGreen.texture,
      maker: (x, y) => makeSpriteEllipse(x, y, 28 * SIZE_UP, 30 * SIZE_UP, ASSET_META.eggGreen, 0.9, 0.2, 0.00185, 1.1)
    },
    {
      kind: "eggPink",
      weight: 2,
      preview: ASSET_META.eggPink.texture,
      maker: (x, y) => makeSpriteEllipse(x, y, 28 * SIZE_UP, 30 * SIZE_UP, ASSET_META.eggPink, 0.9, 0.2, 0.00185, 1.1)
    },
    {
      kind: "chocoBird",
      weight: 2,
      preview: ASSET_META.bird.texture,
      maker: (x, y) => makeSpriteCircle(x, y, 25 * SIZE_UP, ASSET_META.bird, 0.92, 0.16, 0.00195, 1.08)
    },
    {
      kind: "chocoRabbit",
      weight: 1,
      preview: ASSET_META.rabbit.texture,
      maker: (x, y) => makeSpriteRect(x, y, 52 * SIZE_UP, 74 * SIZE_UP, ASSET_META.rabbit, 0.94, 0.13, 0.002, 1.1)
    },
    {
      kind: "chocoChicken",
      weight: 2,
      preview: ASSET_META.chicken.texture,
      maker: (x, y) => makeSpriteCircle(x, y, 27 * SIZE_UP, ASSET_META.chicken, 0.92, 0.16, 0.00195, 1.08)
    },
    {
      kind: "chocoEggs",
      weight: 1,
      availableFrom: 3,
      preview: ASSET_META.chocoEggs.texture,
      maker: (x, y) => makeSpriteEllipse(x, y, 30 * SIZE_UP, 33 * SIZE_UP, ASSET_META.chocoEggs, 0.9, 0.2, 0.00185, 1.1)
    },
    {
      kind: "chocoRabbitWhite",
      weight: 1,
      availableFrom: 3,
      preview: ASSET_META.rabbitWhite.texture,
      maker: (x, y) => makeSpriteRect(x, y, 52 * SIZE_UP, 74 * SIZE_UP, ASSET_META.rabbitWhite, 0.94, 0.13, 0.002, 1.1)
    },
    {
      kind: "donut",
      weight: 1,
      availableFrom: 3,
      preview: ASSET_META.donut.texture,
      maker: (x, y) => makeSpriteCircle(x, y, 28 * SIZE_UP, ASSET_META.donut, 0.9, 0.18, 0.00195, 1.08)
    }
  ];

  let currentLevel = 1;
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
  let currentTargetY = HEIGHT * LEVELS[1].targetRatio;
  let roundResult = null;
  const fireworksCtx = fireworksCanvas.getContext("2d");
  const fireworks = [];
  let fireworksAnimId = null;
  let fireworksSpawnTimer = null;
  let audioCtx = null;
  let musicOn = true;
  const bgmAudio = new Audio("assets/bgm.mp3");
  bgmAudio.loop = true;
  bgmAudio.volume = 0.48;
  bgmAudio.preload = "auto";

  setupInputs();
  applyLevel(1);
  spawnPiece();
  updateNextPanel();

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    runner.enabled = !paused;
    pauseBtn.textContent = paused ? "▶" : "II";
  });
  // Hide tester-only buttons initially
  if (skipLevelBtn) skipLevelBtn.style.display = "none";
  if (antiFallBtn) antiFallBtn.style.display = "none";

  // Reveal tester buttons only when tester performs 30 clicks within 10 seconds
  let testerClicks = 0;
  let testerWindowStart = 0;
  let testerRevealed = false;
  const TESTER_CLICK_TARGET = 30;
  const TESTER_WINDOW_MS = 10000;
  function revealTesterButtons() {
    if (skipLevelBtn) skipLevelBtn.style.display = "inline-block";
    if (antiFallBtn) antiFallBtn.style.display = "inline-block";
    testerRevealed = true;
  }

  musicBtn.addEventListener("click", () => {
    const now = performance.now();
    if (testerRevealed) {
      toggleMusic();
      return;
    }
    if (!testerWindowStart || now - testerWindowStart > TESTER_WINDOW_MS) {
      testerWindowStart = now;
      testerClicks = 1;
    } else {
      testerClicks += 1;
    }

    if (testerClicks >= TESTER_CLICK_TARGET) {
      revealTesterButtons();
    }
    toggleMusic();
  });
  restartBtn.addEventListener("click", () => resetGame(1));
  if (skipLevelBtn) {
    skipLevelBtn.addEventListener("click", () => {
      const next = currentLevel < MAX_LEVEL ? currentLevel + 1 : 1;
      resetGame(next);
    });
  }
  // Anti-fall toggle for testers: prevent objects falling below ground
  let antiFallEnabled = false;
  if (antiFallBtn) {
    antiFallBtn.addEventListener("click", () => {
      antiFallEnabled = !antiFallEnabled;
      antiFallBtn.textContent = antiFallEnabled ? "Anti-Fall: ON" : "Anti-Fall";
      // when disabling, restore any bodies we previously forced static
      if (!antiFallEnabled) {
        for (const b of Composite.allBodies(engine.world)) {
          if (b.plugin && b.plugin.preventedFall) {
            try {
              Body.setStatic(b, false);
              b.plugin.preventedFall = false;
            } catch (e) {}
          }
        }
      }
    });
  }
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
    clampDroppedBodyVelocity();

    // Auto-set dropped bodies to static after 5 seconds
    const now = performance.now();
    const AUTO_STATIC_MS = 5000;
    for (let i = 0; i < droppedBodies.length; i++) {
      const b = droppedBodies[i];
      if (!b) continue;
      const droppedAt = b.plugin?.droppedAt ?? 0;
      if (!droppedAt) continue;
      if (b.plugin?.autoStatic) continue;
      if (now - droppedAt >= AUTO_STATIC_MS) {
        try {
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, 0);
          Body.setStatic(b, true);
          b.plugin.autoStatic = true;
        } catch (e) {
          // ignore
        }
      }
    }

    // If anti-fall enabled, keep bodies from falling below ground
    if (antiFallEnabled) {
      for (const body of Composite.allBodies(engine.world)) {
        if (!body || body === ground || body === groundGuard) continue;
        // skip static bodies
        if (body.isStatic) continue;
        // compute half-height from bounds
        const halfH = ((body.bounds?.max.y ?? body.position.y) - (body.bounds?.min.y ?? body.position.y)) / 2 || 12;
        const minY = GROUND_Y - halfH - 2;
        if (body.position.y > minY) {
          try {
            Body.setPosition(body, { x: body.position.x, y: minY });
            Body.setVelocity(body, { x: 0, y: 0 });
            Body.setAngularVelocity(body, 0);
            Body.setStatic(body, true);
            body.plugin = body.plugin || {};
            body.plugin.preventedFall = true;
          } catch (e) {}
        }
      }
    }

    if (checkWinCondition()) return;
    checkEndCondition();
  });
  Events.on(engine, "collisionStart", onCollisionStart);

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
    body.plugin.dropped = true;
    resolveDropOverlap(body);
    body.collisionFilter.mask = 0xFFFFFFFF;
    Body.setStatic(body, false);
    body.isSleeping = false;
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.04, y: 0.6 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.012);

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
    body.plugin = body.plugin || {};
    body.plugin.gamePiece = true;
    body.plugin.dropped = false;

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
    const pool = getPiecePoolForLevel(currentLevel);
    let totalWeight = 0;
    for (const p of pool) totalWeight += getPieceWeightForLevel(p, currentLevel);

    let roll = Math.random() * totalWeight;
    for (const p of pool) {
      roll -= getPieceWeightForLevel(p, currentLevel);
      if (roll <= 0) return p;
    }
    return pool[pool.length - 1];
  }

  function getPiecePoolForLevel(level) {
    const pool = pieceCatalog.filter((p) => (p.availableFrom ?? 1) <= level);
    return pool.length ? pool : pieceCatalog;
  }

  function getPieceWeightForLevel(piece, level) {
    const base = piece.weight ?? 1;
    const isBlock = piece.kind === "boxBlue" || piece.kind === "boxGreen" || piece.kind === "boxOrange" || piece.kind === "boxRed";
    if (level <= 2 && !isBlock) return base * 0.35;
    return base;
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

    if (spawnTimer) {
      clearTimeout(spawnTimer);
      spawnTimer = null;
    }

    // If final level victory, play explosion animation first
    if (result === "win" && currentLevel >= MAX_LEVEL) {
      // mark as ended to avoid double triggers but keep physics running for explosion
      gameEnded = true;
      roundResult = result;
      doFinalExplosion(() => {
        // after explosion, show overlay and pause
        paused = true;
        runner.enabled = false;
        showEndOverlay(result);
      });
      return;
    }

    // default behavior for other cases
    gameEnded = true;
    paused = true;
    runner.enabled = false;
    roundResult = result;
    showEndOverlay(result);
  }

  function showEndOverlay(result) {
    if (result === "win") {
      if (currentLevel < MAX_LEVEL) {
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

  function doFinalExplosion(doneCb) {
    // Ensure fireworks running
    startFireworks();

    const centerX = WIDTH / 2;
    const centerY = towerTopY || HEIGHT / 2;

    // Create fragments for each dropped body
    const newFragments = [];
    const FRAG_PALETTE = ["#ffd166", "#ffb4a2", "#8dd3ff", "#9be7a8", "#f6b0cc", "#c7b5ff", "#d0d0d0", "#a8afb9", "#f27b1b", "#2e64d3"];
    for (const b of droppedBodies) {
      if (!b) continue;
      try {
        const bounds = b.bounds || { max: { x: b.position.x + 8, y: b.position.y + 8 }, min: { x: b.position.x - 8, y: b.position.y - 8 } };
        const bw = Math.max(12, bounds.max.x - bounds.min.x);
        const bh = Math.max(12, bounds.max.y - bounds.min.y);


        // estimate number of fragments based on area (clamped), doubled again for denser shards
        const area = bw * bh;
        let count = Math.min(72, Math.max(24, Math.round(area / 900) * 4));

        // pick color: sometimes use original, otherwise random from palette
        const baseColor = (b.render && b.render.fillStyle) || null;
        const color = (baseColor && Math.random() < 0.4) ? baseColor : FRAG_PALETTE[Math.floor(Math.random() * FRAG_PALETTE.length)];

        // remove original body
        try { Composite.remove(engine.world, b); } catch (e) {}

        for (let i = 0; i < count; i++) {
          const fx = b.position.x + (Math.random() - 0.5) * bw * 0.8;
          const fy = b.position.y + (Math.random() - 0.5) * bh * 0.8;
          // irregular fragment: random sides and size
          const minSz = 4;
          const maxSz = Math.max(10, Math.round(Math.min(bw, bh) / 3));
          const sz = minSz + Math.random() * (maxSz - minSz);
          const sides = 3 + Math.floor(Math.random() * 5); // 3..7 sides
          const frag = Bodies.polygon(fx, fy, sides, sz / 2, {
            chamfer: { radius: 0.6 },
            friction: 0.9,
            frictionAir: 0.02,
            restitution: 0.2,
            density: Math.max(0.0006, (b.density || 0.001) * 0.5),
            render: { fillStyle: color }
          });
          Body.setAngle(frag, Math.random() * Math.PI * 2);
          // give outward velocity
          const dx = frag.position.x - centerX;
          const dy = frag.position.y - centerY;
          const d = Math.max(8, Math.hypot(dx, dy));
          const nx = dx / d;
          const ny = dy / d;
          const speed = 4 + Math.random() * 5;
          Body.setVelocity(frag, { x: nx * speed + (Math.random() - 0.5) * 2, y: ny * speed - (2 + Math.random() * 3) });
          Body.setAngularVelocity(frag, (Math.random() - 0.5) * 6);
          World.add(engine.world, frag);
          newFragments.push(frag);
        }
      } catch (e) {
        // ignore single body failures
      }
    }

    // Also fragment currentPiece if present
    if (currentPiece && currentPiece.body) {
      const b = currentPiece.body;
      try {
        const bounds = b.bounds || { max: { x: b.position.x + 8, y: b.position.y + 8 }, min: { x: b.position.x - 8, y: b.position.y - 8 } };
        const bw = Math.max(12, bounds.max.x - bounds.min.x);
        const bh = Math.max(12, bounds.max.y - bounds.min.y);
        const area = bw * bh;
        let count = Math.min(72, Math.max(24, Math.round(area / 900) * 4));
        const baseColor = (b.render && b.render.fillStyle) || null;
        const color = (baseColor && Math.random() < 0.4) ? baseColor : FRAG_PALETTE[Math.floor(Math.random() * FRAG_PALETTE.length)];
        try { Composite.remove(engine.world, b); } catch (e) {}
        for (let i = 0; i < count; i++) {
          const fx = b.position.x + (Math.random() - 0.5) * bw * 0.8;
          const fy = b.position.y + (Math.random() - 0.5) * bh * 0.8;
          const minSz = 4;
          const maxSz = Math.max(10, Math.round(Math.min(bw, bh) / 3));
          const sz = minSz + Math.random() * (maxSz - minSz);
          const sides = 3 + Math.floor(Math.random() * 5);
          const frag = Bodies.polygon(fx, fy, sides, sz / 2, {
            chamfer: { radius: 0.6 },
            friction: 0.9,
            frictionAir: 0.02,
            restitution: 0.2,
            density: Math.max(0.0006, (b.density || 0.001) * 0.5),
            render: { fillStyle: color }
          });
          Body.setAngle(frag, Math.random() * Math.PI * 2);
          const dx = frag.position.x - centerX;
          const dy = frag.position.y - centerY;
          const d = Math.max(8, Math.hypot(dx, dy));
          const nx = dx / d;
          const ny = dy / d;
          const speed = 4 + Math.random() * 5;
          Body.setVelocity(frag, { x: nx * speed + (Math.random() - 0.5) * 2, y: ny * speed - (2 + Math.random() * 3) });
          Body.setAngularVelocity(frag, (Math.random() - 0.5) * 6);
          World.add(engine.world, frag);
          newFragments.push(frag);
        }
      } catch (e) {}
    }

    // replace droppedBodies with fragments so later checks operate on them
    droppedBodies = newFragments;

    // let fragments fly for a bit then call done (extended by 2000ms)
    const EXPLODE_MS = 1400 + 2000;
    setTimeout(() => {
      if (typeof doneCb === "function") doneCb();
    }, EXPLODE_MS);
  }

  function onOverlayAction() {
    if (roundResult === "win" && currentLevel < MAX_LEVEL) {
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
      if (b.id !== ground.id && b.id !== groundGuard.id) Composite.remove(engine.world, b);
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
    currentLevel = clamp(Math.round(level), 1, MAX_LEVEL);
    const cfg = LEVELS[currentLevel];
    currentTargetY = HEIGHT * cfg.targetRatio;
    targetRow.style.top = `${cfg.targetRatio * 100}%`;
    targetLabel.textContent = `TARGET · LV ${currentLevel}`;

    const desiredGroundWidth = currentLevel <= 3 ? 400 : currentLevel === 4 ? 360 : currentLevel === 5 ? 340 : 320;
    if (desiredGroundWidth !== groundWidth) {
      Body.scale(ground, desiredGroundWidth / groundWidth, 1);
      Body.scale(groundGuard, desiredGroundWidth / groundWidth, 1);
      groundWidth = desiredGroundWidth;
    }
  }

  function clampDroppedBodyVelocity() {
    for (const body of droppedBodies) {
      if (!body || body.isStatic) continue;
      const maxSpeed = 14;
      if (body.speed > maxSpeed) {
        const dir = Vector.normalise(body.velocity);
        Body.setVelocity(body, Vector.mult(dir, maxSpeed));
      }
      const maxSpin = 0.42;
      if (Math.abs(body.angularVelocity) > maxSpin) {
        Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * maxSpin);
      }
    }
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
    if (bgmAudio.paused) {
      const p = bgmAudio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }

  function toggleMusic() {
    musicOn = !musicOn;
    musicBtn.textContent = musicOn ? "♪" : "🔇";
    if (musicOn) {
      ensureMusicStarted();
    } else {
      bgmAudio.pause();
    }
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

  function onCollisionStart(evt) {
    if (paused || gameEnded || !musicOn) return;
    for (const pair of evt.pairs) {
      const bodyA = pair.bodyA.parent || pair.bodyA;
      const bodyB = pair.bodyB.parent || pair.bodyB;
      if (!bodyA || !bodyB || bodyA === bodyB) continue;

      const droppedA = bodyA.plugin?.gamePiece && bodyA.plugin?.dropped;
      const droppedB = bodyB.plugin?.gamePiece && bodyB.plugin?.dropped;
      if (!droppedA && !droppedB) continue;

      const rel = Vector.sub(bodyA.velocity, bodyB.velocity);
      const impact = Vector.magnitude(rel);
      if (impact < 0.5) continue;

      const triggerBody = droppedA ? bodyA : bodyB;
      const now = performance.now();
      if (now - (triggerBody.plugin.lastSfxAt || 0) < 80) continue;
      triggerBody.plugin.lastSfxAt = now;
      playPopSfx(impact);
    }
  }

  function playPopSfx(impact) {
    ensureMusicStarted();
    if (!audioCtx || audioCtx.state !== "running") return;
    const now = audioCtx.currentTime;
    const loudness = clamp(0.02 + impact * 0.015, 0.02, 0.1);
    const fall = clamp(impact * 38, 18, 70);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520 + impact * 120, now);
    osc.frequency.exponentialRampToValueAtTime(220 + fall, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(loudness, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  function makeSpriteRect(x, y, width, height, asset, friction, restitution, density, spriteScale = 1) {
    const bodyWidth = width * HITBOX_SCALE;
    const bodyHeight = height * HITBOX_SCALE;
    return Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
      chamfer: { radius: 1.5 },
      friction: Math.min(1, friction * ROLL_RESIST.frictionMul),
      frictionStatic: ROLL_RESIST.frictionStatic,
      frictionAir: 0.016 * ROLL_RESIST.frictionAirMul,
      restitution: restitution * ROLL_RESIST.restitutionMul,
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

  function makeTetrominoSprite(x, y, cellSize, cells, _asset, partColor, friction, restitution, density, _spriteScale = 1) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [cx, cy] of cells) {
      minX = Math.min(minX, cx);
      minY = Math.min(minY, cy);
      maxX = Math.max(maxX, cx);
      maxY = Math.max(maxY, cy);
    }

    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;
    const partSize = cellSize * 0.95;
    const parts = cells.map(([cx, cy]) => {
      const ox = ((cx - minX) + 0.5 - cols / 2) * cellSize;
      const oy = ((cy - minY) + 0.5 - rows / 2) * cellSize;
      return Bodies.rectangle(x + ox, y + oy, partSize, partSize, {
        chamfer: { radius: 3 },
        render: { fillStyle: partColor }
      });
    });

    return Body.create({
      parts,
      friction: Math.min(1, friction * ROLL_RESIST.frictionMul),
      frictionStatic: ROLL_RESIST.frictionStatic,
      frictionAir: 0.016 * ROLL_RESIST.frictionAirMul,
      restitution: restitution * ROLL_RESIST.restitutionMul,
      density,
      render: {
        fillStyle: partColor
      }
    });
  }

  function makeSpriteCircle(x, y, radius, asset, friction, restitution, density, spriteScale = 1) {
    const bodyRadius = radius * HITBOX_SCALE;
    return Bodies.circle(x, y, bodyRadius, {
      friction: Math.min(1, friction * ROLL_RESIST.frictionMul),
      frictionStatic: ROLL_RESIST.frictionStatic,
      frictionAir: 0.018 * ROLL_RESIST.frictionAirMul,
      restitution: restitution * ROLL_RESIST.restitutionMul,
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
      friction: Math.min(1, friction * ROLL_RESIST.frictionMul),
      frictionStatic: ROLL_RESIST.frictionStatic,
      frictionAir: 0.02 * ROLL_RESIST.frictionAirMul,
      restitution: restitution * ROLL_RESIST.restitutionMul,
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

  function resolveDropOverlap(body) {
    const obstacles = [ground, groundGuard, ...droppedBodies];
    for (let i = 0; i < 48; i += 1) {
      if (!Query.collides(body, obstacles).length) return;
      Body.setPosition(body, { x: body.position.x, y: body.position.y - 2 });
    }
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
})();
