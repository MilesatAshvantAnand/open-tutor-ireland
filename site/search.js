import topics from './topics.js';

const exams = { lc: 'Leaving Certificate', jc: 'Junior Cycle', lb: 'Leaving Certificate Applied' };
const stopWords = new Set((
  'a about an and any are can could exercise exercises find for from get give i id im in is it its like '
  + 'looking me need of ok okay on past please practice problem problems question questions show some the to want with would you'
).split(' '));
const groups = {
  mechanics: ['forces and motion', 'force and motion', 'mechanics', 'newtonian mechanics', 'forces', 'force', 'motion'],
  algebra: ['algebra'],
};
const normalize = text => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  .replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const terms = text => text.split(' ').filter(word => word && !stopWords.has(word));
const phrase = text => terms(normalize(text)).join(' ');
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
  const groupAliases = Object.fromEntries(Object.entries(groups).map(([group, aliases]) =>
    [group, aliases.map(phrase)]));
  const indexedTopics = topics.flatMap(([aliases, year, filename, page, locator, group]) => {
    const paper = byFile.get(`${year}/${filename}`);
    if (!paper) return [];
    const [topic] = aliases.split('|');
    return [{
      ...paper, title: `${topic} · ${year} ${paper.subject}`,
      detail: `${locator} · ${paper.detail}`, href: `${paper.href}#page=${page}`,
      aliases: aliases.split('|').map(phrase), groupAliases: groupAliases[group] ?? [],
    }];
  });
  const topicPhrases = [...new Set(indexedTopics.flatMap(p => [...p.aliases, ...p.groupAliases]))]
    .sort((a, b) => b.length - a.length);
  const subjects = [...new Set(papers.map(p => normalize(p.subject)))].sort((a, b) => b.length - a.length);
  const rank = p => Number(p.course === 'lc') * 8 + Number(p.type === 'Exam Paper') * 4
    + Number(p.language === 'EV') * 2 + Number(contains(p.words, 'higher'));
  const order = (a, b) => Number(b.year) - Number(a.year) || rank(b) - rank(a);

  return raw => {
    const query = normalize(raw).replace(/\bmaths?\b/g, 'mathematics')
      .replace(/\b(leaving cert(?:ificate)?|lc) applied\b/g, 'lca')
      .replace(/\bleaving cert(?:ificate)?\b/g, 'lc').replace(/\bjunior (cert(ificate)?|cycle)\b/g, 'jc')
      .replace(/\bhl\b/g, 'higher').replace(/\bol\b/g, 'ordinary')
      .replace(/\bmark(?:ing)? schemes?\b/g, 'marking scheme')
      .replace(/\bpapers\b/g, 'paper').replace(/\bpaper 1\b/g, 'paper one').replace(/\bpaper 2\b/g, 'paper two');
    const queryTerms = terms(query);
    if (!queryTerms.length) return [];
    const match = (paper, words) => words.every(word => contains(paper.words, word));

    // Consume the longest topic phrases first. The remaining words still constrain the paper.
    const signals = new Set();
    let remaining = ` ${queryTerms.join(' ')} `;
    for (const topic of topicPhrases) {
      const padded = ` ${topic} `;
      if (!remaining.includes(padded)) continue;
      signals.add(topic);
      while (remaining.includes(padded)) remaining = remaining.replace(padded, ' ');
    }

    if (signals.size) {
      const filters = terms(remaining);
      const topicRank = paper => paper.aliases.some(alias => signals.has(alias)) ? 2
        : Number(paper.groupAliases.some(alias => signals.has(alias)));
      const topicMatches = indexedTopics.filter(p => topicRank(p) && match(p, filters));
      if (topicMatches.length) return topicMatches.sort((a, b) => topicRank(b) - topicRank(a) || order(a, b));
    }

    const subject = subjects.find(name => contains(query, name));
    const course = query.split(' ').find(word => ['lc', 'jc', 'lca'].includes(word));
    const selectedCourse = course === 'lca' ? 'lb' : course;
    return papers.filter(p => (!subject || normalize(p.subject) === subject)
      && (!selectedCourse || p.course === selectedCourse) && match(p, queryTerms)).sort(order);
  };
}
