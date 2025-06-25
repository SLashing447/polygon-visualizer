const svg = document.getElementById("svg");
const gridGroup = document.getElementById("gridGroup");
const highlightedGrid = document.getElementById("highlightedGrid");
const dynamicPolygon = document.getElementById("dynamicPolygon");
const dynamicClipPath = document.getElementById("dynamicClipPath");
const spokesGroup = document.getElementById("spokesGroup");
const handlesGroup = document.getElementById("handlesGroup");
const labelsGroup = document.getElementById("labelsGroup");
const container = document.querySelector(".container");
// const area = document.getElementById("#areax");

const BASE_POLY_COL = "var(--BASE_POLY_COL)";
const DYNAMIC_POLY_STROKE = "var(--DYNAMIC_POLY_STROKE)";
const DYNAMIC_POLY_FILL = "var(--DYNAMIC_POLY_FILL)";
const STROKE_WIDTH = "var(--STROKE-WIDTH)";
const concentric = 10;

const CSVLINK =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5WuLCDK7QIXgSr-Rw1D6JlPYexzt23d6SBezYFgMLo3RLorIGrPtfjPznhDswPBj3gSEq1WH5iffL/pub?output=csv";

dynamicPolygon.setAttribute("stroke", DYNAMIC_POLY_STROKE);
dynamicPolygon.setAttribute("fill", DYNAMIC_POLY_FILL);

const width = svg.clientWidth;
const height = svg.clientHeight;
const cx = width / 2;
const cy = height / 2;
const radius = 180;

function getVertex(angle, scale = 1) {
  return {
    x: cx + radius * scale * Math.cos(angle),
    y: cy + radius * scale * Math.sin(angle),
  };
}

function updatePolygon(sides, values, Labels) {
  const points = [];
  const numericPoints = []; // store as [x, y] pairs

  handlesGroup.innerHTML = "";
  labelsGroup.innerHTML = "";

  // extract scores for each catergory
  values.forEach((val, i) => {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    const v = getVertex(angle, val / 100);
    points.push(`${v.x},${v.y}`);
    numericPoints.push([v.x, v.y]);

    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    dot.setAttribute("cx", v.x);
    dot.setAttribute("cy", v.y);
    dot.setAttribute("r", 4);
    dot.setAttribute("class", "handle");
    handlesGroup.appendChild(dot);

    const labelOffset = 20;
    const lx = cx + (radius + labelOffset) * Math.cos(angle);
    const ly = cy + (radius + labelOffset) * Math.sin(angle);

    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", lx);
    lbl.setAttribute("y", ly);
    lbl.setAttribute("class", "label");
    lbl.textContent = Labels[i];
    labelsGroup.appendChild(lbl);
  });

  dynamicPolygon.setAttribute("points", points.join(" "));
  dynamicClipPath.setAttribute("points", points.join(" "));

  const dynamicArea = calculateArea(numericPoints);
  const staticArea = regularPolygonArea(sides, radius);
  const coveragePercent = (dynamicArea / staticArea) * 100;

  const area = "Pogress : " + coveragePercent.toFixed(2) + "%";
  container.setAttribute("aria-details", `${area}`);
}

function drawGrid(sides) {
  gridGroup.innerHTML = "";
  highlightedGrid.innerHTML = "";
  spokesGroup.innerHTML = "";

  // Concentric polygons
  for (let j = 1; j <= concentric; j++) {
    const scale = j / concentric;
    const polyPoints = [];

    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
      const v = getVertex(angle, scale);
      polyPoints.push(`${v.x},${v.y}`);
    }

    const basePoly = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    basePoly.setAttribute("points", polyPoints.join(" "));
    basePoly.setAttribute("stroke", BASE_POLY_COL);
    basePoly.setAttribute("fill", "none");
    basePoly.setAttribute("stroke-width", `${STROKE_WIDTH}`);

    gridGroup.appendChild(basePoly);

    const highlightPoly = basePoly.cloneNode();
    highlightPoly.setAttribute("stroke", "#aaa");
    highlightedGrid.appendChild(highlightPoly);
  }

  // Spokes
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    const v = getVertex(angle);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", cx);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", v.x);
    line.setAttribute("y2", v.y);
    line.setAttribute("stroke", BASE_POLY_COL);
    gridGroup.appendChild(line);

    const highlightLine = line.cloneNode();
    highlightLine.setAttribute("stroke", "white");
    highlightedGrid.appendChild(highlightLine);

    spokesGroup.appendChild(line.cloneNode());
  }
}

function calculateArea(points) {
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}
function regularPolygonArea(sides, radius) {
  return 0.5 * sides * radius * radius * Math.sin((2 * Math.PI) / sides);
}

container.addEventListener("click", () => {
  if (container.classList.contains("hidearea")) {
    container.classList.remove("hidearea");
  } else {
    container.classList.add("hidearea");
  }
});

// createControls();
// drawGrid(n);
// updatePolygon(n);

// const N = 10;
// const labels = [];
// const vals = [];

// for (let i = 1; i <= N; i++) {
//   vals.push(`${i * (100 / N)}`);
//   labels.push(`target ${i}`);
// }

// drawGrid(N);
// updatePolygon(N, vals, labels);

const getCSV = () => {
  fetch(CSVLINK)
    .then((response) => response.text())
    .then((csvText) => {
      const data = parseCSV(csvText);
      const sides = data.length;
      const values = [];
      const Labels = [];

      for (let i = 0; i < sides; i++) {
        const obj = data[i];
        Labels.push(obj.Category);
        values.push(obj.Score * 10);
      }

      drawGrid(sides);
      updatePolygon(sides, values, Labels);
    })
    .catch((error) => console.error("Error fetching CSV:", error));

  function parseCSV(text) {
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",").map((h) => h.trim());

    return lines.map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
    });
  }
};
getCSV();
