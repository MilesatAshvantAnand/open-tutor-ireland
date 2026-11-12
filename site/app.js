import { createSearch } from './search.js';

const form = document.getElementById('search');
const query = document.getElementById('query');
const status = document.getElementById('status');
const results = document.getElementById('results');
const more = document.getElementById('more');
const pageSize = 8;
let loadSearch, matches = [], shown = 0, latest = 0;

function renderMore() {
  for (const { title, detail, href } of matches.slice(shown, shown + pageSize)) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const name = document.createElement('strong');
    const metadata = document.createElement('small');
    const arrow = document.createElement('span');
    name.textContent = title;
    metadata.textContent = detail;
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    link.className = 'result';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.append(name, arrow, metadata);
    item.append(link);
    results.append(item);
  }
  const firstNewLink = results.children[shown]?.firstElementChild;
  if (shown) firstNewLink?.focus();
  shown += pageSize;
  results.hidden = !matches.length;
  more.hidden = shown >= matches.length;
}

async function search() {
  const request = ++latest;
  const value = query.value.trim();
  results.replaceChildren();
  results.hidden = more.hidden = true;
  if (!value) {
    status.textContent = '';
    return;
  }
  status.textContent = 'Searching the exam catalogue…';
  try {
    loadSearch ??= fetch('https://past-irish-examinations.vivantaneja.com/data.json')
      .then(response => {
        if (!response.ok || !globalThis.ExamCatalogue) throw new Error('Catalogue unavailable');
        return response.json();
      })
      .then(data => createSearch(data, globalThis.ExamCatalogue))
      .catch(error => { loadSearch = undefined; throw error; });
    const find = await loadSearch;
    if (request !== latest) return;
    matches = find(value);
    shown = 0;
    status.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'} for “${value}”`
      : `No matches for “${value}”. Try the subject name or browse with all filters.`;
    renderMore();
  } catch {
    if (request === latest) status.textContent = 'The catalogue is unavailable. Try again or open the full finder below.';
  }
}

form.addEventListener('submit', event => { event.preventDefault(); search(); });
query.addEventListener('input', () => { if (!query.value) search(); });
more.addEventListener('click', renderMore);
for (const button of document.querySelectorAll('.examples button')) {
  button.addEventListener('click', () => { query.value = button.textContent; search(); });
}
