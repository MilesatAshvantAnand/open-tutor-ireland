import topics from './topics.mjs';

const exams = { lc: 'Leaving Certificate', jc: 'Junior Cycle', lb: 'Leaving Certificate Applied' };
const stopWords = new Set(['a', 'and', 'find', 'for', 'from', 'in', 'me', 'of', 'on', 'please', 'show', 'the', 'with']);
const normalize = text => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  .replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const contains = (text, phrase) => ` ${text} `.includes(` ${phrase} `);

export function createSearch(data, catalogue) {
  const papers = Object.entries(exams).flatMap(([course, exam]) =>
    Object.entries(data[course]).flatMap(([subject, years]) =>
      Object.entries(years).flatMap(([year, entries]) => entries.flatMap(entry => {
        const href = catalogue.buildPaperUrl(year, entry);
        if (!href) return [];
        const type = catalogue.classifyMaterialType(entry) || entry.type;
        const language = catalogue.getLanguagesFromEntries([entry])[0];
        const title = `${year} ${subject} · ${type}`;
        const detail = `${exam} · ${entry.details}`;
        const words = normalize(`${title} ${detail} ${course === 'lb' ? 'lca' : course} ${catalogue.LANGUAGES[language] ?? ''}`);
        return [{ course, subject, year, type, language, title, detail, words, href, filename: entry.url }];
      }))));
  const byFile = new Map(papers.filter(p => p.type === 'Exam Paper').map(p => [`${p.year}/${p.filename}`, p]));
  const indexedTopics = topics.flatMap(([aliases, year, filename, page, locator]) => {
    const paper = byFile.get(`${year}/${filename}`);
    if (!paper) return [];
    const [topic] = aliases.split('|');
    return [{
      ...paper, title: `${topic} · ${year} ${paper.subject}`,
      detail: `${locator} · ${paper.detail}`, href: `${paper.href}#page=${page}`,
      aliases: aliases.split('|').map(normalize),
    }];
  });
  const subjects = [...new Set(papers.map(p => normalize(p.subject)))].sort((a, b) => b.length - a.length);
  const rank = p => Number(p.course === 'lc') * 8 + Number(p.type === 'Exam Paper') * 4
    + Number(p.language === 'EV') * 2 + Number(contains(p.words, 'higher'));
  const order = (a, b) => Number(b.year) - Number(a.year) || rank(b) - rank(a);

  return raw => {
    const query = normalize(raw).replace(/\bmaths?\b/g, 'mathematics')
      .replace(/\b(leaving cert|lc) applied\b/g, 'lca')
      .replace(/\bleaving cert\b/g, 'lc').replace(/\bjunior (cert(ificate)?|cycle)\b/g, 'jc')
      .replace(/\bhl\b/g, 'higher').replace(/\bol\b/g, 'ordinary')
      .replace(/\bmark(?:ing)? schemes?\b/g, 'marking scheme')
      .replace(/\bpapers\b/g, 'paper').replace(/\bpaper 1\b/g, 'paper one').replace(/\bpaper 2\b/g, 'paper two');
    const terms = text => text.split(' ').filter(word => word && !stopWords.has(word));
    const match = (paper, text) => terms(text).every(word => contains(paper.words, word));
    const topicMatches = indexedTopics.filter(paper => paper.aliases.some(alias =>
      contains(query, alias) && match(paper, ` ${query} `.replace(` ${alias} `, ' ').trim())));
    if (topicMatches.length) return topicMatches.sort(order);
    if (!terms(query).length) return [];
    const subject = subjects.find(name => contains(query, name));
    const course = query.split(' ').find(word => ['lc', 'jc', 'lca'].includes(word));
    const selectedCourse = course === 'lca' ? 'lb' : course;
    return papers.filter(p => (!subject || normalize(p.subject) === subject)
      && (!selectedCourse || p.course === selectedCourse) && match(p, query)).sort(order);
  };
}
