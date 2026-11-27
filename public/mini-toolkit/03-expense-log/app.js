'use strict';

const { button, download, setStatus } = AppCore;
const storageKey = 'bikas-15-03-expense-log';
const categories = ['Food', 'Travel', 'Study', 'Transport', 'Bills', 'Housing', 'Health', 'Shopping', 'Other'];
const currencies = ['NPR', 'USD', 'INR', 'EUR', 'GBP'];
const form = document.getElementById('expense-form');
const categorySelect = form.elements.category;
const currencySelect = form.elements.currency;
const dateInput = form.elements.date;
const monthFilter = document.getElementById('month-filter');
const list = document.getElementById('expense-list');
const summary = document.getElementById('summary');
const status = document.getElementById('status');

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validExpense(item) {
  return item
    && typeof item.id === 'string'
    && typeof item.description === 'string'
    && item.description.length <= 100
    && Number.isFinite(item.amount)
    && item.amount > 0
    && Number.isSafeInteger(Math.round(item.amount * 100))
    && currencies.includes(item.currency)
    && typeof item.category === 'string'
    && item.category.length > 0
    && (item.date === '' || isValidDate(item.date));
}

function createExpenseId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadExpenses() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new TypeError('Saved expense data is not a list.');

    let migratedCount = 0;
    let skippedCount = 0;
    const valid = [];
    for (const item of parsed) {
      if (validExpense(item)) {
        valid.push(item);
      } else if (item && typeof item.name === 'string' && Number.isSafeInteger(item.cents) && item.cents > 0) {
        const migrated = {
          id: createExpenseId(),
          description: item.name.slice(0, 100),
          amount: item.cents / 100,
          currency: 'NPR',
          category: typeof item.category === 'string' && item.category ? item.category : 'Other',
          date: typeof item.date === 'string' && (item.date === '' || isValidDate(item.date)) ? item.date : ''
        };
        if (validExpense(migrated)) {
          valid.push(migrated);
          migratedCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
    if (migratedCount) setStatus(status, `${migratedCount} saved expense${migratedCount === 1 ? '' : 's'} converted to the updated format.`);
    if (skippedCount) setStatus(status, `${skippedCount} invalid saved entr${skippedCount === 1 ? 'y was' : 'ies were'} skipped.`);
    return valid;
  } catch {
    setStatus(status, 'Saved expenses could not be read. Add an expense to start a new log.');
    return [];
  }
}

const expenses = loadExpenses();

function saveExpenses() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(expenses));
    return true;
  } catch {
    setStatus(status, 'Browser storage is full or unavailable. Changes may not persist.');
    return false;
  }
}

for (const name of categories) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  categorySelect.append(option);
}
for (const code of currencies) {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = code;
  currencySelect.append(option);
}
dateInput.value = localDateValue();

function formatAmount(amount, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatTotals(entries) {
  if (entries.length === 0) return formatAmount(0, currencySelect.value);
  const totals = new Map();
  for (const expense of entries) {
    totals.set(expense.currency, (totals.get(expense.currency) || 0) + expense.amount);
  }
  return [...totals].map(([currency, amount]) => formatAmount(amount, currency)).join(' · ');
}

function expenseMonth(expense) {
  return expense.date ? expense.date.slice(0, 7) : 'undated';
}

function updateMonthOptions() {
  const selected = monthFilter.value;
  const months = [...new Set(expenses.map(expenseMonth))].sort().reverse();
  monthFilter.replaceChildren();

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All months';
  monthFilter.append(allOption);

  for (const month of months) {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month === 'undated'
      ? 'Date not set'
      : new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(`${month}-01T00:00:00Z`));
    monthFilter.append(option);
  }

  monthFilter.value = months.includes(selected) ? selected : 'all';
}

function render() {
  updateMonthOptions();
  const visible = expenses
    .filter(expense => monthFilter.value === 'all' || expenseMonth(expense) === monthFilter.value)
    .sort((first, second) => second.date.localeCompare(first.date) || second.id.localeCompare(first.id));

  summary.textContent = `${visible.length} ${visible.length === 1 ? 'expense' : 'expenses'} · Selected total: ${formatTotals(visible)} · All-time total: ${formatTotals(expenses)}`;

  list.replaceChildren();
  for (const expense of visible) {
    const item = document.createElement('li');
    const details = document.createElement('span');
    details.textContent = `${expense.date || 'Date not set'} · ${expense.description} · ${expense.category} · ${formatAmount(expense.amount, expense.currency)}`;
    const remove = button('Remove', () => {
      const index = expenses.findIndex(entry => entry.id === expense.id);
      if (index === -1) return;
      expenses.splice(index, 1);
      const saved = saveExpenses();
      render();
      if (saved) setStatus(status, 'Expense removed.');
    });
    remove.setAttribute('aria-label', `Remove expense: ${expense.description}`);
    item.append(details, remove);
    list.append(item);
  }

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = expenses.length ? 'No expenses recorded for this month.' : 'No expenses yet — add one above.';
    list.append(empty);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const description = String(values.get('description') || '').trim();
  const amount = Number(values.get('amount'));
  const currency = String(values.get('currency'));
  const category = String(values.get('category'));
  const date = String(values.get('date'));

  if (!description || description.length > 100) {
    setStatus(status, 'Enter a description between 1 and 100 characters.');
    return;
  }
  const cents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000 || !Number.isSafeInteger(cents)) {
    setStatus(status, 'Enter an amount between 0 and 100,000,000.');
    return;
  }
  if (!currencies.includes(currency) || !categories.includes(category) || !isValidDate(date)) {
    setStatus(status, 'Choose a valid category and date.');
    return;
  }

  expenses.push({
    id: createExpenseId(),
    description,
    amount: cents / 100,
    currency,
    category,
    date
  });
  const saved = saveExpenses();
  form.reset();
  dateInput.value = localDateValue();
  render();
  if (saved) setStatus(status, 'Expense added.');
  form.elements.description.focus();
});

function csvCell(value) {
  const safeValue = String(value).replace(/^\s*([=+\-@])/, "'$1");
  return `"${safeValue.replace(/"/g, '""')}"`;
}

document.getElementById('export').addEventListener('click', () => {
  if (expenses.length === 0) {
    setStatus(status, 'Add an expense before exporting.');
    return;
  }

  const rows = [
    ['Date', 'Description', 'Category', 'Currency', 'Amount'],
    ...expenses
      .slice()
      .sort((first, second) => first.date.localeCompare(second.date))
      .map(expense => [expense.date, expense.description, expense.category, expense.currency, expense.amount.toFixed(2)])
  ];
  const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`;
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'expenses.csv');
  setStatus(status, 'Expense CSV exported.');
});

monthFilter.addEventListener('change', render);
render();
