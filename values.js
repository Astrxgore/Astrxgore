// values.js
const cableOptions = [
    {
      name: "Изолированный",
      outageFrequencyForest: 0.02,
      outageFrequencyNonForest: 0.01,
      costNonForest: 500000,
      costForest: 550000
    },
    {
      name: "Неизолированный",
      outageFrequencyForest: 0.1,
      outageFrequencyNonForest: 0.05,
      costNonForest: 400000,
      costForest: 450000
    },
    {
      name: "Длина",
      outageFrequencyForest: 0,
      outageFrequencyNonForest: 0,
      costNonForest: 1,
      costForest: 1
    }
  ];
  

const equipmentCostsFromFile = {
    "Реклоузер": 250000,
    "Выключатель": 250000,
    "Разъединитель": 20000
};
  

  // Ущерб от отключения (руб./час) для каждого города (ID 2-15)
const cityOutageCosts = {
    2: 50000, 3: 50000, 4: 50000, 5: 100000, 6: 50000, 7: 200000, 8: 50000,
    9: 200000, 10: 100000, 11: 100000, 12: 50000, 13: 50000, 14: 50000, 15: 100000
};