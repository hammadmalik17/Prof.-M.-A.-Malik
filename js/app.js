(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const { papers, books, conferences } = PUBS, P = PROFILE;
const KIND = { intl: 'International journal', natl: 'National journal', proc: 'Conference proceedings' };
const has = (o, q) => !q || Object.values(o).join(' ').toLowerCase().includes(q.toLowerCase());
const chips = (el, opts, cur, on) => {
  el.innerHTML = opts.map(([v, l]) => `<button type="button" class="chip${v === cur ? ' on' : ''}" data-v="${esc(v)}" aria-pressed="${v === cur}">${esc(l)}</button>`).join('');
  $$('.chip', el).forEach(b => b.onclick = () => { on(b.dataset.v); chips(el, opts, b.dataset.v, on); });
};
const empty = reset => `<div class="empty">No matches. <button type="button" class="link-btn" onclick="${reset}">Clear filters</button></div>`;

/* ---------- static fills ---------- */
const pubTotal = papers.length + books.length;
const counters = [[pubTotal, 'Publications'], [books.length, 'Books'], [P.yearsTotal, 'Years of experience']];
$('#heroStats').innerHTML = counters.map(([n, l]) => `<div class="stat-item"><div class="stat-num" data-count="${n}">0</div><div class="stat-label">${l}</div></div>`).join('');
$('#aboutCounters').innerHTML = [[P.yearsTotal, 'Years in service'], [P.yearsTeaching, 'Years teaching'], [P.invitedLectures, 'Invited lectures'], [conferences.length, 'Seminar papers']]
  .map(([n, l]) => `<div class="counter-card"><span class="counter-num" data-count="${n}">0</span><span class="counter-desc">${l}</span></div>`).join('');
$('#researchStats').innerHTML = [[pubTotal, 'Total publications'], [papers.length, 'Journal & proceedings papers'], [books.length, 'Books & chapters']]
  .map(([n, l], i) => `<div class="stat-card reveal reveal-delay-${i + 1}"><span class="big-num" data-count="${n}">0</span><span class="stat-label">${l}</span></div>`).join('');
$('#themes').innerHTML = P.themes.map(t => `<span class="tag">${esc(t)}</span>`).join('');
$('#quals').innerHTML = P.qualifications.map(([t, d, y]) => `<div class="qual-item"><div class="qual-icon">◈</div><div><div class="qual-title">${esc(t)}${y ? ` <span class="yr">${y}</span>` : ''}</div><div class="qual-detail">${esc(d)}</div></div></div>`).join('');
const det = [['Nativity', P.nativity], ['Office', P.office]];
if (P.showResidence) det.push(['Residence', P.residence]);
$('#details').innerHTML = det.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
$('#timeline').innerHTML = P.career.map((c, i) => `<div class="timeline-item reveal reveal-delay-${Math.min(i, 5)}"><div class="timeline-year">${esc(c.tag)}</div><div class="timeline-role">${esc(c.role)}</div><div class="timeline-org">${esc(c.org)}</div><div class="timeline-desc">${esc(c.text)}</div></div>`).join('');
$('#awardBox').innerHTML = P.awards.map(a => `<div class="award-display reveal"><div class="award-icon">★</div><div class="award-body"><div class="award-year">Academic year ${esc(a.year)}</div><h3>${esc(a.title)}</h3><p>Conferred by the ${esc(a.by)} for distinguished service in teaching Economics.</p></div></div>`).join('');
$('#socialGrid').innerHTML = P.social.map(([r, o]) => `<div class="social-card reveal"><div class="social-role">${esc(r)}</div><div class="social-org">${esc(o)}</div></div>`).join('');
const ci = [['✉', 'Email', `<a href="mailto:${P.email}">${P.email}</a>`], ['◎', 'Institution', esc(P.office)]];
if (P.showPhone) ci.push(['☏', 'Mobile', `<a href="tel:${P.phone}">${P.phone}</a>`]);
if (P.showResidence) ci.push(['⌂', 'Residence', esc(P.residence)]);
$('#contactInfo').innerHTML = ci.map(([i, l, v]) => `<div class="contact-detail"><div class="contact-detail-icon">${i}</div><div><div class="contact-detail-label">${l}</div><div class="contact-detail-value">${v}</div></div></div>`).join('')
  + `<button type="button" class="btn-outline" id="copyMail">Copy email address</button>`;
$('#copyMail').onclick = async e => { try { await navigator.clipboard.writeText(P.email); e.target.textContent = 'Copied ✓'; } catch { e.target.textContent = P.email; } setTimeout(() => e.target.textContent = 'Copy email address', 2200); };
$('#contactForm').onsubmit = e => {
  e.preventDefault();
  const body = `${$('#fm').value}\n\n— ${$('#fn').value} (${$('#fe').value})`;
  location.href = `mailto:${P.email}?subject=${encodeURIComponent($('#fs').value)}&body=${encodeURIComponent(body)}`;
  $('#formNote').textContent = 'If nothing opened, write directly to ' + P.email;
};
$('#yr').textContent = new Date().getFullYear();

/* ---------- publications explorer ---------- */
const S = { kind: 'all', q: '', year: 'all', sort: 'new' };
const years = [...new Set(papers.map(p => p.year).filter(Boolean))].sort();
const drawChart = () => {
  const max = Math.max(...years.map(y => papers.filter(p => p.year === y).length));
  $('#yearChart').innerHTML = `<div class="yc-head"><span>Papers per year</span>${S.year !== 'all' ? `<button type="button" class="link-btn" id="yc-clear">Show all years</button>` : ''}</div><div class="yc-bars">` +
    years.map(y => { const n = papers.filter(p => p.year === y).length; return `<button type="button" class="yc-bar${S.year === y ? ' on' : ''}" data-y="${y}" aria-pressed="${S.year === y}" aria-label="${y}: ${n} papers"><span class="yc-n">${n}</span><span class="yc-fill" style="height:${Math.max(8, n / max * 100)}%"></span><span class="yc-y">${y}</span></button>`; }).join('') + '</div>';
  $$('.yc-bar').forEach(b => b.onclick = () => { S.year = S.year === b.dataset.y ? 'all' : b.dataset.y; drawChart(); drawPubs(); });
  const c = $('#yc-clear'); if (c) c.onclick = () => { S.year = 'all'; drawChart(); drawPubs(); };
};
const drawPubs = () => {
  let l = papers.filter(p => (S.kind === 'all' || p.kind === S.kind) && (S.year === 'all' || p.year === S.year) && has(p, S.q));
  l.sort((a, b) => (S.sort === 'new' ? -1 : 1) * ((+a.year || 0) - (+b.year || 0)));
  $('#pubCount').textContent = `${l.length} of ${papers.length} papers`;
  $('#pubList').innerHTML = l.length ? l.map(p => `<article class="paper-item" tabindex="0" role="button" aria-expanded="false">
    <div class="paper-main"><div class="paper-kind">${KIND[p.kind]}</div><div class="paper-title">${esc(p.title)}</div>
      <div class="paper-detail"><div>${p.meta ? `<p>${esc(p.meta)}</p>` : '<p class="muted">Citation details not yet added.</p>'}${p.link ? `<a class="paper-link" href="${esc(p.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Open paper ↗</a>` : ''}</div></div></div>
    <div class="paper-meta"><div class="paper-year">${p.year || '—'}</div><span class="caret" aria-hidden="true">+</span></div></article>`).join('') : empty('window.resetPubs()');
  $$('#pubList .paper-item').forEach(a => { const t = () => { const o = a.classList.toggle('open'); a.setAttribute('aria-expanded', o); }; a.onclick = t; a.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } }; });
};
window.resetPubs = () => { Object.assign(S, { kind: 'all', q: '', year: 'all' }); $('#pubQ').value = ''; initKind(); drawChart(); drawPubs(); };
const initKind = () => chips($('#pubKind'), [['all', `All (${papers.length})`], ...Object.entries(KIND).map(([k, l]) => [k, `${l} (${papers.filter(p => p.kind === k).length})`])], S.kind, v => { S.kind = v; drawPubs(); });
$('#pubQ').oninput = e => { S.q = e.target.value; drawPubs(); };
$('#pubSort').onchange = e => { S.sort = e.target.value; drawPubs(); };
initKind(); drawChart(); drawPubs();

/* ---------- conferences ---------- */
const C = { level: 'all', role: 'all', q: '' };
const drawConf = () => {
  const l = conferences.filter(c => (C.level === 'all' || c.level === C.level) && (C.role === 'all' || c.role === C.role) && has(c, C.q));
  $('#confCount').textContent = `${l.length} of ${conferences.length} events`;
  const g = {}; l.forEach(c => (g[c.year] ||= []).push(c));
  $('#confList').innerHTML = l.length ? Object.keys(g).sort((a, b) => b - a).map(y => `<div class="conf-year"><h3>${y}</h3><div class="conf-items">${g[y].map(c => `<article class="conf"><div class="conf-top"><span class="badge lvl-${c.level}">${c.level}</span><span class="badge role">${c.role}</span></div>
    <h4>${esc(c.title)}</h4><p class="conf-event">${esc(c.event)}</p><p class="conf-where">${esc(c.when)} · ${esc(c.org)}</p></article>`).join('')}</div></div>`).join('') : empty('window.resetConf()');
};
window.resetConf = () => { Object.assign(C, { level: 'all', role: 'all', q: '' }); $('#confQ').value = ''; initConf(); drawConf(); };
const initConf = () => {
  chips($('#confLevel'), [['all', 'All levels'], ['International', 'International'], ['National', 'National'], ['State', 'State']], C.level, v => { C.level = v; drawConf(); });
  chips($('#confRole'), [['all', 'All roles'], ['Paper Presentation', 'Papers'], ['Resource Person', 'Resource person'], ['Chair Person', 'Chair']], C.role, v => { C.role = v; drawConf(); });
};
$('#confQ').oninput = e => { C.q = e.target.value; drawConf(); };
initConf(); drawConf();

/* ---------- books ---------- */
const B = { cat: 'all', q: '' };
const drawBooks = () => {
  const l = books.filter(b => (B.cat === 'all' || b.cat === B.cat) && has(b, B.q));
  $('#bookCount').textContent = `${l.length} of ${books.length} titles`;
  $('#bookGrid').innerHTML = l.length ? l.map(b => `<div class="book-card"><div class="book-num">${String(b.n).padStart(2, '0')}</div><div class="book-title">${esc(b.title)}</div>${b.pub ? `<div class="book-pub">${esc(b.pub)}</div>` : ''}<div class="book-year">${b.cat === 'Chapters' ? 'Contributed chapters' : b.cat === 'Edited' ? 'Edited volume' : 'Author'}</div></div>`).join('') : empty('window.resetBooks()');
};
window.resetBooks = () => { B.cat = 'all'; B.q = ''; $('#bookQ').value = ''; initBooks(); drawBooks(); };
const initBooks = () => chips($('#bookCat'), [['all', `All (${books.length})`], ['Authored', 'Authored'], ['Chapters', 'Chapters'], ['Edited', 'Edited']], B.cat, v => { B.cat = v; drawBooks(); });
$('#bookQ').oninput = e => { B.q = e.target.value; drawBooks(); };
initBooks(); drawBooks();

/* ---------- chrome: particles, reveal, counters, nav, progress ---------- */
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!still) for (let i = 0; i < 18; i++) { const p = document.createElement('div'), s = Math.random() * 3 + 1; p.className = 'particle'; p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;animation-duration:${Math.random() * 15 + 12}s;animation-delay:${Math.random() * 10}s`; $('#particles').appendChild(p); }
const count = el => { const n = +el.dataset.count; if (still) { el.textContent = n; return; } const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); };
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); $$('[data-count]', e.target).concat(e.target.dataset.count ? [e.target] : []).forEach(count); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
$$('.reveal, #heroStats, .counter-card, .stat-card').forEach(el => io.observe(el));
const nav = $('#navbar'), burger = $('#burger');
burger.onclick = () => burger.setAttribute('aria-expanded', nav.classList.toggle('open'));
$$('.nav-links a').forEach(a => a.onclick = () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); });
const links = $$('.nav-links a'), secs = $$('section[id]');
const onScroll = () => {
  const h = document.documentElement; $('#progress').style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
  let cur = ''; secs.forEach(s => { if (scrollY >= s.offsetTop - 220) cur = s.id; });
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
