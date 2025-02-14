// --------------------
// Global variables
// --------------------
let l_factor = 7500;
let t_factor = 1000;
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
let mean_precess = 0;
let table = new TableManager(
  ["\u03C4 (\u03C4c)", "r (GM)", "v (GM)", "\u0278 (\u00B0)"],
  "tbl123",
  "table"
);

// Animation controls
let t_slider, r_slider, l_slider, s_slider, animate_checkbox;
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
  newRow.set("\u0278 (\u00B0)", radToDeg(mean_precess));

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
function rk4Step(r, v, phi, dtau, l) {
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
  let orbit = [];
  perihelions = []; // reset perihelion array
  table.clear(); // clear table before starting
  circles = []; // clear circles array

  // Variables for on-the-fly mean precession computation
  let precessionSum = 0;
  let precessionCount = 0;
  let lastPerihelionPhi = null; // will store the last detected perihelion's phi

  // Push the initial state
  orbit.push([r0, v0, phi0]);
  let x = r0 * Math.cos(phi0);
  let y = r0 * Math.sin(phi0);
  circles.push([x, y]);
  table.insertRow([0, r0, v0, radToDeg(phi0)]);

  // Loop over steps, integrating and updating everything
  for (let i = 1; i < steps + 1; i++) {
    // Compute the new state from the last state in orbit
    let lastState = orbit[orbit.length - 1];
    let newState = rk4Step(lastState[0], lastState[1], lastState[2], dtau, l);

    // Stop if the radius is too small or too large
    if (newState[0] < 2 || newState[0] > 1e6) {
      break;
    }

    // Push the new state
    orbit.push(newState);

    // Convert new state to canvas coordinates and update table
    let r_i = newState[0];
    let v_i = newState[1];
    let phi_i = newState[2];
    let cx = r_i * Math.cos(phi_i);
    let cy = r_i * Math.sin(phi_i);
    circles.push([cx, cy]);
    table.insertRow([i / t_factor, r_i, v_i, radToDeg(phi_i)]);

    // Perihelion detection: check if the previous state is a local minimum
    // (using states: orbit[i-2], orbit[i-1], newState)
    if (i >= 2) {
      let r_before = orbit[i - 2][0];
      let r_current = orbit[i - 1][0];
      let r_next = newState[0];
      if (r_before > r_current && r_current < r_next) {
        // Record the perihelion using index i-1
        let peri_phi = orbit[i - 1][2];
        perihelions.push([i - 1, r_current, peri_phi]);

        // If this is not the first perihelion, update the running sum
        if (lastPerihelionPhi !== null) {
          precessionSum += peri_phi - lastPerihelionPhi;
          precessionCount++;
        }
        lastPerihelionPhi = peri_phi;
      }
    }
  }

  // Compute mean precession if we detected at least one difference
  if (precessionCount > 0) {
    mean_precess = precessionSum / precessionCount - 2 * Math.PI;
  } else {
    mean_precess = 0;
  }
}

// -----------------------------------
// p5.js UI Setup
// -----------------------------------
let trajectoryDownloadButton, trajectoryPrecessionButton;

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

  t_slider = createSlider(10, 10000, step_max);
  t_slider.position(10, 110);
  t_slider.input(repaint);

  s_slider = createSlider(1, 100, speed_multiplier);
  s_slider.position(10, 160);
  s_slider.input(update_speed);

  // Buttons
  trajectoryDownloadButton = createButton("Download trajectory data");
  trajectoryDownloadButton.mousePressed(downloadTrajectoryTable);
  trajectoryDownloadButton.position(windowWidth - 220, windowHeight - 75);
  trajectoryDownloadButton.addClass("download-btn");

  trajectoryPrecessionButton = createButton("Download precession data");
  trajectoryPrecessionButton.mousePressed(downloadPrecessionTable);
  trajectoryPrecessionButton.position(windowWidth - 450, windowHeight - 75);
  trajectoryPrecessionButton.addClass("download-btn");

  let tButton = createButton("reset");
  tButton.position(10, 260);
  tButton.mousePressed(setDt);
  tButton.addClass("t-btn");

  animate_checkbox = createCheckbox("Animate");
  animate_checkbox.position(10, 310);
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
  text("\u03C4 = " + t_slider.value() / t_factor + " tc(50)", 180, 130);
  text(s_slider.value() + "x", 180, 180);
  text(
    "mean precession \u2248 " + radToDeg(mean_precess).toFixed(2) + "\u00B0",
    10,
    230
  );

  stroke("grey");
  textSize(32);
  text("Schwarzschild Orbits (RK4)", 20, windowHeight - 60);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  trajectoryDownloadButton.position(windowWidth - 220, windowHeight - 75);
  trajectoryPrecessionButton.position(windowWidth - 450, windowHeight - 75);
  c_x = windowWidth / 2;
  c_y = windowHeight / 2;
}
