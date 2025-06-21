
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const engine = Matter.Engine.create();
const world = engine.world;
engine.gravity.y = 1;

const bgMusic = document.getElementById("bgMusic");
const sizzle = document.getElementById("sizzleSound");
const message = document.getElementById("message");

Matter.Runner.run(Matter.Runner.create(), engine);

// Walls (from red box)
Matter.World.add(world, [
  Matter.Bodies.rectangle(400, 1005, 800, 50, { isStatic: true }), // Floor
  Matter.Bodies.rectangle(120, 500, 10, 1000, { isStatic: true }), // Left wall
  Matter.Bodies.rectangle(680, 500, 10, 1000, { isStatic: true })  // Right wall
]);

// Pegs (blue dots)
const pegCoords = [
  [160, 230],[240, 230],[320, 230],[400, 230],[480, 230],[560, 230],[640, 230],
  [200, 290],[280, 290],[360, 290],[440, 290],[520, 290],[600, 290],
  [160, 350],[240, 350],[320, 350],[400, 350],[480, 350],[560, 350],[640, 350],
  [200, 410],[280, 410],[360, 410],[440, 410],[520, 410],[600, 410],
  [160, 470],[240, 470],[320, 470],[400, 470],[480, 470],[560, 470],[640, 470],
  [200, 530],[280, 530],[360, 530],[440, 530],[520, 530],[600, 530]
];
pegCoords.forEach(([x, y]) => {
  Matter.World.add(world, Matter.Bodies.circle(x, y, 8, { isStatic: true, restitution: 1, render: { visible: false } }));
});

// Slot walls (between prize boxes - from purple zones)
[200, 310, 420, 530, 640].forEach(x => {
  Matter.World.add(world, Matter.Bodies.rectangle(x, 960, 8, 100, {
    isStatic: true,
    render: { visible: false }
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
document.body.appendChild(replayBtn);
replayBtn.addEventListener("click", () => window.location.reload());

function dropChip(x) {
  if (dropsLeft <= 0 || x < 260 || x > 540) return; // orange zone
  dropsLeft--;
  if (bgMusic.paused) bgMusic.play().catch(() => {});
  const chip = Matter.Bodies.circle(x, 50, 20, {
    restitution: 0.85,
    label: "chip",
    render: { fillStyle: "lime" }
  });
  Matter.World.add(world, chip);
  updateScoreUI();
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
    replayBtn.style.display = "block";
  } else {
    message.textContent = `${result} | Total: ${totalScore}M`;
  }
  updateScoreUI();
}

Matter.Events.on(engine, "collisionStart", function(event) {
  event.pairs.forEach(pair => {
    const chip = [pair.bodyA, pair.bodyB].find(b => b.label === "chip");
    const floor = [pair.bodyA, pair.bodyB].find(b => b.position.y > 950);
    if (chip && floor) {
      const x = chip.position.x;
      let result = "", points = 0;
      if (x < 250 || x > 590) { result = "You won 10M GP!"; points = 10; }
      else if (x > 365 && x < 435) { result = "You won 50M GP!"; points = 50; }
      else { result = "Damn, you burned a chip!"; points = 0; }
      updateScore(result, points);
      Matter.World.remove(world, chip);
    }
  });
});

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