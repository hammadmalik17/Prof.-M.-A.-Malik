"""Regenerates js/publications.js from the CV text (tools/cv_extract.md)."""
import re, json
t = open('tools/cv_extract.md').read()
def sec(a, b): return t[t.index(a):t.index(b)]
clean = lambda s: re.sub(r'\s+', ' ', re.sub(r'\[([^\]]*)\]\(([^)]*)\)', r'\2', s).replace('*', '')).strip(' ,.')
year = lambda s: (re.search(r'\b(?:19|20)\d{2}\b', re.sub(r'(ISS?N|ISBN|Paper ID|Registration ID|Rg Id|Unique ID)[^,]*', '', s, flags=re.I)) or [None])[0]
url = lambda s: (re.search(r'https?://[^\s\)\]\*]+', s) or [None])[0]
blocks = lambda s: re.split(r'\n\n(?=\**\s*\d+\**\s*\.)', s)

def papers(s, kind, manual={}):
    out = []
    for b in blocks(s)[1:]:
        n = int(re.match(r'\**\s*(\d+)', b).group(1))
        if (kind, n) in manual: d = dict(manual[(kind, n)])
        else:
            m = re.search(r'\*{5}(.+?)\*{3}(.*)', b, re.S)
            title, rest = clean(m.group(1)), m.group(2).split('**URL')[0]
            d = dict(title=title, meta=clean(rest))
        d.update(kind=kind, n=n)
        d.setdefault('year', year(d.get('meta', '')))
        d.setdefault('link', url(b))
        out.append(d)
    return out

M = {
 ('intl',17): dict(title='Harnessing Digitalization for Inclusive and Sustainable Viksit Bharat', meta='Research Nebula, ISSN 2277-8071, Volume XV, Issue 1(E), April 2026, Pages 74-84', year='2026', link='https://www.ycjournal.net/ResearchNebula/SpecialIssuesDocuments/VolumeXVIs639160259205165916.pdf'),
 ('intl',18): dict(title='GST and Its Implications on Peri-Urban Economic Activity: A Case Study in Chevella Municipal Area in Ranga Reddy District of Telangana', meta='United International Journal of Multidisciplinary Research (UIJMR), Pages 556-568, ISSN 3048-6726, Impact Factor 6.934 (SJIF), Volume 3, Special Issue VI, 2026', year='2026', link='https://www.uijmr.in/v3si9.html'),
 ('intl',19): dict(title='Changes in the Structure of Telangana Economy: An Analysis of Sectoral Shares in GSDP and Employment', meta='International Journal of Research in Social Sciences and Humanities, Pages 681-693, E-ISSN 2249-4642, P-ISSN 2454-4671, Volume 12, Issue 3, July-September 2022', year='2022', link='https://ijrssh.com/admin/upload/37%20Dr.%20M.%20A.%20Malik%2002121.pdf'),
 ('intl',20): dict(title='Changes in the Pattern of Land Utilization in Telangana: An Analytical Study', meta='International Journal of Research in Social Sciences and Humanities, Impact Factor 6.064, E-ISSN 2249-4642, P-ISSN 2454-4671, Volume 12, Issue 1, January-March 2022, Pages 747-758', year='2022', link='https://ijrssh.com/admin/upload/39%20Dr.%20M.%20A.%20Malik%2002122.pdf'),
 ('intl',21): dict(title='GST and its Implications on MSMEs: A Case Study in Chevella Municipal Area in Rangareddy District of Telangana', meta='', year=None, link=None),
 ('proc',18): dict(title='Kapilavayi Sahityam lo Bahujana Padaalu', meta='Proceedings of International Seminar on Boyibheemanna Sahityam, 23-24 Oct 2024, MVS GDC, Mahabubnagar', year='2024', link=None),
 ('proc',19): dict(title='Boyibheemanna Sahityam - Contemporary Relevance', meta='Proceedings of International Seminar on Boyibheemanna Sahityam, 3-4 Feb 2026, MVS GDC, Mahabubnagar', year='2026', link=None),
}
P = (papers(sec('***I. Papers','***II. Papers'), 'intl', M) +
     papers(sec('***II. Papers','***III. Papers'), 'natl', M) +
     papers(sec('***III. Papers','**BOOKS PUBLISHED**'), 'proc', M))
for p in P:
    if p['link'] and p['link'].startswith('http://www.ijcrt'): p['link'] = p['link'].replace('http://', 'https://')

B = []
for b in blocks(sec('**BOOKS PUBLISHED**', '**PAPERS PRESENTED'))[1:]:
    n = int(re.match(r'\**\s*(\d+)', b).group(1)); m = re.search(r'\*{5}(.+?)\*{3}(.*)', b, re.S)
    if m: title, rest = clean(m.group(1)), clean(m.group(2))
    else: title, rest = clean(re.sub(r'^\**\s*\d+\s*\.', '', b)), ''
    cat = 'Chapters' if re.search(r'Chapters', title) else 'Edited' if 'Editor' in title else 'Authored'
    B.append(dict(n=n, title=title, pub=rest, cat=cat))

C = []
for r in re.findall(r'^\| (\d+) \|(.+)\|$', t, re.M):
    c = [clean(x) for x in r[1].split(' | ')]
    typ = 'Resource Person' if 'Resource' in c[1] else 'Chair Person' if 'Chair' in c[1] else 'Paper Presentation'
    lvl = 'International' if 'Intern' in c[3] else 'State' if 'State' in c[3] else 'National'
    C.append(dict(n=int(r[0]), event=c[0], role=typ, title=c[2], level=lvl, when=c[4], org=c[5], year=year(c[4])))
C.sort(key=lambda x: (-int(x['year'] or 0), -x['n']))
open('js/publications.js', 'w').write('window.PUBS = ' + json.dumps(dict(papers=P, books=B, conferences=C), indent=1, ensure_ascii=False) + ';\n')
from collections import Counter
print(Counter(p['kind'] for p in P), len(B), Counter(b['cat'] for b in B), len(C), Counter(c['level'] for c in C), Counter(c['role'] for c in C))
print([ (p['kind'],p['n']) for p in P if not p['year']], [c['n'] for c in C if not c['year']])
