
// Finalized game.js logic to fix rendering, peg layout, and gameplay
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const bgMusic = document.getElementById("bgMusic");
const message = document.getElementById("message");
const sizzle = document.getElementById("sizzleSound");

const engine = Matter.Engine.create();
const world = engine.world;
engine.gravity.y = 1;

const render = Matter.Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: 800,
    height: 1000,
    wireframes: false,
    background: 'transparent'
  }
});

Matter.Render.run(render);
Matter.Runner.run(Matter.Runner.create(), engine);

let dropsLeft = 3;
let totalScore = 0;
let highScore = localStorage.getItem("dankPlinkoHighScore") || 0;

const scoreDisplay = document.createElement("div");
scoreDisplay.style.position = "absolute";
scoreDisplay.style.top = "20px";
scoreDisplay.style.right = "20px";
scoreDisplay.style.background = "rgba(0,0,0,0.7)";
scoreDisplay.style.color = "#0f0";
scoreDisplay.style.padding = "10px 15px";
scoreDisplay.style.fontSize = "1.2em";
scoreDisplay.style.borderRadius = "10px";
scoreDisplay.style.zIndex = 3;
document.body.appendChild(scoreDisplay);

function updateScoreUI() {
  scoreDisplay.textContent = `Score: ${totalScore}M | High: ${highScore}M | Chips Left: ${dropsLeft}`;
}

const replayBtn = document.createElement("button");
replayBtn.textContent = "Play Again";
replayBtn.style.position = "absolute";
replayBtn.style.top = "80px";
replayBtn.style.left = "50%";
replayBtn.style.transform = "translateX(-50%)";
replayBtn.style.padding = "10px 20px";
replayBtn.style.fontSize = "1.2em";
replayBtn.style.display = "none";
replayBtn.style.zIndex = 3;
document.body.appendChild(replayBtn);
replayBtn.addEventListener("click", () => window.location.reload());

const wallOpts = { isStatic: true, render: { visible: false } };
Matter.World.add(world, [
  Matter.Bodies.rectangle(400, 1000, 800, 40, wallOpts),
  Matter.Bodies.rectangle(0, 500, 40, 1000, wallOpts),
  Matter.Bodies.rectangle(800, 500, 40, 1000, wallOpts),
]);

// Adjusted peg spacing across board
const boardLeft = 60;
const boardRight = 740;
const columns = 9;
const rows = 9;
const spacingX = (boardRight - boardLeft) / (columns - 1);

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < columns; c++) {
    const offsetX = (r % 2) * (spacingX / 2);
    let x = boardLeft + c * spacingX + offsetX;
    let y = 150 + r * 80;
    let peg = Matter.Bodies.circle(x, y, 10, {
      isStatic: true,
      restitution: 0.8,
      render: { visible: false }
    });
    Matter.World.add(world, peg);
  }
}

function dropChip(x) {
  if (dropsLeft <= 0) return;
  dropsLeft--;
  if (bgMusic.paused) bgMusic.play().catch(() => {});

  const chip = Matter.Bodies.circle(x, 30, 20, {
    restitution: 0.9,
    label: "chip",
    render: {
      sprite: {
        texture: "chip.png",
        xScale: 0.1,
        yScale: 0.1
      }
    }
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
    message.textContent = `${result} | Total Score: ${totalScore}M\nGame Over! High Score: ${highScore}M`;
    replayBtn.style.display = "block";
  } else {
    message.textContent = `${result} | Total Score: ${totalScore}M`;
  }
  updateScoreUI();
}

Matter.Events.on(engine, "collisionStart", function(event) {
  event.pairs.forEach(pair => {
    const chip = [pair.bodyA, pair.bodyB].find(b => b.label === "chip");
    const floor = [pair.bodyA, pair.bodyB].find(b => b.position.y > 950);
    if (chip && floor) {
      const x = chip.position.x;
      let result = "";
      let points = 0;

      if (x < 160 || x > 640) {
        result = "You won 10M GP!";
        points = 10;
      } else if (x > 320 && x < 480) {
        result = "You won 50M GP!";
        points = 50;
      } else {
        result = "Damn, you burned a chip!";
        points = 0;
      }

      updateScore(result, points);
    }
  });
});
