let pullis = [];
let framework = [];
let spacing = 60;
let lineMarkers = [];
let angleArray = [];
let progressIndex = 0; // Variable to control drawing progress
let animationDone = false; // Flag to check if animation is complete

function setup() {
  createCanvas(windowWidth, windowHeight);
  resetPattern();
}

function draw() {
  //background(255);
  fill(0);

  // Initialize arrays in each frame
  lineMarkers = [];
  angleArray = [];

  if (!animationDone) {
    // Draw only up to progressIndex
    for (let i = 0; i < progressIndex && i < framework.length; i++) {
      drawKolam(i, false);
    }
    for (let i = progressIndex; i >= 0 && i < framework.length; i--) {
      drawKolam(i, true);
    }

    stroke(0);
    strokeWeight(12);
    noFill();

    // Increment progressIndex every 10 frames
    if (frameCount % 10 === 0 && progressIndex < framework.length) {
      progressIndex += 1;
    }

    // Check if animation is complete
    if (progressIndex >= framework.length) {
      animationDone = true;
    }
  } else {
    // Reset the animation once complete to redraw the Kolam
    progressIndex = 0;
    animationDone = false;
    resetPattern();
  }
}

function applyLoopAndStroke(aDiff, r_angle, dot1) {
  if (aDiff === 0) {
    stroke("#BF3604");
    loopAround(dot1, r_angle, PI / 4, (3 * PI) / 4);
  } else if (aDiff === -90 || aDiff === 270) {
    stroke("#BF3604");
    loopAround(dot1, r_angle, PI / 4, (5 * PI) / 4);
  } else if (aDiff === 90 || aDiff === -270) {
    stroke("#BF3604");
    loopAround(dot1, r_angle + PI / 2, PI / 4, (5 * PI) / 4);
  }
}

function drawKolam(i, isReverse) {
  let dot1 = pullis[framework[i].x];
  let dot2 = pullis[framework[i].y];

  let tempX = (dot1.x + dot2.x) / 2;
  let tempY = (dot1.y + dot2.y) / 2;

  lineMarkers.push({ x: tempX, y: tempY });

  // Calculate the angle of the current line
  let r_angle = atan2(dot2.y - dot1.y, dot2.x - dot1.x);

  // Convert angle to degrees and store in the array
  let angleDegrees = degrees(r_angle);
  angleArray.push(angleDegrees);

  let curA = angleDegrees;
  let prevA = angleArray[i - 1] || 0; // If i === 0, use default prevA value
  let aDiff = curA - prevA;

  if (i === 0) {
    drawLineByAngle(angleDegrees, tempX, tempY, spacing, true);
    stroke("#BF3604");
    loopAround(dot1, r_angle, PI / 4, (7 * PI) / 4);
  } else {
    if ((i % 2 === 1 && isReverse === false) || (i % 2 === 0 && isReverse === true)) {
      if (aDiff === 90 || aDiff === -270) {
        drawLineByAngle(angleDegrees, tempX, tempY, spacing);
      } else {
        applyLoopAndStroke(aDiff, r_angle, dot1);
        drawLineByAngle(angleDegrees, tempX, tempY, spacing);
      }
    } else {
      if (aDiff === 90 || aDiff === -270) {
        applyLoopAndStroke(aDiff, r_angle, dot1);
        drawLineByAngle(angleDegrees, tempX, tempY, spacing, true);
      } else if (aDiff === -90 || aDiff === 270) {
        drawLineByAngle(angleDegrees, tempX, tempY, spacing, true);
      } else if (aDiff === 0) {
        applyLoopAndStroke(aDiff, r_angle + PI, dot1);
        drawLineByAngle(angleDegrees, tempX, tempY, spacing, true);
      }
    }
  }

  if (i === framework.length - 1) {
    // Loop around the last dot in the line
    push();
    stroke("#BF3604");
    loopAround(dot2, r_angle, PI + PI / 4, PI + (7 * PI) / 4);
    pop();
  }
}

function drawLineByAngle(angleDegrees, tempX, tempY, spacing, reverse = false) {
  const angle =
    angleDegrees === 90 || angleDegrees === -90
      ? reverse
        ? (3 * PI) / 4
        : PI / 4
      : reverse
      ? PI / 4
      : (3 * PI) / 4;
  drawDiagonalLine(tempX, tempY, spacing * 0.33, angle);
}

function drawDiagonalLine(midX, midY, lineLength, angle) {
  let x1 = midX - cos(angle) * lineLength;
  let y1 = midY - sin(angle) * lineLength;
  let x2 = midX + cos(angle) * lineLength;
  let y2 = midY + sin(angle) * lineLength;
  stroke("#F25C05");
  strokeWeight(12);
  line(x1, y1, x2, y2);
  stroke("#e4c753");
  strokeWeight(3);
  line(x1, y1, x2, y2);
}

function loopAround(dot, theAngle, start, stop) {
  // Draw an arc around the given dot, in the direction of the line segment
  push();
  translate(dot.x, dot.y);
  rotate(theAngle);
  noFill();

  stroke("#F25C05");
  strokeWeight(12);
  
  arc(0, 0, spacing * 0.66, spacing * 0.66, start, stop);
  stroke("#e4c753");
  strokeWeight(3);
  arc(0, 0, spacing * 0.66, spacing * 0.66, start, stop);
  pop();
}

function isAdjacent(dot1, dot2) {
  return (
    (abs(dot1.x - dot2.x) === spacing && dot1.y === dot2.y) ||
    (dot1.x === dot2.x && abs(dot1.y - dot2.y) === spacing)
  );
}

function DFS(dot, visited, lines) {
  visited.add(dot);
  for (let i = 0; i < pullis.length; i++) {
    let adjacentDot = pullis[i];
    if (!visited.has(adjacentDot) && isAdjacent(dot, adjacentDot)) {
      lines.push(createVector(pullis.indexOf(dot), pullis.indexOf(adjacentDot)));
      DFS(adjacentDot, visited, lines);
    }
  }
}

function connectpullis() {
  let startDot = pullis[0]; // Starting dot
  let visitedDots = new Set();
  let lines = [];

  DFS(startDot, visitedDots, lines);

  if (visitedDots.size !== pullis.length) {
    console.log("Not all dots are connected.");
  }

  return lines;
}

function resetPattern() {
  pullis = [];

  // Calculate the number of columns and rows based on window size and spacing
  let columns = floor(windowWidth / spacing);
  let rows = floor(windowHeight / spacing);

  // Adjust canvas size if necessary
  resizeCanvas(columns * spacing, rows * spacing);

  // Generate dots based on calculated columns and rows
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      pullis.push(new Dot(i * spacing + spacing / 2, j * spacing + spacing / 2));
    }
  }

  shuffle(pullis, true);

  framework = connectpullis();
  progressIndex = 0; // Reset progress index
  animationDone = false; // Reset animation flag
}

// function mouseClicked() {
//   resetPattern();
// }

class Dot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
