// --------------------
// Global variables
// --------------------
let l_factor = 7500;
let t_factor = 500;
let step_max = 4286;
let speed_multiplier = 2;
let w = 50;

// For convenience, set G=M=1 in these units:
let r_0 = 50; // initial radius
let phi_0 = 0; // initial angle
let v_0 = 0; // initial velocity
let l_c = r_0 / Math.sqrt(r_0 - 3); // circular orbit reference
let tau_c = (2 * Math.PI * Math.pow(r_0, 2)) / l_c;
let dtau = tau_c / t_factor;
let l = (l_factor / 10000) * l_c; // scaled angular momentum

// Arrays and parameters for drawing & data storage
let circles = [];
let perihelions = [];
let mean_precession = 0;
let table = new TableManager(
  ["\u03C4 (\u03C4c)", "r (GM)", "v (GM)", "\u0278 (\u00B0)"],
  "tbl123",
  "table"
);

// Animation controls
let dt_slider, t_slider, r_slider, l_slider, s_slider, animate_checkbox;
let t = step_max;
let dt = 0; // index for animation
let c_x, c_y; // canvas center

// --------------------
// Utility functions
// --------------------
function radToDeg(rad) {
  let deg = (rad * 180) / Math.PI;
  while (deg >= 360) {
    deg -= 360;
  }
  return deg;
}

// Checks if current radius is a perihelion
function isPerihelion(before, current, after) {
  return current < before && current < after;
}

// Download the entire trajectory table
function downloadTrajectoryTable() {
  saveTable(table.getTable(), "schwarzschild_orbit_trajectory.csv");
}

// Download perihelion data plus mean precession
function downloadPrecessionTable() {
  let t = new p5.Table();
  ["\u03C4 (\u03C4c)", "r (GM)", "\u0278 (\u00B0)"].forEach((header) =>
    t.addColumn(header)
  );

  for (let perihelion of perihelions) {
    let newRow = t.addRow();
    newRow.set("\u03C4 (\u03C4c)", perihelion[0] / t_factor);
    newRow.set("r (GM)", perihelion[1]);
    newRow.set("\u0278 (\u00B0)", radToDeg(perihelion[2]));
  }

  let newRow = t.addRow();
  newRow.set("\u03C4 (\u03C4c)", "mean precession (deg):");
  newRow.set("r (GM)", "");
  newRow.set("\u0278 (\u00B0)", radToDeg(mean_precession));

  saveTable(t, "schwarzschild_orbit_precession.csv");
}

// Create a background grid
function createGrid(px, py, u, w) {
  drawingContext.setLineDash([5, 5]);
  stroke(128);
  strokeWeight(0.1);
  for (let y = 0; y < u * w; y += w) {
    for (let x = 0; x < u * w; x += w) {
      line(px + x, 0, px + x, height);
      line(px - x, 0, px - x, height);
      line(0, py + y, width, py + y);
      line(0, py - y, width, py - y);
    }
  }
  drawingContext.setLineDash([0, 0]);
  stroke(0);
  strokeWeight(2);
  line(px, 0, px, height);
  line(0, py, width, py);
}

// ------------------------------
// RK4 Implementation
// ------------------------------

// 1) Return the derivatives [dr/dtau, dv/dtau, dphi/dtau]
function derivatives(r, v, phi, l) {
  // dr/dtau = v
  // dv/dtau = -1/r^2 + l^2/r^3 - 3 l^2 / r^4
  // dphi/dtau = l / r^2
  let dr = v;
  let dv =
    -1 / (r * r) + (l * l) / (r * r * r) - (3 * (l * l)) / (r * r * r * r);
  let dphi = l / (r * r);
  return [dr, dv, dphi];
}

// 2) One RK4 step
function rk4Step(state, dtau, l) {
  let [r, v, phi] = state;
  let [dr1, dv1, dphi1] = derivatives(r, v, phi, l);

  let r2 = r + 0.5 * dtau * dr1;
  let v2 = v + 0.5 * dtau * dv1;
  let phi2 = phi + 0.5 * dtau * dphi1;
  let [dr2, dv2, dphi2] = derivatives(r2, v2, phi2, l);

  let r3 = r + 0.5 * dtau * dr2;
  let v3 = v + 0.5 * dtau * dv2;
  let phi3 = phi + 0.5 * dtau * dphi2;
  let [dr3, dv3, dphi3] = derivatives(r3, v3, phi3, l);

  let r4 = r + dtau * dr3;
  let v4 = v + dtau * dv3;
  let phi4 = phi + dtau * dphi3;
  let [dr4, dv4, dphi4] = derivatives(r4, v4, phi4, l);

  let r_next = r + (dtau / 6) * (dr1 + 2 * dr2 + 2 * dr3 + dr4);
  let v_next = v + (dtau / 6) * (dv1 + 2 * dv2 + 2 * dv3 + dv4);
  let phi_next = phi + (dtau / 6) * (dphi1 + 2 * dphi2 + 2 * dphi3 + dphi4);

  return [r_next, v_next, phi_next];
}

// 3) Integrate for `steps` iterations
function integrateOrbit(r0, v0, phi0, steps, dtau, l) {
  // Clear previous data
  perihelions.length = 0;
  table.clear(); // We'll repopulate later
  circles.length = 0;

  // For period estimation, record steps where orbit returns close to initial state
  let periodSteps = [];
  const tolerance_r = 0.5; // tolerance in r (GM)
  const tolerance_phi = Math.PI / 180; // tolerance in phi (radians)
  const tolerance_v = 0.02; // tolerance in velocity (customize as needed)

  let minSeparation = 100; // minimum # steps between successive detections

  // For on-the-fly mean precession
  let precessionSum = 0;
  let precessionCount = 0;
  let lastPerihelionPhi = null;

  // Precompute constants
  const TWO_PI = 2 * Math.PI;

  // Helper: measure angle difference modulo 2π
  function angleDiff(phi1, phi2) {
    let dphi = (phi1 - phi2) % TWO_PI;
    if (dphi > Math.PI) dphi -= TWO_PI;
    if (dphi < -Math.PI) dphi += TWO_PI;
    return Math.abs(dphi);
  }

  // Helper: convert (r, phi) → Cartesian
  function toCanvasCoords(r, phi) {
    return [r * Math.cos(phi), r * Math.sin(phi)];
  }

  // 1) Compute initial states
  let state0 = [r0, v0, phi0];
  let state1 = rk4Step(state0, dtau, l);
  let state2 = rk4Step(state1, dtau, l);

  // 2) Push initial states into table and circle arrays
  let [x0, y0] = toCanvasCoords(state0[0], state0[2]);
  let [x1, y1] = toCanvasCoords(state1[0], state1[2]);
  let [x2, y2] = toCanvasCoords(state2[0], state2[2]);

  circles.push([x0, y0], [x1, y1], [x2, y2]);
  table.insertRow([0 / t_factor, state0[0], state0[1], radToDeg(state0[2])]);
  table.insertRow([1 / t_factor, state1[0], state1[1], radToDeg(state1[2])]);
  table.insertRow([2 / t_factor, state2[0], state2[1], radToDeg(state2[2])]);

  // 3) Keep sliding window of last 3 states for perihelion detection
  let prev2 = state0;
  let prev1 = state1;
  let current = state2;

  // For period detection
  periodSteps.push(0);
  let lastPeriodIndex = 0;

  // 4) Main integration loop
  for (let i = 3; i < steps + 1; i++) {
    // Step forward using RK4
    let nextState = rk4Step(current, dtau, l);

    // Slide the window
    prev2 = prev1;
    prev1 = current;
    current = nextState;

    // Quick radius check to avoid nonsensical extremes
    let rCurr = current[0];
    if (rCurr < 2 || rCurr > 1e6) {
      break;
    }

    // Convert to canvas
    let [cx, cy] = toCanvasCoords(rCurr, current[2]);
    circles.push([cx, cy]);
    table.insertRow([
      i / t_factor,
      current[0],
      current[1],
      radToDeg(current[2]),
    ]);
    // Perihelion detection (local minimum in r)
    if (prev2[0] > prev1[0] && prev1[0] < rCurr) {
      perihelions.push([i - 1, prev1[0], prev1[2]]);
      if (lastPerihelionPhi !== null) {
        precessionSum += prev1[2] - lastPerihelionPhi;
        precessionCount++;
      }
      lastPerihelionPhi = prev1[2];
    }

    // Period detection: check if r, v, and phi are each close to their initial values
    if (i - lastPeriodIndex >= minSeparation) {
      let rError = Math.abs(rCurr - r0);
      let vError = Math.abs(current[1] - v0);
      let phiError = angleDiff(current[2], phi0);

      // Must satisfy *all three* thresholds
      if (
        rError <= tolerance_r &&
        vError <= tolerance_v &&
        phiError <= tolerance_phi
      ) {
        periodSteps.push(i);
        lastPeriodIndex = i;
      }
    }
  }

  // 5) If we want to compute mean precession
  if (precessionCount > 0) {
    mean_precession = precessionSum / precessionCount - TWO_PI;
  } else {
    mean_precession = 0;
  }

  console.log("Detected period steps:", periodSteps);
}

// -----------------------------------
// p5.js UI Setup
// -----------------------------------
let trajectoryDownloadButton, PrecessionDownloadButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  c_x = windowWidth / 2;
  c_y = windowHeight / 2;

  // Sliders
  r_slider = createSlider(4, 90, 50);
  r_slider.position(10, 10);
  r_slider.input(repaint);

  l_slider = createSlider(5000, 12000, l_factor);
  l_slider.position(10, 60);
  l_slider.input(repaint);

  dt_slider = createSlider(100, 2000, t_factor, 100);
  dt_slider.position(10, 110);
  dt_slider.input(repaint);

  t_slider = createSlider(10, 10000, step_max);
  t_slider.position(10, 160);
  t_slider.input(repaint);

  s_slider = createSlider(1, 100, speed_multiplier);
  s_slider.position(10, 210);
  s_slider.input(update_speed);

  // Buttons
  trajectoryDownloadButton = createButton("Download trajectory data");
  trajectoryDownloadButton.mousePressed(downloadTrajectoryTable);
  trajectoryDownloadButton.position(windowWidth - 210, windowHeight - 145);
  trajectoryDownloadButton.addClass("download-btn");

  PrecessionDownloadButton = createButton("Download precession data");
  PrecessionDownloadButton.mousePressed(downloadPrecessionTable);
  PrecessionDownloadButton.position(windowWidth - 220, windowHeight - 75);
  PrecessionDownloadButton.addClass("download-btn");

  let tButton = createButton("reset");
  tButton.position(10, 360);
  tButton.mousePressed(setDt);
  tButton.addClass("t-btn");

  animate_checkbox = createCheckbox("Animate");
  animate_checkbox.position(10, 410);
  animate_checkbox.addClass("a-chk");

  // Initial orbit
  repaint();
  animate_checkbox.checked(true);
}

// -----------------------------------
// Recompute orbit and store data
// -----------------------------------
function repaint() {
  // Read sliders
  r_0 = r_slider.value();
  phi_0 = 0;
  v_0 = 0;
  t = t_slider.value();
  t_factor = dt_slider.value();
  dtau = tau_c / t_factor;
  l = (l_slider.value() / 10000) * l_c;

  // Integrate orbit from r_0, radial velocity = 0, phi_0=0
  integrateOrbit(r_0, v_0, phi_0, t, dtau, l);

  // Reset animation index
  setDt();

  // Rebuild table
  table.buildHTMLTable();
}

// -----------------------------------
// Control speed and animate
// -----------------------------------
function update_speed() {
  speed_multiplier = s_slider.value();
}

function setDt() {
  dt = circles.length - 1; // reset drawing index
  animate_checkbox.checked(false);
}

// -----------------------------------
// p5.js draw loop
// -----------------------------------
function draw() {
  background(250);
  createGrid(c_x, c_y, 26, w);

  // Draw orbit path up to current dt
  if (dt < circles.length) {
    // Draw orbit segments
    stroke(0);
    strokeWeight(3);
    for (let i = 0; i < dt; i++) {
      let x1 = 5 * circles[i][0] + c_x;
      let y1 = -5 * circles[i][1] + c_y;
      let x2 = 5 * circles[i + 1][0] + c_x;
      let y2 = -5 * circles[i + 1][1] + c_y;
      line(x1, y1, x2, y2);
    }

    // Draw lines for perihelions
    for (let perihelion of perihelions) {
      if (perihelion[0] > dt) break;
      let x = 5 * perihelion[1] * Math.cos(perihelion[2]) + c_x;
      let y = -5 * perihelion[1] * Math.sin(perihelion[2]) + c_y;
      stroke("blue");
      strokeWeight(1.5);
      drawingContext.setLineDash([5, 5]);
      line(c_x, c_y, x, y);
      drawingContext.setLineDash([0, 0]);
      fill(250);
      stroke(0);
      strokeWeight(2);
      circle(x, y, 4);
    }
  }

  // Draw central mass
  stroke(0);
  strokeWeight(1.5);
  fill("black");
  circle(c_x, c_y, 15);

  // Draw orbiting body
  stroke(0);
  fill("red");
  if (dt < circles.length) {
    let x = 5 * circles[dt][0] + c_x;
    let y = -5 * circles[dt][1] + c_y;
    circle(x, y, 5);
  }

  // Animation update
  if (animate_checkbox.checked()) {
    dt += speed_multiplier;
    dt %= circles.length;
  }

  // UI text
  fill("black");
  strokeWeight(0.5);
  textSize(24);
  text("r = " + r_slider.value() + " GM", 180, 30);
  text("l = " + l_slider.value() / 10000 + " lc(50)", 180, 80);
  text("d\u03C4 = " + dt_slider.value() + " 1/tc(50)", 180, 130);
  text(
    "\u03C4 max = " + (t_slider.value() / t_factor).toFixed(4) + " tc(50)",
    180,
    180
  );
  text(s_slider.value() + "x", 180, 230);
  text("\u03C4 = " + (dt / t_factor).toFixed(4), 10, 280);
  text(
    "mean precession \u2248 " + radToDeg(mean_precession).toFixed(2) + "\u00B0",
    10,
    330
  );
  stroke("grey");
  textSize(28);
  text("Schwarzschild Orbits (RK4)", 20, windowHeight - 40);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  trajectoryDownloadButton.position(windowWidth - 210, windowHeight - 145);
  PrecessionDownloadButton.position(windowWidth - 220, windowHeight - 75);
  c_x = windowWidth / 2;
  c_y = windowHeight / 2;
}
