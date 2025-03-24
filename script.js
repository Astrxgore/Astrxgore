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
  updateOutageHoursTable();
  updateCitiesTable();
  updateLinesTable();
}

function updateOutageHoursTable() {
  // Предполагается, что в HTML есть элемент <table id="outageHoursTable"> с <tbody>
  const tbody = document.querySelector("#outageHoursTable tbody");
  tbody.innerHTML = "";
  
  // Если нужно добавить пустые строки до определённого количества (например, 15 строк),
  // можно добавить цикл while ниже. Но здесь высота равна количеству линий.
  let lineIndex = 0;
  while(lineIndex < powerLines.length) {
    const line = powerLines[lineIndex];
    // Если для линии не инициализирован объект для outage часов, создаём его:
    if (!line.lineOutageHours) {
      line.lineOutageHours = {};
      for (let cityId = 2; cityId <= 15; cityId++) {
        line.lineOutageHours[cityId] = "";
      }
    }
    const tr = document.createElement("tr");
    // Первая ячейка с информацией о линии:
    const tdLineInfo = document.createElement("td");
    tdLineInfo.innerText = `${line.city1.id} - ${line.city2.id}`;
    tr.appendChild(tdLineInfo);
    
    // Далее 14 ячеек для городов от 2 до 15.
    for (let cityId = 2; cityId <= 15; cityId++) {
      const td = document.createElement("td");
      // Создаем input
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.style.width = "40px";
      // Если значение равно 0 или не задано, оставляем поле пустым
      if (line.lineOutageHours[cityId] && +line.lineOutageHours[cityId] !== 0)
        input.value = line.lineOutageHours[cityId];
      else
        input.value = "";
      
      // Добавляем обработчик ввода:
      input.addEventListener("input", function() {
        // Если введённое значение равно 0 или пустое, сохраняем как пустую строку
        const val = this.value.trim();
        line.lineOutageHours[cityId] = (val === "" || +val === 0) ? "" : +val;
        // При необходимости можно обновить итоговые показатели
      });
      
      td.appendChild(input);
      tr.appendChild(td);
    }
    
    tbody.appendChild(tr);
    lineIndex++;
  }
  

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
  updateCitiesTable();
  drawGrid();
}

// Удаление линии
function deleteLine(lineId) {
  powerLines = powerLines.filter(line => line.id !== lineId);
  updateTables();
  updateCitiesTable();
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
  updateCitiesTable();
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
  updateCitiesTable();
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
    updateCitiesTable();
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
      updateCitiesTable();
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



function exportLayout() {
  const data = {
    cities: cities,
    powerLines: powerLines.map(line => {
      return {
        city1: line.city1,
        city2: line.city2,
        equipment1: line.equipment1,
        equipment2: line.equipment2,
        cable: line.cable,
        lineOutageHours: line.lineOutageHours  // добавляем данные часов отключений
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
          cable: line.cable,
          lineOutageHours: line.lineOutageHours ? line.lineOutageHours : {} // восстанавливаем данные часов
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


function getColumnLetter(index) {
  let letter = "";
  while (index >= 0) {
      letter = String.fromCharCode(65 + (index % 26)) + letter;
      index = Math.floor(index / 26) - 1;
  }
  return letter;
}

function exportToExcel() {
  // Создаём новую книгу
  let wb = XLSX.utils.book_new();

  // Исходный массив данных (AOA) для экспорта информации по ЛЭП
  let ws_data = [
    // Заголовок – первые 8 строк (индексы 0..7)
    ["", "", "Линии"],
    ["", ""],
    ["Реклоузеры/выключатели", ""],
    ["разъединители", ""],
    ["Тип провода", ""],
    ["Длина, км", ""],
    ["λ, раз в год", ""],
    ["Стоимость  ЛЭП", ""]
  ];

  let cnt = 0;
  // Заполнение данных по линиям на основе массива powerLines
  powerLines.forEach(line => {
    cnt += 1;
    let result = calculateLineCost(line.city1, line.city2);
    let nonForest = result.nonForestLength / cellSize / 2;
    let forest = result.forestLength / cellSize / 2;
    
    // Записываем идентификатор линии (город-город) во вторую строку (индекс 1)
    ws_data[1].push(`${line.city1.id} - ${line.city2.id}`);
    
    // Реклоузеры/выключатели – строка с индексом 2
    let eqCount = 0;
    if (line.equipment1 === "Реклоузер") eqCount++;
    if (line.equipment2 === "Реклоузер") eqCount++;
    if (line.equipment1 === "Выключатель") eqCount++;
    if (line.equipment2 === "Выключатель") eqCount++;
    ws_data[2].push(eqCount);
    
    // Разъединители – строка с индексом 3
    let disCount = 0;
    if (line.equipment1 === "Разъединитель") disCount++;
    if (line.equipment2 === "Разъединитель") disCount++;
    ws_data[3].push(disCount);
    
    // Тип провода – строка с индексом 4, 2 для "Изолированный", 1 для "Неизолированный"
    let cableType = "";
    if (line.cable && line.cable.name === "Изолированный") cableType = 2;
    if (line.cable && line.cable.name === "Неизолированный") cableType = 1;
    ws_data[4].push(cableType);
    
    // Длина, км – строка с индексом 5
    ws_data[5].push(nonForest);
    
    // λ, раз в год – строка с индексом 6, используем формулы с условием
    ws_data[6].push({ t: "n", f: `=IF(${getColumnLetter(1 + cnt)}5=1,${getColumnLetter(1 + cnt)}6*0.05,${getColumnLetter(1 + cnt)}6*0.01)`, z: "#,##0.000" });
    
    // Стоимость ЛЭП – строка с индексом 7
    ws_data[7].push({ t: "n", f: `=IF(${getColumnLetter(1 + cnt)}5=1,${getColumnLetter(1 + cnt)}6*400000,${getColumnLetter(1 + cnt)}6*500000)`, z: "#,##0.000" });
    
    // Если есть лесная часть линии – добавляем отдельную запись
    if (result.forestLength) {
      cnt += 1;
      ws_data[1].push(`${line.city1.id} - ${line.city2.id} лес`);
      ws_data[2].push("");
      ws_data[3].push("");
      let cableTypeForest = 0;
      if (line.cable && line.cable.name === "Изолированный") cableTypeForest = 2;
      if (line.cable && line.cable.name === "Неизолированный") cableTypeForest = 1;
      ws_data[4].push(cableTypeForest);
      ws_data[5].push(forest);
      ws_data[6].push({ t: "n", f: `=IF(${getColumnLetter(1 + cnt)}5=1,${getColumnLetter(1 + cnt)}6*0.1,${getColumnLetter(1 + cnt)}6*0.02)`, z: "#,##0.000" });
      ws_data[7].push({ t: "n", f: `=IF(${getColumnLetter(1 + cnt)}5=1,${getColumnLetter(1 + cnt)}6*450000,${getColumnLetter(1 + cnt)}6*550000)`, z: "#,##0.000" });
    }
  });

  // Итоговые строки (суммарные формулы)
  ws_data.push(["Сумма стоимостей ЛЭП:", "", { t: "n", f: `=SUM(C8:XFD8)`, z: "#,##0.000" }]);
  ws_data.push(["Стоимость оборудования:", "", { t: "n", f: `=SUM(C3:XFD3)*250000+SUM(C4:XFD4)*20000`, z: "#,##0.000" }]);
  ws_data.push(["Стоимость постройки:", "", null]);
  ws_data[ws_data.length - 1][2] = { t: "n", f: "SUM(C9:C10)", z: "#,##0.000" };

  // Если строк в ws_data меньше 15 – добавляем пустые строки, чтобы новая таблица начиналась с 15-й строки (индекс 14)
  while (ws_data.length < 12) {
    ws_data.push([]);
  }

  // --- Таблица для ввода времени восстановления (часы) ---
  // Заголовок новой таблицы будет располагаться в строке с индексом 11 (12-я строка Excel)
  let newTableHeader = [];
  newTableHeader[0] = "Восст. время (час.)";
  // Можно добавить дополнительные заголовки, если необходимо
  ws_data[11] = newTableHeader;

  // Запоминаем стартовую строку для таблицы с часами (для ссылок в формулах новой таблицы)
  const hoursTableStartRow = 12; // 0-based, соответствует 13-й строке Excel

  // При формировании таблицы по городам, для каждого города от 2 до 15:
  // каждую строку начинаем с двух ячеек: пустая и номер города, далее для каждой линии – значение часов (возможно, дублируется для лесной части)
  powerLines.forEach(line => {
    // здесь можно предварительно сформировать массив индикаторов (например, для учета лесных частей)
    // если логика та же, что и ниже, используем её в цикле по городам
  });
  // Для упрощения, предположим, что порядок и количество столбцов в таблице часов определяется обходом powerLines:
  // создадим массив, где для каждой линии записано сколько столбцов добавить (1 или 2)
  let powerLineCols = [];
  powerLines.forEach(line => {
    let cols = 1;
    if (calculateLineCost(line.city1, line.city2).forestLength) {
      cols = 2;
    }
    powerLineCols.push(cols);
  });

  // Формирование таблицы часов (если её ещё нет) – аналогично вашему коду
  for (let city = 2; city <= 15; city++) {
    let row = ["", `${city}`]; // первый столбец – пустой, второй – номер города
    powerLines.forEach((line, idx) => {
      let curCityXLine = line.lineOutageHours[city] || "";
      row.push(curCityXLine);
      if (powerLineCols[idx] === 2) {
        row.push(curCityXLine);
      }
    });
    ws_data.push(row);
  }
  // На этом этапе таблица с часами уже сформирована.
  // Теперь запомним, сколько столбцов отведено под данные по линиям в таблице часов.
  // В строке часов, первые 2 ячейки – не данные, далее идут данные по линиям.
  let hoursDataCols = ws_data[ws_data.length - (15 - 2)][0] ? ws_data[ws_data.length - (15 - 2)].length - 2 : 0;
  // Если точное число не нужно вычислять динамически, можно ориентироваться на порядок формирования.

  // --- Новая таблица: произведение часа на множитель из первой таблицы ---
  // Расположим новую таблицу ниже уже имеющихся данных.
  let newTableStartRow = ws_data.length; // новая таблица начинается с этой строки
  // Добавим заголовок для новой таблицы
  let newTable2Header = [];
  newTable2Header[0] = "Восст. время * множитель";
  ws_data.push(newTable2Header);

  // Для каждой строки (города от 2 до 15) формируем строку новой таблицы:
  // первые две ячейки – пустая и номер города, далее для каждого powerLine создаем ячейку с формулой,
  // где значение равно: значение из таблицы часов (которая находится в фиксированном месте) умноженное на множитель из первой таблицы (строка 7, колонка соответствующая)
  let whereissum = 0;
  let whereisrow;
  for (let city = 2; city <= 15; city++) {
    let newRow = ["", `${city}`];
    // Определим Excel-номер строки для исходной таблицы с часами для данного города:
    let hoursRowExcel = hoursTableStartRow + (city - 2) + 1; // +1 для перехода к 1-based нумерации в Excel
    // Запускаем счётчик для столбцов powerLine (начиная с колонки C в исходной таблице, то есть индекс 2)
    let colOffset = 0;
    powerLines.forEach((line, idx) => {
      // Для каждой линии получаем количество столбцов (1 или 2)
      let cols = powerLineCols[idx];
      for (let j = 0; j < cols; j++) {
        // Вычисляем абсолютный номер столбца в исходной таблице с часами.
        // Данные по линиям начинаются с колонки 3 (индекс 2), поэтому:
        let absCol = 2 + colOffset; 
        let colLetter = getColumnLetter(absCol); // +1, так как Excel колонки 1-based (A=1)
        // Множитель находится в первой таблице, строка 7 (0-based) -> Excel row 8
        let multiplierCell = `${colLetter}7`;
        // Адрес ячейки с часами для данного города: она находится в исходной таблице часов.
        let hoursCell = `${colLetter}${hoursRowExcel}`;
        // Формула – произведение: =<hoursCell> * <multiplierCell>
        let formula = `=${hoursCell}*${multiplierCell}`;
        newRow.push({ t: "n", f: formula, z: "#,##0.000" });
        colOffset++;
      }
    });
    // После заполнения данных по линиям добавляем ячейку с формулой суммы строки (суммируются столбцы с данными, то есть от C до последнего)
    // Определяем адреса: начальная колонка для суммы – C (Excel), а конечная – вычисляем по количеству ячеек в строке.
    let startSumCol = "C";
    let lastColLetter = getColumnLetter(newRow.length - 1); // newRow.length даст общее число ячеек в строке
    // Excel-номер строки для новой таблицы: newTableStartRow + (city - 2) + 1 (1-based)
    let newRowExcel = newTableStartRow + (city);
    // Формула суммы:
    let sumFormula = `=SUM(${startSumCol}${newRowExcel}:${lastColLetter}${newRowExcel})`;
    newRow.push({ t: "n", f: sumFormula, z: "#,##0.000" });
    // Следующая ячейка – сумма, умноженная на коэффициент (подставьте нужный коэффициент вместо COEFF)
    let multFormula = `=${getColumnLetter(newRow.length - 1)}${newRowExcel}*${cityOutageCosts[city]}`; // COEFF оставляем как плейсхолдер
    whereisrow = newRow;
    whereissum = newRowExcel;
    newRow.push({ t: "n", f: multFormula, z: "#,##0.000" });
    ws_data.push(newRow);
  }
  ws_data.push([])
  ws_data[ws_data.length - 1].push([])
  ws_data[ws_data.length - 1][0] = { t: "n", f: `SUM(${getColumnLetter(whereisrow.length - 1)}28:${getColumnLetter(whereisrow.length - 1)}${whereissum})`, z: "#,##0.000" };

  // --- Формирование листа и настройка объединений для исходной таблицы ---
  let ws = XLSX.utils.aoa_to_sheet(ws_data);
  
  let merges = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 1 } }, // объединяем A1:B2
    { s: { r: 0, c: 2 }, e: { r: 0, c: 1 + cnt } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 1 } },
    { s: { r: 11, c: 0 }, e: { r: 11, c: 1 } },
    { s: { r: 12, c: 0 }, e: { r: 12 + 13, c: 0 } } // пример объединения для левого столбца новой части
  ];
  
  ws["!merges"] = merges;
  
  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(wb, ws, "ЛЭП");
  
  // Сохраняем файл
  XLSX.writeFile(wb, "export.xlsx");
}



function updateCitiesTable() {
  const tbody = document.querySelector("#citiesTable tbody");
  tbody.innerHTML = "";
  
  // Если не нужно удалять главный город (id = 1), можно пропускать его:
  cities.forEach(city => {
    if (city.id === 1) return; // если главный город не подлежит удалению
    const tr = document.createElement("tr");
    const tdId = document.createElement("td");
    tdId.innerText = city.id;
    const tdCoords = document.createElement("td");
    tdCoords.innerText = `x: ${city.x}, y: ${city.y}`;
    const tdActions = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "Удалить";
    deleteBtn.addEventListener("click", function() {
      deleteCity(city.id);
      updateCitiesTable();
    });
    
    tdActions.appendChild(deleteBtn);
    tr.appendChild(tdId);
    tr.appendChild(tdCoords);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });
}




function init() {
  initialCities.forEach(pt => {
    const newCity = { id: nextCityId++, x: pt.x, y: pt.y, outageHours: 0 };
    cities.push(newCity);
  });
  updateTables();
  updateCitiesTable();
  drawGrid();
}
init();