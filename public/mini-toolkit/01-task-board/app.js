'use strict';

const { button, setStatus } = AppCore;
const storageKey = 'bikas-15-01-task-board';
const list = document.getElementById('list');
const form = document.querySelector('form');
const status = document.getElementById('status');
const priorities = ['High', 'Medium', 'Low'];

function loadTasks() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new TypeError('Saved tasks are not a list.');

    const tasks = parsed
      .filter(task => task && typeof task.text === 'string')
      .map(task => ({
        text: task.text,
        done: Boolean(task.done),
        priority: priorities.includes(task.priority) ? task.priority : 'Medium',
        due: typeof task.due === 'string' ? task.due : ''
      }));

    if (tasks.length !== parsed.length) {
      setStatus(status, 'Some saved tasks were invalid and were skipped.');
    }
    return tasks;
  } catch {
    setStatus(status, 'Saved tasks could not be read. Add a task to start a new list.');
    return [];
  }
}

const tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    return true;
  } catch {
    setStatus(status, 'Browser storage is full or unavailable. Changes may not persist.');
    return false;
  }
}

function addSelectOptions(select, values, labelForValue = value => value) {
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = labelForValue(value);
    select.append(option);
  }
}

const priority = document.createElement('select');
priority.name = 'priority';
priority.setAttribute('aria-label', 'Priority');
addSelectOptions(priority, priorities, value => `${value} priority`);
priority.value = 'Medium';
form.insertBefore(priority, form.querySelector('button'));

const due = document.createElement('input');
due.name = 'due';
due.type = 'date';
due.setAttribute('aria-label', 'Due date');
form.insertBefore(due, form.querySelector('button'));

const filters = document.createElement('div');
filters.className = 'toolbar';
const filterLabel = document.createElement('label');
filterLabel.append('Show tasks');
const filter = document.createElement('select');
filter.id = 'task-filter';
addSelectOptions(filter, ['all', 'open', 'done'], value => ({
  all: 'All tasks',
  open: 'Active',
  done: 'Completed'
})[value]);
filterLabel.append(filter);
const progress = document.createElement('p');
progress.className = 'muted';
progress.setAttribute('aria-live', 'polite');
filters.append(filterLabel, progress);
list.before(filters);

function renderTask(task) {
  const item = document.createElement('li');
  const text = document.createElement('span');
  text.textContent = `${task.done ? '✓ ' : ''}${task.text} · ${task.priority}${task.due ? ` · Due ${task.due}` : ''}`;
  if (task.done) text.style.textDecoration = 'line-through';

  const toggle = button(task.done ? 'Undo' : 'Complete', () => {
    task.done = !task.done;
    saveTasks();
    render();
  });
  toggle.setAttribute('aria-label', `${task.done ? 'Reopen' : 'Complete'} task: ${task.text}`);

  const remove = button('Remove', () => {
    tasks.splice(tasks.indexOf(task), 1);
    saveTasks();
    render();
  });
  remove.setAttribute('aria-label', `Remove task: ${task.text}`);
  item.append(text, toggle, remove);
  return item;
}

function render() {
  list.replaceChildren();
  const visibleTasks = tasks.filter(task =>
    filter.value === 'all' || (filter.value === 'done' ? task.done : !task.done)
  );
  for (const task of visibleTasks) list.append(renderTask(task));

  const completed = tasks.filter(task => task.done).length;
  progress.textContent = `${completed} of ${tasks.length} tasks complete`;

  if (visibleTasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = tasks.length ? 'No tasks in this view.' : 'No tasks yet — add one above.';
    list.append(empty);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const text = String(values.get('task') || '').trim();
  if (!text) {
    setStatus(status, 'Enter a task before adding it.');
    return;
  }

  tasks.unshift({
    text,
    done: false,
    priority: String(values.get('priority')),
    due: String(values.get('due') || '')
  });
  saveTasks();
  form.reset();
  priority.value = 'Medium';
  render();
  form.elements.task.focus();
});

filter.addEventListener('change', render);
render();
