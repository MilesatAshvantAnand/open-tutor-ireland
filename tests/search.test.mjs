import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import catalogue from '../upstream/papers/catalogue.js';
import { createSearch } from '../site/search.js';
import topics from '../site/topics.js';

const data = JSON.parse(readFileSync(new URL('../upstream/papers/data.json', import.meta.url)));
const search = createSearch(data, catalogue);

test('all indexed topic locators resolve to official paper links', () => {
  for (const [aliases, year, file, page, locator] of topics) {
    const topic = aliases.split('|')[0];
    const entries = Object.entries(data).filter(([course]) => course !== '_meta')
      .flatMap(([, subjects]) => Object.values(subjects).flatMap(years => years[year] ?? []));
    const entry = entries.find(paper => paper.url === file && paper.type === 'Exam Paper');
    assert.ok(entry, file);
    const href = catalogue.buildPaperUrl(year, entry) + '#page=' + page;
    assert.ok(search(topic).some(paper => paper.href === href && paper.detail.startsWith(locator)), topic);
  }
  assert.match(search('2026 higher physics collisions')[0].detail, /^Question 7/);
  assert.deepEqual(search('2026 ordinary physics collisions'), []);
});

test('search combines official exam, subject, year, level and material', () => {
  const maths = search('Show me 2026 HL maths paper 1');
  assert.ok(maths.length);
  assert.ok(maths.every(p => p.subject === 'Mathematics' && p.year === '2026'
    && p.type === 'Exam Paper' && /Paper One \/ Higher/.test(p.detail)));
  const schemes = search('2026 Junior Cycle Science marking schemes');
  assert.ok(schemes.length);
  assert.ok(schemes.every(p => p.course === 'jc' && p.subject === 'Science' && p.type === 'Marking Scheme'));
  const applied = search('2026 Leaving Certificate Applied Spanish');
  assert.ok(applied.length);
  assert.ok(applied.every(p => p.course === 'lb' && p.subject === 'Spanish'));
});

test('empty and unsupported queries yield no results', () => {
  for (const value of ['', '  ', '...', 'please show me', 'none-of-these-topics'])
    assert.deepEqual(search(value), []);
});

test('everyday phrases expand broad topics into relevant exam questions', () => {
  const forces = search('ok it’s physics problems from forces and motion');
  assert.ok(forces.length >= 6);
  assert.ok(forces.every(p => p.subject === 'Physics' && p.href.includes('#page=')));
  assert.ok(forces.some(p => p.title.startsWith('Projectile motion')));
  assert.ok(forces.some(p => p.title.startsWith('Circular motion')));

  const algebra = search('Can you give me some algebra questions to practice?');
  assert.ok(algebra.length >= 10);
  assert.ok(algebra.every(p => p.subject === 'Mathematics' && p.href.includes('#page=')));
  for (const topic of ['Simultaneous equations', 'Quadratics', 'Inequalities'])
    assert.ok(algebra.some(p => p.title.startsWith(topic)));
});

test('topic expansion keeps exam filters and ranks a named subtopic first', () => {
  const mechanics = search('2026 ordinary level physics questions on forces and motion');
  assert.ok(mechanics.length);
  assert.ok(mechanics.every(p => p.year === '2026' && p.subject === 'Physics' && /Ordinary Level/i.test(p.detail)));
  const juniorAlgebra = search('I want junior cycle algebra exercises on quadratic equations');
  assert.ok(juniorAlgebra.length);
  assert.ok(juniorAlgebra.every(p => p.course === 'jc' && p.subject === 'Mathematics'));
  assert.match(juniorAlgebra[0].title, /^Quadratics/);
  assert.deepEqual(search('2026 chemistry forces and motion'), []);
});
