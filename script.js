// Получаем элементы канвы и контекста
const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

const cellSize = 30; // Размер ячейки (600/20)
let cities = [];      // Города: {id, x, y, outageHours}
let powerLines = [];  // ЛЭП: {id, city1, city2, equipment1, equipment2, cable}
let selectedCities = []; // Для выбора двух городов
let menu = document.getElementById("menu");
let selectedLine = null;
let selectedEndpoint = null; // 1 или 2 – устройство для первого или второго города
let hoveredLine = null;

// Глобальные коэффициенты (используются, если провод не выбран)
const costNonForestCoefficient = 1;  // Стоимость за единицу длины вне леса
const costForestCoefficient = 1;       // Стоимость за единицу длины в лесу

// h – высота холста
const h = canvas.height;
// Изначальные города (главная точка – город с id 1)
const initialCities = [
    { x: 0 * cellSize, y: h - 8 * cellSize },   // город 1 (главный)
    { x: 2 * cellSize, y: h - 4 * cellSize },   // город 2
    { x: 2 * cellSize, y: h - 1 * cellSize },    // город 3
    { x: 2 * cellSize, y: h - 14 * cellSize },  // город 4
    { x: 4 * cellSize, y: h - 12 * cellSize },  // город 5
    { x: 6 * cellSize, y: h - 6 * cellSize },   // город 6
    { x: 8 * cellSize, y: h - 9 * cellSize },   // город 7
    { x: 8 * cellSize, y: h - 14 * cellSize },  // город 8
    { x: 12 * cellSize, y: h - 4 * cellSize },  // город 9
    { x: 14 * cellSize, y: h - 14 * cellSize }, // город 10
    { x: 17 * cellSize, y: h - 2 * cellSize },  // город 11
    { x: 18 * cellSize, y: h - 5 * cellSize },  // город 12
    { x: 18 * cellSize, y: h - 14 * cellSize }, // город 13
    { x: 19 * cellSize, y: h - 11 * cellSize }, // город 14
    { x: 20 * cellSize, y: h - 2 * cellSize }   // город 15
];

// Лесные клетки
const forestCells = [
    { cellX: 3, cellY: (h / cellSize) - 3},
    { cellX: 3, cellY: (h / cellSize) - 4},
    { cellX: 3, cellY: (h / cellSize) - 5},
    { cellX: 4, cellY: (h / cellSize) - 3},
    { cellX: 4, cellY: (h / cellSize) - 4},
    { cellX: 4, cellY: (h / cellSize) - 5},
    { cellX: 5, cellY: (h / cellSize) - 3},
    { cellX: 5, cellY: (h / cellSize) - 4},
    { cellX: 5, cellY: (h / cellSize) - 5},
    { cellX: 6, cellY: (h / cellSize) - 3},
    { cellX: 6, cellY: (h / cellSize) - 4},
    { cellX: 6, cellY: (h / cellSize) - 5},
    { cellX: 7, cellY: (h / cellSize) - 3},
    { cellX: 7, cellY: (h / cellSize) - 4},
    { cellX: 7, cellY: (h / cellSize) - 5},
    { cellX: 7, cellY: (h / cellSize) - 6},
    { cellX: 8, cellY: (h / cellSize) - 4},
    { cellX: 8, cellY: (h / cellSize) - 5},
    { cellX: 8, cellY: (h / cellSize) - 6},
    { cellX: 8, cellY: (h / cellSize) - 7},
    { cellX: 9, cellY: (h / cellSize) - 5},
    { cellX: 9, cellY: (h / cellSize) - 6},
    { cellX: 9, cellY: (h / cellSize) - 7},
    { cellX: 9, cellY: (h / cellSize) - 8},
    { cellX: 10, cellY: (h / cellSize) - 6},
    { cellX: 10, cellY: (h / cellSize) - 7},
    { cellX: 10, cellY: (h / cellSize) - 8},
    { cellX: 10, cellY: (h / cellSize) - 9},
    { cellX: 10, cellY: (h / cellSize) - 10},
    { cellX: 11, cellY: (h / cellSize) - 7},
    { cellX: 11, cellY: (h / cellSize) - 8},
    { cellX: 11, cellY: (h / cellSize) - 9},
    { cellX: 11, cellY: (h / cellSize) - 10},
    { cellX: 12, cellY: (h / cellSize) - 8},
    { cellX: 12, cellY: (h / cellSize) - 9},
    { cellX: 12, cellY: (h / cellSize) - 10},
    { cellX: 13, cellY: (h / cellSize) - 9},
    { cellX: 13, cellY: (h / cellSize) - 10},
];

let nextCityId = 1;
let nextLineId = 1;

// Функция для вычисления позиции на линии с заданным отступом от города
function getOffsetPosition(city, otherCity, offset) {
  const dx = otherCity.x - city.x;
  const dy = otherCity.y - city.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: city.x, y: city.y };
  return { x: city.x + (dx / dist) * offset, y: city.y + (dy / dist) * offset };
}

// Функция отрисовки всей сцены
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#303446";
  for (let x = 0; x <= canvas.width; x += cellSize) {
    for (let y = 0; y <= canvas.height; y += cellSize) {
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }
  drawForestCells();
  drawPowerLines();
  drawCities();
}

function drawForestCells() {
  forestCells.forEach(cell => {
    ctx.fillStyle = "#0e450e";
    ctx.fillRect(cell.cellX * cellSize, cell.cellY * cellSize, cellSize, cellSize);
  });
}

function drawCities() {
  cities.forEach(city => {
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(city.x, city.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#00BFFF";
    ctx.font = "12px Arial";
    ctx.fillText(city.id, city.x - 3, city.y + 15);
  });
}

function drawPowerLines() {
  powerLines.forEach(line => {
    ctx.lineWidth = (hoveredLine && hoveredLine.id === line.id) ? 4 : 1;
    ctx.strokeStyle = "#FF4500";
    ctx.beginPath();
    ctx.moveTo(line.city1.x, line.city1.y);
    ctx.lineTo(line.city2.x, line.city2.y);
    ctx.stroke();
    ctx.lineWidth = 1;
    // Отрисовка устройств вдоль линии с отступом от города (15 пикселей)
    if (line.equipment1) {
      const pos1 = getOffsetPosition(line.city1, line.city2, 15);
      drawEquipment(pos1.x, pos1.y, line.equipment1);
    }
    if (line.equipment2) {
      const pos2 = getOffsetPosition(line.city2, line.city1, 15);
      drawEquipment(pos2.x, pos2.y, line.equipment2);
    }
  });
}

function drawEquipment(x, y, equipment) {
  if (equipment === "Реклоузер") {
    ctx.fillStyle = "white";
    ctx.fillRect(x - 7, y - 7, 14, 14);
  } else if (equipment === "Выключатель") {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x - 8, y + 8);
    ctx.lineTo(x + 8, y + 8);
    ctx.closePath();
    ctx.fill();
  } else if (equipment === "Разъединитель") {
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("★", x - 8, y + 6);
  }
}

// Функция расчёта длины линии (в пикселях) с разделением на лес и не лес
function calculateLineCost(city1, city2) {
  const x0 = city1.x, y0 = city1.y, x1 = city2.x, y1 = city2.y;
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.sqrt(dx * dx + dy * dy);
  if (L === 0) return { nonForestLength: 0, forestLength: 0 };

  let cellX = Math.floor(x0 / cellSize);
  let cellY = Math.floor(y0 / cellSize);
  const stepX = (dx > 0) ? 1 : (dx < 0 ? -1 : 0);
  const stepY = (dy > 0) ? 1 : (dy < 0 ? -1 : 0);
  const tDeltaX = (dx !== 0) ? (cellSize / Math.abs(dx)) : Infinity;
  const tDeltaY = (dy !== 0) ? (cellSize / Math.abs(dy)) : Infinity;
  let nextBoundaryX = (stepX > 0) ? ((cellX + 1) * cellSize) : (cellX * cellSize);
  let nextBoundaryY = (stepY > 0) ? ((cellY + 1) * cellSize) : (cellY * cellSize);
  let tMaxX = (dx !== 0) ? Math.abs((nextBoundaryX - x0) / dx) : Infinity;
  let tMaxY = (dy !== 0) ? Math.abs((nextBoundaryY - y0) / dy) : Infinity;
  let t = 0, nonForestLength = 0, forestLength = 0;

  const eps = 1e-9; // допуск для сравнения с границей

  // Функция для проверки, лежит ли координата ровно на границе (с учётом допуска)
  function isOnBorder(val) {
    let mod = val % cellSize;
    if (mod < 0) mod += cellSize;
    return (mod < eps || Math.abs(mod - cellSize) < eps);
  }

  while (t < 1) {
    let tNext = Math.min(tMaxX, tMaxY, 1);
    let segmentLength = (tNext - t) * L;

    // Определяем среднюю точку текущего отрезка
    let midT = (t + tNext) / 2;
    let midX = x0 + dx * midT;
    let midY = y0 + dy * midT;

    const onVertical = isOnBorder(midX);
    const onHorizontal = isOnBorder(midY);

    if (onVertical && onHorizontal) {
      // Угловой случай: линия лежит на пересечении границ четырёх клеток.
      let k = Math.round(midX / cellSize);
      let m = Math.round(midY / cellSize);
      let forestCount = 0;
      if (isForest(k - 1, m - 1)) forestCount++;
      if (isForest(k, m - 1)) forestCount++;
      if (isForest(k - 1, m)) forestCount++;
      if (isForest(k, m)) forestCount++;
      if (forestCount === 4) {
        forestLength += segmentLength;
      } else {
        nonForestLength += segmentLength;
      }
    } else if (onVertical) {
      let k = Math.round(midX / cellSize);
      let m = Math.floor(midY / cellSize);
      let leftForest = isForest(k - 1, m);
      let rightForest = isForest(k, m);
      if (leftForest && rightForest) {
        forestLength += segmentLength;
      } else {
        nonForestLength += segmentLength;
      }
    } else if (onHorizontal) {
      let m = Math.round(midY / cellSize);
      let k = Math.floor(midX / cellSize);
      let topForest = isForest(k, m - 1);
      let bottomForest = isForest(k, m);
      if (topForest && bottomForest) {
        forestLength += segmentLength;
      } else {
        nonForestLength += segmentLength;
      }
    } else {
      if (isForest(cellX, cellY)) {
        forestLength += segmentLength;
      } else {
        nonForestLength += segmentLength;
      }
    }

    t = tNext;
    if (t >= 1) break;
    if (tMaxX < tMaxY) {
      cellX += stepX;
      tMaxX += tDeltaX;
    } else {
      cellY += stepY;
      tMaxY += tDeltaY;
    }
  }
  return { nonForestLength, forestLength };
}

function isForest(cellX, cellY) {
  return forestCells.some(cell => cell.cellX === cellX && cell.cellY === cellY);
}

// Расчёт стоимости линии с учётом выбранного провода (если выбран)
function calculateCostsForLine(line) {
  const result = calculateLineCost(line.city1, line.city2);
  let nonForestCoeff, forestCoeff;
  if (line.cable) {
    nonForestCoeff = line.cable.costNonForest;
    forestCoeff = line.cable.costForest;
  } else {
    nonForestCoeff = costNonForestCoefficient;
    forestCoeff = costForestCoefficient;
  }
  const costOutside = result.nonForestLength / cellSize / 2 * nonForestCoeff;
  const costInside = result.forestLength / cellSize / 2 * forestCoeff;
  // Суммируем стоимость обоих устройств (если установлены)
  const equipCost1 = line.equipment1 ? equipmentCostsFromFile[line.equipment1] : 0;
  const equipCost2 = line.equipment2 ? equipmentCostsFromFile[line.equipment2] : 0;
  const equipCost = equipCost1 + equipCost2;
  const total = costOutside + costInside + equipCost;
  return { costOutside, costInside, equipCost, total, result };
}

// Расчёт частоты отключений для линии (если выбран провод)
function calculateLineOutageFrequency(line) {
  if (!line.cable) return "-";
  const { result } = calculateCostsForLine(line);
  const kmNonForest = result.nonForestLength / cellSize / 2;
  const kmForest = result.forestLength / cellSize / 2;
  const outageFreq = line.cable.outageFrequencyNonForest * kmNonForest +
                     line.cable.outageFrequencyForest * kmForest;
  return outageFreq.toFixed(5);
}

// Обновление таблиц городов и ЛЭП
function updateTables() {
  updateCitiesTable();
  updateLinesTable();
}

function updateCitiesTable() {
  const tbody = document.querySelector("#citiesTable tbody");
  tbody.innerHTML = "";
  cities.forEach(city => {
    let outageInputHTML = "";
    let outageCostHTML = "";
    if (city.id !== 1) {
      outageInputHTML = `<input type="number" id="outageInput-${city.id}" value="${city.outageHours || 0}" min="0" style="width:60px;" oninput="updateCityOutage(this, ${city.id})">`;
      const costPerHour = cityOutageCosts[city.id] || 0;
      const computed = ((city.outageHours || 0) * costPerHour).toFixed(5);
      outageCostHTML = `<span id="outageCost-${city.id}">${computed}</span>`;
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${city.id}</td>
                    <td>(${city.x}, ${city.y})</td>
                    <td>${outageInputHTML}</td>
                    <td>${outageCostHTML}</td>
                    <td><button onclick="deleteCity(${city.id})">Удалить</button></td>`;
    tbody.appendChild(tr);
  });
  calculateTotalOutageCost();
}

function calculateTotalOutageCost() {
  let totalCost = cities.reduce((sum, city) => {
    if (city.id !== 1) {
      const costPerHour = cityOutageCosts[city.id] || 0;
      sum += (city.outageHours || 0) * costPerHour;
    }
    return sum;
  }, 0);

  document.getElementById("totalOutageCost").innerText = `Итого: ${totalCost.toFixed(2)} руб.`;
}

function updateLinesTable() {
  // Нормализация: город с меньшим id идёт первым
  powerLines.forEach(line => {
    if (line.city1.id > line.city2.id) {
      let temp = line.city1;
      line.city1 = line.city2;
      line.city2 = temp;
      // Также меняем местами оборудование
      let tempEquip = line.equipment1;
      line.equipment1 = line.equipment2;
      line.equipment2 = tempEquip;
    }
  });
  
  powerLines.sort((a, b) => {
    if (a.city1.id !== b.city1.id) {
      return a.city1.id - b.city1.id;
    }
    return a.city2.id - b.city2.id;
  });
  
  powerLines.forEach((line, index) => {
    line.id = index + 1;
  });
  
  const tbody = document.querySelector("#linesTable tbody");
  tbody.innerHTML = "";
  let sumTotal = 0;
  powerLines.forEach(line => {
    const costs = calculateCostsForLine(line);
    sumTotal += costs.total;
    
    // Отображение кабеля (без изменений)
    let cableCellContent = "";
    let cableCellStyle = "";
    if (line.cable) {
      cableCellContent = line.cable.name;
      cableCellStyle = "cursor:pointer;";
    } else {
      cableCellContent = "-";
      cableCellStyle = "cursor:pointer; color:red;";
    }
    
    const outageFreq = calculateLineOutageFrequency(line);
    
    const tr = document.createElement("tr");
    // Обновлён заголовок: добавлены столбцы для оборудования первого и второго города
    tr.innerHTML = `<td>${line.id}</td>
                    <td>${line.city1.id} - ${line.city2.id}</td>
                    <td style="cursor:pointer;" onclick="openEquipmentDropdown(${line.id},1,this)">${line.equipment1 || "-"}</td>
                    <td style="cursor:pointer;" onclick="openEquipmentDropdown(${line.id},2,this)">${line.equipment2 || "-"}</td>
                    <td style="${cableCellStyle}" onclick="selectCableForLine(${line.id}, this)">${cableCellContent}</td>
                    <td>${costs.costOutside.toFixed(5)}</td>
                    <td>${costs.costInside.toFixed(5)}</td>
                    <td>${costs.equipCost.toFixed(5)}</td>
                    <td>${costs.total.toFixed(5)}</td>
                    <td>${outageFreq}</td>
                    <td><button onclick="deleteLine(${line.id})">Удалить</button></td>`;
    tbody.appendChild(tr);
  });
  
  const trTotal = document.createElement("tr");
  trTotal.style.fontWeight = "bold";
  trTotal.innerHTML = `<td colspan="9" style="text-align:right;">Итого:</td>
                       <td colspan="2">${sumTotal.toFixed(5)}</td>`;
  tbody.appendChild(trTotal);
}

// Удаление города и переиндексация
function deleteCity(cityId) {
  cities = cities.filter(city => city.id !== cityId);
  powerLines = powerLines.filter(line => line.city1.id !== cityId && line.city2.id !== cityId);
  cities.forEach((city, index) => { city.id = index + 1; });
  nextCityId = cities.length + 1;
  updateTables();
  drawGrid();
}

// Удаление линии
function deleteLine(lineId) {
  powerLines = powerLines.filter(line => line.id !== lineId);
  updateTables();
  drawGrid();
}

function addPowerLine(city1, city2) {
  if (city1.id === city2.id) return;
  const exists = powerLines.some(line =>
    (line.city1.id === city1.id && line.city2.id === city2.id) ||
    (line.city1.id === city2.id && line.city2.id === city1.id)
  );
  if (exists) return;
  // Инициализируем линию с двумя полями для оборудования
  powerLines.push({ id: nextLineId++, city1, city2, equipment1: null, equipment2: null, cable: null });
  updateTables();
  drawGrid();
}

canvas.addEventListener("click", function(event) {
  const rect = canvas.getBoundingClientRect();
  let x = Math.round((event.clientX - rect.left) / cellSize) * cellSize;
  let y = Math.round((event.clientY - rect.top) / cellSize) * cellSize;
  const existingCity = cities.find(c => c.x === x && c.y === y);
  if (existingCity) {
    selectCity(existingCity);
    return;
  }
  const newCity = { id: nextCityId++, x, y, outageHours: 0 };
  cities.push(newCity);
  updateTables();
  drawGrid();
});

function selectCity(city) {
  selectedCities.push(city);
  if (selectedCities.length === 2) {
    addPowerLine(selectedCities[0], selectedCities[1]);
    selectedCities = [];
  }
}

// Обработка правого клика для вызова контекстного меню по линии
canvas.addEventListener("contextmenu", function(event) {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  for (let line of powerLines) {
    const dist = distanceToSegment(x, y, line.city1.x, line.city1.y, line.city2.x, line.city2.y);
    if (dist < 5) {
      selectedLine = line;
      // Определяем, к какому городу ближе клик
      const d1 = Math.hypot(x - line.city1.x, y - line.city1.y);
      const d2 = Math.hypot(x - line.city2.x, y - line.city2.y);
      selectedEndpoint = (d1 <= d2) ? 1 : 2;
      menu.style.left = `${event.pageX}px`;
      menu.style.top = `${event.pageY}px`;
      menu.classList.remove("hidden");
      return;
    }
  }
});

function setEquipment(type) {
  if (selectedLine && selectedEndpoint) {
    if (selectedEndpoint === 1)
      selectedLine.equipment1 = type;
    else
      selectedLine.equipment2 = type;
    updateTables();
    drawGrid();
    menu.classList.add("hidden");
  }
}

canvas.addEventListener("mousemove", function(event) {
  const rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  hoveredLine = null;
  for (let line of powerLines) {
    const dist = distanceToSegment(x, y, line.city1.x, line.city1.y, line.city2.x, line.city2.y);
    if (dist < 5) { hoveredLine = line; break; }
  }
  drawGrid();
});

document.addEventListener("click", function(event) {
  if (!menu.contains(event.target)) { menu.classList.add("hidden"); }
});

// Функция открытия dropdown для выбора типа оборудования (для линии)
// Параметры: lineId, endpoint (1 или 2) и элемент, по которому кликнули
function openEquipmentDropdown(lineId, endpoint, element) {
  selectedLine = powerLines.find(l => l.id === lineId);
  selectedEndpoint = endpoint;
  // Используем уже существующий dropdown меню (menu)
  menu.style.left = `${element.getBoundingClientRect().left + window.scrollX}px`;
  menu.style.top = `${element.getBoundingClientRect().top + window.scrollY - menu.offsetHeight}px`;
  menu.classList.remove("hidden");
}

// Функция для открытия dropdown выбора провода (без изменений)
function selectCableForLine(lineId, element) {
  const line = powerLines.find(l => l.id === lineId);
  if (!line) return;
  
  const dropdown = document.getElementById("cableDropdown");
  const menuCable = document.getElementById("cableOptionsMenu");

  menuCable.innerHTML = "";
  cableOptions.forEach((opt, index) => {
    const item = document.createElement("div");
    item.className = "menu-item";
    item.dataset.index = index;
    item.innerText = `${opt.name}\nл: ${opt.outageFrequencyForest}, ${opt.costForest}\nп: ${opt.outageFrequencyNonForest}, ${opt.costNonForest}`;
    item.addEventListener("click", () => {
      line.cable = cableOptions[index];
      updateTables();
      drawGrid();
      dropdown.style.display = "none";
    });
    menuCable.appendChild(item);
  });
  
  menuCable.style.display = "block";
  const rect = element.getBoundingClientRect();
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.top = `${rect.top + window.scrollY - dropdown.offsetHeight}px`;
  dropdown.style.transform = "";
  dropdown.style.display = "block";
}

document.addEventListener("click", function(event) {
  const dropdown = document.getElementById("cableDropdown");
  if (!event.target.closest("#cableDropdown") && !event.target.closest("td[onclick^='selectCableForLine']")) {
    dropdown.style.display = "none";
  }
});

function distanceToSegment(x0, y0, x1, y1, x2, y2) {
  const A = x0 - x1, B = y0 - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D, len_sq = C * C + D * D;
  let param = (len_sq !== 0) ? dot / len_sq : -1;
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  const dx = x0 - xx, dy = y0 - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function updateCityOutage(input, cityId) {
  const hours = parseFloat(input.value) || 0;
  const city = cities.find(c => c.id === cityId);
  if (city) { city.outageHours = hours; }
  const costPerHour = cityOutageCosts[cityId] || 0;
  const computed = (hours * costPerHour).toFixed(5);
  document.getElementById(`outageCost-${cityId}`).innerText = computed;

  calculateTotalOutageCost();
}

function exportLayout() {
  const data = {
    cities: cities,
    powerLines: powerLines.map(line => {
      return {
        city1: line.city1,
        city2: line.city2,
        equipment1: line.equipment1,
        equipment2: line.equipment2,
        cable: line.cable
      };
    }),
    finalCost: document.getElementById("finalCost").value,
    notes: document.getElementById("notes").value
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "layout.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importLayout(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.cities && Array.isArray(data.cities)) {
        cities = data.cities;
        nextCityId = Math.max(...cities.map(c => c.id)) + 1;
      }
      if (data.powerLines && Array.isArray(data.powerLines)) {
        powerLines = data.powerLines.map((line, index) => ({
          id: index + 1,
          city1: line.city1,
          city2: line.city2,
          equipment1: line.equipment1,
          equipment2: line.equipment2,
          cable: line.cable
        }));
        nextLineId = powerLines.length + 1;
      }
      if (data.finalCost !== undefined)
        document.getElementById("finalCost").value = data.finalCost;
      if (data.notes !== undefined)
        document.getElementById("notes").value = data.notes;
      
      updateTables();
      drawGrid();
    } catch (err) {
      alert("Ошибка импорта: неверный формат файла.");
    }
  };
  reader.readAsText(file);
}

function init() {
  initialCities.forEach(pt => {
    const newCity = { id: nextCityId++, x: pt.x, y: pt.y, outageHours: 0 };
    cities.push(newCity);
  });
  updateTables();
  drawGrid();
}
init();