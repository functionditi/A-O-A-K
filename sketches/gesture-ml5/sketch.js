// -------------- GLOBAL VARS & ARRAYS --------------
// kolam state
let pullis = [], framework = [], capArcs = [], startingPoints = [];
let dfsStack = [], visited = new Set(), lastVector = null;
let spacing = 50;  // spacing between grid dots

// ml5 handpose state (updated)
let video;
let handpose;
let hands = [];

// pinch smoothing
let isPinching = false, pinchX = 0, pinchY = 0;
let pinchCandidateX = 0, pinchCandidateY = 0;
let pinchFrames = 0;
const pinchOnThreshold  = 1;  // frames needed to engage pinch
const pinchOffThreshold = 5;  // frames needed to release pinch
let trackThumb = false;    // becomes true once you’ve pinched to start
let prevThumbIdx = null;
let targetThumbIdx = null;



// graphics layers
let gridLayer, drawingLayer, pointerLayer;
let cols, rows;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // compute grid dimensions
  cols = floor(width  / spacing);
  rows = floor(height / spacing);

  // --- camera + handpose (new) ---
  video = createCapture(VIDEO);
  video.size(640, 400);
  video.hide();
  handpose = ml5.handpose(video, modelReady);
  handpose.on('predict', gotPose);

  // --- layers ---
  gridLayer    = createGraphics(width, height);
  drawingLayer = createGraphics(width, height);
  pointerLayer = createGraphics(width, height);
  gridLayer.clear();
  drawingLayer.clear();
  pointerLayer.clear();

  // --- initialize grid dots (no DFS yet) ---
  makeGrid();
  drawGridDots();
}


  function modelReady() {
  console.log('hand pose loaded');
  window.parent.postMessage({ type: 'handposeReady' }, '*');
}



function gotPose(results) {
  hands = results;
}

function draw() {
  background("#F25C05");
  // composite: camera feed → grid → kolam drawing → overlays
  //image(video, 0, 0);
  image(gridLayer, 0, 0);
  image(drawingLayer, 0, 0);
  
     pointerLayer.clear();
  drawKeypointsOnLayer(pointerLayer);
  detectPinch();

  if (trackThumb && hands.length > 0 && hands[0].landmarks) {
    // 1) snap thumb tip to nearest pulli index
    const t = hands[0].landmarks[4];
    let minD = Infinity, newIdx = 0;
    for (let i = 0; i < pullis.length; i++) {
      const dd = dist(t[0], t[1], pullis[i].x, pullis[i].y);
      if (dd < minD) {
        minD = dd;
        newIdx = i;
      }
    }

    if (newIdx !== targetThumbIdx) {
      targetThumbIdx = newIdx;  // you can add smoothing here if needed
    }
    

    // 2) if we actually moved to a *different* dot this frame…
    if (prevThumbIdx !== null && newIdx !== prevThumbIdx) {

      // 2a) if it’s already visited → ignore
      if (!visited.has(newIdx)) {

        // 2b) if newIdx is adjacent to prevThumbIdx → extend
        if (isAdjacent(pullis[prevThumbIdx], pullis[newIdx])) {
          // compute the exact grid‐vector
          const dx = (pullis[newIdx].x - pullis[prevThumbIdx].x) / spacing;
          const dy = (pullis[newIdx].y - pullis[prevThumbIdx].y) / spacing;

          // straight vs turn?
          if (lastVector && dx === lastVector.dx && dy === lastVector.dy) {
            extendSameDirection();
          } else {
            // update lastVector so extendTurn can use it correctly
            lastVector = { dx, dy };
            extendTurn();
          }

        } else {
          // 2c) moved too far → terminate the current branch
          terminateBranch();
        }

        // finally re‐draw the kolam
        renderPermanentLayer();
      }

      // 3) update our “previous thumb” index
      prevThumbIdx = newIdx;
    }

    // 4) draw the blue circle snapped to prevThumbIdx
    pinchX = pullis[prevThumbIdx].x;
    pinchY = pullis[prevThumbIdx].y;
    // pointerLayer.fill(0, 0, 255);
    // pointerLayer.noStroke();
    // pointerLayer.ellipse(pinchX, pinchY, 10);
  }
  else if (isPinching) {
    // before trackThumb kicks in, still show the initial snapped circle
    // pointerLayer.fill(0, 0, 255);
    // pointerLayer.noStroke();
    // pointerLayer.ellipse(pinchX, pinchY, 80);
  }

  // draw the DFS pointer and composite
  drawPointerOnLayer(pointerLayer);
  image(pointerLayer, 0, 0);
}

// ---------------- KEY HANDLING ----------------
function keyPressed() {
  // only works after you've pinched once
  if (!startingPoints.length) return;

  if (key === '1')      extendSameDirection();
  else if (key === '2') extendTurn();
  else if (key === '0') terminateBranch();

  renderPermanentLayer();
}

// ----------- GRID CREATION -----------
function makeGrid() {
  pullis = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      pullis.push({ x: i * spacing + spacing / 2,
                    y: j * spacing + spacing / 2 });
    }
  }
}

function drawGridDots() {
  gridLayer.clear();
  gridLayer.noStroke();
  gridLayer.fill(0);
  for (let d of pullis) {
    gridLayer.ellipse(d.x, d.y, 5);
  }
}

// ----------- PINCH DETECTION & DFS INIT (with smoothing) -----------
function detectPinch() {
  // if we’re already tracking the thumb, skip all this
  if (trackThumb) return;

  let currentlyPinching = false;
  let nearestIdx = -1;           // ← declare here
  let pinchXcandidate, pinchYcandidate;

  if (hands && hands.length > 0 && hands[0].landmarks) {
    let lm = hands[0].landmarks;
    let t = lm[4], i = lm[8];
    let d = dist(t[0], t[1], i[0], i[1]);
    if (d < 30) {
      currentlyPinching = true;
      let mx = (t[0] + i[0]) / 2;
      let my = (t[1] + i[1]) / 2;

      // find nearest pulli
      let minD = Infinity;
      for (let idx = 0; idx < pullis.length; idx++) {
        let pt = pullis[idx];
        let dd = dist(mx, my, pt.x, pt.y);
        if (dd < minD) {
          minD = dd;
          nearestIdx = idx;
        }
      }
      pinchCandidateX = pullis[nearestIdx].x;
      pinchCandidateY = pullis[nearestIdx].y;

      // first stable pinch: init DFS and start thumb-tracking
      if (!startingPoints.length && pinchFrames + 1 >= pinchOnThreshold) {
        initDFSAt(nearestIdx);
        renderPermanentLayer();
        trackThumb = true;
      }
    }
  }

  // smoothing counter
  if (currentlyPinching) {
    pinchFrames = min(pinchFrames + 1, pinchOnThreshold);
  } else {
    pinchFrames = max(pinchFrames - 1, 0);
  }

  // update stable state
  if (!isPinching && pinchFrames === pinchOnThreshold) {
    isPinching = true;
    pinchX = pinchCandidateX;
    pinchY = pinchCandidateY;
  } else if (isPinching && pinchFrames === 0) {
    isPinching = false;
  }
}



function initDFSAt(startIndex) {
  framework = [];
  capArcs = [];
  visited.clear();
  dfsStack = [];
  lastVector = null;
  startingPoints = [startIndex];
  visited.add(startIndex);
  dfsStack.push(startIndex);
    prevThumbIdx = startIndex;  
}

// ----------- RENDER PERMANENT KOLAM -----------
function renderPermanentLayer() {
  drawingLayer.clear();
  drawingLayer.push();
  let angleArray = [];

  for (let z = 0; z < framework.length; z++) {
    let e = framework[z];
    let d1 = pullis[e.x], d2 = pullis[e.y];
    drawingLayer.noStroke();
    drawingLayer.strokeWeight(1);
    drawingLayer.line(d1.x, d1.y, d2.x, d2.y);

    let mx = (d1.x + d2.x) / 2, my = (d1.y + d2.y) / 2;
    let r = atan2(d2.y - d1.y, d2.x - d1.x);
    let deg = degrees(r);
    angleArray.push(deg);

    if (startingPoints.includes(e.x)) {
      drawLineByAngleOnLayer(drawingLayer, deg, mx, my, spacing, true);
      drawingLayer.stroke("#e6d063");
      loopAroundOnLayer(drawingLayer, d1, r, PI / 4, PI * 7 / 4);
    } else {
      let prev = angleArray[z - 1] || 0, diff = deg - prev;
      if (z % 2 === 1) {
        if (!(diff === 90 || diff === -270))
          applyLoopAndStrokeOnLayer(drawingLayer, diff, r, d1);
        drawLineByAngleOnLayer(drawingLayer, deg, mx, my, spacing);
      } else {
        if (diff === 90 || diff === -270)
          applyLoopAndStrokeOnLayer(drawingLayer, diff, r, d1);
        else if (diff === 0)
          applyLoopAndStrokeOnLayer(drawingLayer, diff, r + PI, d1);
        drawLineByAngleOnLayer(drawingLayer, deg, mx, my, spacing, true);
      }
    }
  }

  for (let a of capArcs) {
    drawingLayer.push();
    drawingLayer.stroke("#e6d063");
    loopAroundOnLayer(drawingLayer, a.dot, a.angle, a.start, a.stop);
    drawingLayer.pop();
  }
  drawingLayer.pop();
}

// ----------- DFS POINTER -----------
function drawPointerOnLayer(layer) {
  if (dfsStack.length > 0) {
    let d = pullis[dfsStack[dfsStack.length - 1]];
    layer.fill(0, 255, 0);
    layer.stroke(0);
    layer.ellipse(d.x, d.y, 10);
  }
}

// ----------- DRAW HAND KEYPOINTS -----------
function drawKeypointsOnLayer(layer) {
  // bail if no hand data
  if (!hands || hands.length === 0 || !hands[0].landmarks) return;


  layer.noFill();
  layer.strokeWeight(2);
  layer.stroke(255);

  const lm = hands[0].landmarks;
  for (let i = 0; i < lm.length; i++) {
    const [x, y] = lm[i];
    layer.ellipse(x, y, 6);
  }
}

// ----------- DFS ACTIONS & HELPERS -----------
// (Your extendSameDirection, extendTurn, terminateBranch, extendRandom, addEdge, findDotByCoord, isAdjacent, and decoration helpers—all unchanged.)

// be sure to paste your original terminateBranch() and other helpers here


// ----------- DFS ACTIONS & HELPERS -----------
function extendSameDirection() {
  if (dfsStack.length === 0 || !lastVector)
    return extendRandom(dfsStack[dfsStack.length - 1]);

  let cur = dfsStack[dfsStack.length - 1];

  // prioritize thumb target if it's adjacent
  if (targetThumbIdx !== null && isAdjacent(pullis[cur], pullis[targetThumbIdx]) && !visited.has(targetThumbIdx)) {
    let dx = (pullis[targetThumbIdx].x - pullis[cur].x) / spacing;
    let dy = (pullis[targetThumbIdx].y - pullis[cur].y) / spacing;
    addEdge(cur, targetThumbIdx, { dx, dy });
    return;
  }

  let { dx, dy } = lastVector;
  let x = pullis[cur].x + dx * spacing;
  let y = pullis[cur].y + dy * spacing;
  let idx = findDotByCoord(x, y);

  if (idx >= 0 && !visited.has(idx)) {
    addEdge(cur, idx, { dx, dy });
  } else {
    extendRandom(cur);
  }
}

function extendTurn() {
  if (dfsStack.length === 0 || !lastVector)
    return extendRandom(dfsStack[dfsStack.length - 1]);

  let cur = dfsStack[dfsStack.length - 1];

  // prioritize thumb target if it's adjacent and unvisited
  if (targetThumbIdx !== null && isAdjacent(pullis[cur], pullis[targetThumbIdx]) && !visited.has(targetThumbIdx)) {
    let dx = (pullis[targetThumbIdx].x - pullis[cur].x) / spacing;
    let dy = (pullis[targetThumbIdx].y - pullis[cur].y) / spacing;
    addEdge(cur, targetThumbIdx, { dx, dy });
    return;
  }

  let { dx, dy } = lastVector;
  let left = random() < 0.5;
  let nv = left ? { dx: -dy, dy: dx } : { dx: dy, dy: -dx };
  let x = pullis[cur].x + nv.dx * spacing;
  let y = pullis[cur].y + nv.dy * spacing;
  let idx = findDotByCoord(x, y);

  if (idx >= 0 && !visited.has(idx)) {
    addEdge(cur, idx, nv);
  } else {
    nv = left ? { dx: dy, dy: -dx } : { dx: -dy, dy: dx };
    x = pullis[cur].x + nv.dx * spacing;
    y = pullis[cur].y + nv.dy * spacing;
    idx = findDotByCoord(x, y);
    if (idx >= 0 && !visited.has(idx)) {
      addEdge(cur, idx, nv);
    } else {
      extendRandom(cur);
    }
  }
}


function terminateBranch() {
  // **unchanged**: exactly your original logic preserved
  if (dfsStack.length === 0) return;
  let currentIndex = dfsStack[dfsStack.length - 1];
  let currentDot = pullis[currentIndex];
  let r_angle = 0;
  if (lastVector) {
    r_angle = atan2(lastVector.dy, lastVector.dx) + PI;
  }
  
  // store cap arc info
  capArcs.push({
    dot: currentDot,
    angle: r_angle,
    start: PI / 4,
    stop: (dfsStack.length === 1 ? PI * 9 / 4 : PI * 7 / 4)
  });

  // reverse branch: add reverse edges back to root
  while (dfsStack.length > 1) {
    let childIndex = dfsStack.pop();
    let parentIndex = dfsStack[dfsStack.length - 1];
    let childDot = pullis[childIndex];
    let parentDot = pullis[parentIndex];
    
    let reverseVector = {
      dx: (parentDot.x - childDot.x) / spacing,
      dy: (parentDot.y - childDot.y) / spacing
    };
    framework.push({ x: childIndex, y: parentIndex, reverse: true, vector: reverseVector });
    lastVector = reverseVector;
  }
  dfsStack = [];
  lastVector = null;

  // start a new branch from a random unvisited dot
  let unvisitedIndices = [];
  for (let i = 0; i < pullis.length; i++) {
    if (!visited.has(i)) {
      unvisitedIndices.push(i);
    }
  }
  if (unvisitedIndices.length > 0) {
    let newSource = random(unvisitedIndices);
    visited.add(newSource);
    dfsStack.push(newSource);
    startingPoints.push(newSource);
  } else {
    console.log("All dots visited");
  }
}

function extendRandom(cur) {
  let neighbors = pullis
    .map((d, i) => i)
    .filter(i => !visited.has(i) && isAdjacent(pullis[cur], pullis[i]));

  if (neighbors.length > 0) {
    let nextIndex;

    // prioritize thumb target if it's an unvisited neighbor
    if (targetThumbIdx !== null && neighbors.includes(targetThumbIdx)) {
      nextIndex = targetThumbIdx;
    } else {
      nextIndex = random(neighbors);
    }

    let nextDot = pullis[nextIndex];
    let dx = (nextDot.x - pullis[cur].x) / spacing;
    let dy = (nextDot.y - pullis[cur].y) / spacing;
    addEdge(cur, nextIndex, { dx, dy });
  } else {
    terminateBranch();
  }
}




function addEdge(a, b, v) {
  framework.push({ x: a, y: b, reverse: false, vector: v });
  visited.add(b);
  dfsStack.push(b);
  lastVector = v;
}

function findDotByCoord(x, y) {
  return pullis.findIndex(d => d.x === x && d.y === y);
}

function isAdjacent(a, b) {
  return (abs(a.x - b.x) === spacing && a.y === b.y) ||
         (a.x === b.x && abs(a.y - b.y) === spacing);
}

// ----------- DECORATION HELPERS -----------
function drawLineByAngleOnLayer(layer, deg, mx, my, s, rev = false) {
  let angle = (deg === 90 || deg === -90)
    ? rev ? 3 * PI / 4 : PI / 4
    : rev ? PI / 4 : 3 * PI / 4;
  let len = s * 0.33;
  let x1 = mx - cos(angle) * len, y1 = my - sin(angle) * len;
  let x2 = mx + cos(angle) * len, y2 = my + sin(angle) * len;
  layer.stroke("#e6d063");
  layer.strokeWeight(4);
  layer.line(x1, y1, x2, y2);
}

function applyLoopAndStrokeOnLayer(layer, diff, r, dot) {
  layer.stroke("#e6d063");
  if (diff === 0)
    loopAroundOnLayer(layer, dot, r, PI / 4, PI * 3 / 4);
  else if (diff === -90 || diff === 270)
    loopAroundOnLayer(layer, dot, r, PI / 4, PI * 5 / 4);
  else if (diff === 90 || diff === -270)
    loopAroundOnLayer(layer, dot, r + PI / 2, PI / 4, PI * 5 / 4);
}

function loopAroundOnLayer(layer, dot, ang, st, sp) {
  layer.push();
  layer.strokeWeight(4);
  layer.translate(dot.x, dot.y);
  layer.rotate(ang);
  layer.noFill();
  layer.arc(0, 0, spacing * 0.66, spacing * 0.66, st, sp);
  layer.pop();
}
