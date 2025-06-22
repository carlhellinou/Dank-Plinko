
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const engine = Matter.Engine.create();
const world = engine.world;
engine.gravity.y = 1;

const bgMusic = document.getElementById("bgMusic");
const sizzle = document.getElementById("sizzleSound");
const message = document.getElementById("message");

const SHOW_WALLS = false; // For debugging, set to true to see the physical walls


Matter.Runner.run(Matter.Runner.create(), engine);

engine.timing.timeScale = 0.75 // Slow down the simulation a bit for better viewing
engine.gravity.y = 0.75; // Lower gravity so the chips bounce around more gently

// Walls (from red box)
Matter.World.add(world, [
  Matter.Bodies.rectangle(400, 805, 800, 50, { isStatic: true, render: { visible: SHOW_WALLS } }), // Floor
  Matter.Bodies.rectangle(160, 500, 10, 1000, { isStatic: true, render: { visible: SHOW_WALLS }}), // Left wall
  Matter.Bodies.rectangle(642, 500, 10, 1000, { isStatic: true, render: { visible: SHOW_WALLS }})  // Right wall
]);

const rows = [
  { y: 220, offset: 212, space: 63, count: 7 },
  { y: 278, offset: 243, space: 63, count: 6 },
  { y: 338, offset: 212, space: 63, count: 7 },
  { y: 396, offset: 243, space: 63, count: 6 },
  { y: 454, offset: 212, space: 63, count: 7 },
  { y: 512, offset: 243, space: 63, count: 6 },
  { y: 570, offset: 212, space: 63, count: 7 },
  { y: 624, offset: 306, space: 63, count: 4 }
]

// Create pegs in rows
rows.forEach(row => {
  const pegRadius = 6;
  for (let i = 0; i < row.count; i++) {
    const x = row.offset + i * row.space;
    Matter.World.add(world, Matter.Bodies.circle(x, row.y, pegRadius, {
      isStatic: true,
      restitution: 1,
      render: { fillStyle: "blue", visible: SHOW_WALLS }
    }));

    // Add 2 more pegs diagonally below to each side
    Matter.World.add(world, Matter.Bodies.circle(x +6, row.y + 8, pegRadius, {
      isStatic: true,
      restitution: 1,
      render: { fillStyle: "blue", visible: SHOW_WALLS }
    }));
    Matter.World.add(world, Matter.Bodies.circle(x -6, row.y + 8, pegRadius, {
      isStatic: true,
      restitution: 1,
      render: { fillStyle: "blue", visible: SHOW_WALLS }
    }));
  }
});

let slotWallYs = [
  172,
  264,
  356,
  448,
  540,
  632,
]
slotWallYs.forEach(x => {
  Matter.World.add(world, Matter.Bodies.rectangle(x, 750, 8, 100, {
    isStatic: true,
    render: { visible: SHOW_WALLS }
  }));
});

let dropsLeft = 3;
let totalScore = 0;
let highScore = localStorage.getItem("dankPlinkoHighScore") || 0;

const scoreDisplay = document.createElement("div");
scoreDisplay.style.position = "absolute";
scoreDisplay.style.top = "10px";
scoreDisplay.style.right = "10px";
scoreDisplay.style.color = "lime";
scoreDisplay.style.fontSize = "1.2em";
scoreDisplay.style.fontFamily = "monospace";
scoreDisplay.style.zIndex = 3;
document.body.appendChild(scoreDisplay);

function updateScoreUI() {
  scoreDisplay.textContent = `Score: ${totalScore}M | High: ${highScore}M | Chips Left: ${dropsLeft}`;
}
updateScoreUI();

const replayBtn = document.createElement("button");
replayBtn.textContent = "Play Again";
replayBtn.style.position = "absolute";
replayBtn.style.top = "60px";
replayBtn.style.left = "50%";
replayBtn.style.transform = "translateX(-50%)";
replayBtn.style.padding = "10px 20px";
replayBtn.style.fontSize = "1.1em";
replayBtn.style.display = "none";
replayBtn.style.zIndex = 3;
replayBtn.style.backgroundColor = "forestgreen";
replayBtn.style.color = "white";
replayBtn.style.borderRadius = "5em";
replayBtn.style.border = "solid 2px white";
document.body.appendChild(replayBtn);
replayBtn.addEventListener("click", () => window.location.reload());

function dropChip(x) {
  // Check if any chip already exists in the world
  const chips = Matter.Composite.allBodies(world).filter(b => b.label === "chip");
  if (chips.length > 0) {
    // There's already a chip active, do not allow another drop
    printToChatLog("You can only drop one chip at a time!");
    return;
  }

  if (dropsLeft <= 0 || x < 200 || x > 600) return; // orange zone
  dropsLeft--;
  if (bgMusic.paused) bgMusic.play().catch(() => {});
  const chip = Matter.Bodies.circle(x, 50, 14, {
    restitution: 0.85,
    label: "chip",
    render: { 
      fillStyle: "lime", 
      visible: true,
      sprite: {
        texture: "chip.png", // Path to your image
        xScale: 0.06,        // Adjust to fit your chip size
        yScale: 0.06
      }
    }
  });

  // Add small random horizontal velocity to prevent chips from dropping straight down
  const randomXVelocity = (Math.random() - 0.5);
  Matter.Body.setVelocity(chip, { x: randomXVelocity, y: 0 });

  Matter.World.add(world, chip);
  updateScoreUI();
  printToChatLog(`You drop a chip...`);
}

canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  dropChip(x);
});

function updateScore(result, points) {
  totalScore += points;
  if (points === 0) sizzle.play();
  if (dropsLeft === 0) {
    if (totalScore > highScore) {
      highScore = totalScore;
      localStorage.setItem("dankPlinkoHighScore", highScore);
    }
    message.textContent = `${result} | Total: ${totalScore}M\nGame Over! High: ${highScore}M`;
    printToChatLog(result);
    printToChatLog(`Game Over!`);
    printToChatLog(`Final Score: ${totalScore}M`);

    replayBtn.style.display = "block";
  } else {
    message.textContent = `${result} | Total: ${totalScore}M`;
    printToChatLog(result);
  }
  updateScoreUI();
}


const zones = [
  { x: 215, label: "zone-10" },
  { x: 310, label: "burn" },
  { x: 400, label: "zone-50" },
  { x: 494, label: "burn" },
  { x: 586, label: "zone-10" },
];

zones.forEach(({ x, label }) => {
  const zone = Matter.Bodies.rectangle(x, 750, 80, 20, {
    isSensor: true,
    isStatic: true,
    label,
    render: {
      fillStyle: {
        "zone-10": "gold",
        "zone-50": "lime",
        "burn": "red"
      }[label] || "gray",
      opacity: 0.6,
      visible: SHOW_WALLS
    }
  });
  Matter.World.add(world, zone);
});

Matter.Events.on(engine, "collisionStart", function(event) {
  event.pairs.forEach(pair => {
    const chip = [pair.bodyA, pair.bodyB].find(b => b.label === "chip");
    const zone = [pair.bodyA, pair.bodyB].find(b =>
      ["zone-10", "zone-50", "burn"].includes(b.label)
    );
    if (chip && zone) {
      let result = "", points = 0;
      if (zone.label === "zone-10") { result = "You won 10M GP!"; points = 10; }
      else if (zone.label === "zone-50") { result = "You won 50M GP!"; points = 50; }
      else { result = "Damn, you burned a chip!"; points = 0; }

      updateScore(result, points);
      Matter.World.remove(world, chip);
    }
  });
});

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

const leftBumperLow = Matter.Bodies.rectangle(160, 620, 100, 20, {
  isStatic: true,
  angle: degreesToRadians(60),
  render: {
    fillStyle: "white",
    opacity: 0.4,
    visible: SHOW_WALLS
  }
});

const rightBumperLow = Matter.Bodies.rectangle(640, 620, 100, 20, {
  isStatic: true,
  angle: degreesToRadians(-60),
  render: {
    fillStyle: "white",
    opacity: 0.4,
    visible: SHOW_WALLS
  }
});

const leftBumperHigh = Matter.Bodies.rectangle(150, 365, 100, 20, {
  isStatic: true,
  angle: degreesToRadians(60),
  render: {
    fillStyle: "white",
    opacity: 0.4,
    visible: SHOW_WALLS
  }
});

const rightBumperHigh = Matter.Bodies.rectangle(650, 365, 100, 20, {
  isStatic: true,
  angle: degreesToRadians(-60),
  render: {
    fillStyle: "white",
    opacity: 0.4,
    visible: SHOW_WALLS
  }
});

// Add bumpers to the sides to prevent dropping straight down the sides
Matter.World.add(world, [leftBumperLow, rightBumperLow, leftBumperHigh, rightBumperHigh]);


// Actually draw the game
const render = Matter.Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: canvas.width,
    height: canvas.height,
    wireframes: false,
    background: "clear"
  }
});
Matter.Render.run(render);


// Volume slider for music
const savedVolume = localStorage.getItem("bgMusicVolume") ? parseFloat(localStorage.getItem("bgMusicVolume")) : 1;
bgMusic.volume = savedVolume;

const volumeLabel = document.createElement("label");
volumeLabel.textContent = "🎵 Volume";
volumeLabel.htmlFor = "volumeControl";
volumeLabel.style.position = "absolute";
volumeLabel.style.top = "35px";
volumeLabel.style.right = "15px";
volumeLabel.style.color = "white";
volumeLabel.style.fontFamily = "monospace";
volumeLabel.style.zIndex = 3;
document.body.appendChild(volumeLabel);

const volumeSlider = document.createElement("input");
volumeSlider.type = "range";
volumeSlider.min = 0;
volumeSlider.max = 1;
volumeSlider.step = 0.01;
volumeSlider.value = bgMusic.volume; // initial volume

volumeSlider.style.position = "absolute";
volumeSlider.style.top = "50px";
volumeSlider.style.right = "10px";
volumeSlider.style.zIndex = 3;

document.body.appendChild(volumeSlider);

volumeSlider.addEventListener("input", () => {
  bgMusic.volume = parseFloat(volumeSlider.value);
  localStorage.setItem("bgMusicVolume", bgMusic.volume);
});


// Chat log for game messages
const chatLog = document.createElement("div");
chatLog.style.position = "absolute";
chatLog.style.top = "80px";
chatLog.style.right = "10px";
chatLog.style.width = "320px";
chatLog.style.height = "200px";
chatLog.style.overflowY = "auto";
chatLog.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
chatLog.style.color = "lime";
chatLog.style.fontFamily = "monospace";
chatLog.style.fontSize = "1em";
chatLog.style.padding = "10px";
chatLog.style.borderRadius = "5px";
chatLog.style.zIndex = 3;
document.body.appendChild(chatLog);

function printToChatLog(message) {
  const line = document.createElement("div");
  line.textContent = message;
  chatLog.appendChild(line);
  chatLog.scrollTop = chatLog.scrollHeight; // auto-scroll
}

printToChatLog("Welcome to Dank Plinko!");
printToChatLog("Click to drop chips and win big!");
printToChatLog(`You have ${dropsLeft} chips left. Good luck!`);