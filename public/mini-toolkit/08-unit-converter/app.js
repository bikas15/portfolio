'use strict';

const { setStatus } = AppCore;
const form = document.querySelector('form');
const valueInput = form.elements.value;
const status = document.getElementById('status');
const units = {
  Length: {
    km: ['Kilometres', 1000],
    m: ['Metres', 1],
    cm: ['Centimetres', 0.01],
    mi: ['Miles', 1609.344],
    ft: ['Feet', 0.3048],
    in: ['Inches', 0.0254]
  },
  Mass: {
    kg: ['Kilograms', 1],
    g: ['Grams', 0.001],
    lb: ['Pounds', 0.45359237],
    oz: ['Ounces', 0.028349523125]
  },
  Volume: {
    l: ['Litres', 1],
    ml: ['Millilitres', 0.001],
    gal: ['US gallons', 3.785411784],
    cup: ['US cups', 0.2365882365]
  },
  Temperature: {
    C: ['Celsius'],
    F: ['Fahrenheit'],
    K: ['Kelvin']
  }
};

function makeSelect(label) {
  const select = document.createElement('select');
  select.setAttribute('aria-label', label);
  return select;
}

function makeLabel(text, control) {
  const label = document.createElement('label');
  label.append(text, control);
  return label;
}

const unitCategory = makeSelect('Unit category');
for (const name of Object.keys(units)) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  unitCategory.append(option);
}

const from = makeSelect('Convert from');
const to = makeSelect('Convert to');
form.elements.unit.closest('label').replaceWith(
  makeLabel('Category', unitCategory),
  makeLabel('From', from),
  makeLabel('To', to)
);

function populateUnits() {
  const entries = Object.entries(units[unitCategory.value]);
  for (const select of [from, to]) {
    select.replaceChildren(...entries.map(([key, [name]]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = name;
      return option;
    }));
  }
  if (entries.length > 1) to.selectedIndex = 1;
}

function toCelsius(value, unit) {
  if (unit === 'C') return value;
  if (unit === 'F') return (value - 32) * 5 / 9;
  return value - 273.15;
}

function fromCelsius(value, unit) {
  if (unit === 'C') return value;
  if (unit === 'F') return value * 9 / 5 + 32;
  return value + 273.15;
}

unitCategory.addEventListener('change', populateUnits);
populateUnits();

form.addEventListener('submit', event => {
  event.preventDefault();
  const value = Number(valueInput.value);
  if (!Number.isFinite(value)) {
    setStatus(status, 'Enter a valid number.');
    return;
  }

  const categoryUnits = units[unitCategory.value];
  let converted;
  if (unitCategory.value === 'Temperature') {
    const celsius = toCelsius(value, from.value);
    if (celsius < -273.15) {
      setStatus(status, 'Temperature cannot be below absolute zero.');
      return;
    }
    converted = fromCelsius(celsius, to.value);
  } else {
    converted = value * categoryUnits[from.value][1] / categoryUnits[to.value][1];
  }

  const formatted = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 9 }).format(converted);
  setStatus(status, `${valueInput.value} ${categoryUnits[from.value][0]} = ${formatted} ${categoryUnits[to.value][0]}`);
});
