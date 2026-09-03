// Pages render via anentrypoint-design SDK kits (window.ds).
// Each page follows a canonical kit grammar:
//   home    is ui_kits/homepage   (Hero + works panel rows + writing + manifesto)
//   project is ui_kits/project_page (Side rail + narrow main + Install/Receipt/Changelog)
//   lore    is ui_kits/homepage Writing pattern (numbered post rows in a panel)
//   org     is ui_kits/gallery + homepage (Side jump-nav + panel-per-category .row catalog)
//   tv      is custom (no SDK kit covers video broadcast; chrome stays SDK)
//   blog    is ui_kits/homepage Writing pattern (same shape as lore: numbered
//           rows in a panel), sourced from lib/blog-posts.json instead of
//           a hardcoded list, each row linking out to the real post.

import { projects, categories, showcaseFor, rankByActivity, activityFor } from './projects.js';
import { CommunityPage, JoinLink, DISCORD_INVITE, loadBlogPosts, blogPosts } from './community.js';

const ds = () => window.ds || {};
const C = () => (window.ds && window.ds.components) || {};
const h = (...a) => ds().h(...a);

const NAV_ITEMS = [
    ['Projects', '/#/home'],
    ['Community', '/#/community'],
    ['Blog', '/#/blog'],
    ['Lore', '/#/lore'],
    ['TV', '/#/tv'],
    ['Index', '/#/org'],
];

const NAV_LABEL_BY_ACTIVE = { home: 'Projects', community: 'Community', blog: 'Blog', lore: 'Lore', tv: 'TV', org: 'Index' };

function onNav(label) {
    const entry = NAV_ITEMS.find(([l]) => l === label);
    if (entry) location.hash = entry[1].replace(/^\/?#/, '');
}

function Topbar(active) {
    // No leaf: the brand stays just "247420". The active nav item is already
    // highlighted, and the crumb row below carries the path — passing a leaf
    // here renders "247420 / Projects" a second time above that crumb.
    return C().Topbar({
        brand: '247420',
        items: NAV_ITEMS,
        active: NAV_LABEL_BY_ACTIVE[active] || '',
        onNav,
    });
}

function ThemeToggleSlot() {
    const Toggle = C().ThemeToggle;
    return Toggle ? Toggle({}) : null;
}

// community.js renders its own AppShell and needs the identical topbar + theme
// toggle without importing back into this module (circular). Expose them once.
window.__topbar = Topbar;
window.__themeToggle = ThemeToggleSlot;

// small helpers

function categoryColor(cat) {
    const c = categories.find(x => x.id === cat);
    return c ? c.color : 'g-mascot';
}

function projectSlug(p) {
    return p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function findProject(idOrSlug) {
    if (!idOrSlug) return null;
    return projects.find(p => p.code === idOrSlug)
        || projects.find(p => projectSlug(p) === idOrSlug)
        || null;
}

// HomePage — homepage-kit grammar

function HomePage(state) {
    const Panel = C().Panel;
    const Heading = C().Heading;
    const Lede = C().Lede;
    const Chip = C().Chip;
    const opened = state.openedHomeCode || null;

    // Feature only what's actually being worked on: tier 2 = real commits in
    // the last 14 days (see activityFor in lib/projects.js). Dormant/untouched
    // projects (tier 1) and archived ones (tier 0) don't belong on the front
    // door — a project idle for months showing up here, even ranked last, is
    // still wrong. They stay reachable from the org catalog, not the homepage.
    const live = projects.filter(p => activityFor(p.code).tier === 2);
    const lead = live.filter(p => p.title === 'gm');
    const rest = rankByActivity(live.filter(p => !lead.includes(p)));
    const ordered = [...lead, ...rest];

    // Editorial Hero — asymmetric grid-template-areas layout (.ds-hero), the
    // house pattern this SDK mandates (AGENTS.md "asymmetric grid tension...
    // never a centered stack"). Replaces the former single-column hero block.
    const Hero = C().Hero({
        title: 'the creative department of the internet.',
        body: '247420 is a collective of mercurials shipping rough drafts since 2018. tools you reach for when an agent needs to behave.',
        accent: 'humor is load-bearing.'
    });

    // "shipping this week" strip — real numbers, not a marketing claim: how
    // many catalog projects actually had a GitHub push in the last 7 days,
    // read straight off activityFor's daysAgo, plus the archived count as the
    // honest counterweight. Kpi renders it as plain toned numbers, no chart.
    const Kpi = C().Kpi;
    const shippingCount = projects.filter(p => activityFor(p.code).daysAgo <= 7).length;
    const activeCount = projects.filter(p => activityFor(p.code).tier === 2).length;
    const archivedCount = projects.filter(p => activityFor(p.code).tier === 0).length;
    const shippingStrip = Kpi ? Kpi({ items: [
        [shippingCount, 'shipped this week'],
        [activeCount, 'active (30d)'],
        [projects.length, 'total in the catalog'],
        [archivedCount, 'archived']
    ]}) : null;

    const renderRow = (p) => {
        const isOpen = opened === p.code;
        const sc = showcaseFor(p.code);
        const stars = (sc && sc.stars !== undefined) ? sc.stars : p.stars;
        const meta = (stars > 0 ? stars + '  ' : '') + (isOpen ? '-' : '+');
        return h('div', { key: p.code },
            h('div', {
                class: 'row' + (isOpen ? ' active' : ''),
                onclick: () => { state.openedHomeCode = isOpen ? null : p.code; window.__router.render(); }
            },
                h('span', { class: 'code' }, p.code),
                h('span', { class: 'title' },
                        p.title,
                    h('span', { class: 'sub' }, p.sub)
                ),
                h('span', { class: 'meta' }, meta)
            ),
            isOpen ? h('div', { class: 'work-detail' },
                h('p', { class: 'ds-prose ds-work-body' }, p.body),
                h('div', { class: 'work-detail-chips' },
                    Chip({ tone: 'accent', children: p.cat }),
                    ...(p.tags || []).slice(0, 4).map((t, i) => Chip({ key: i, tone: 'dim', children: t }))
                ),
                h('div', { class: 'ds-work-actions' },
                    h('a', { class: 'btn-primary', href: '/#/p/' + projectSlug(p) }, 'open page'),
                    h('a', { class: 'btn', href: p.url, target: '_blank', rel: 'noopener' }, 'source')
                )
            ) : null
        );
    };

    const worksPanel = Panel({
        title: 'works, ' + ordered.length + ' of ' + projects.length,
        right: h('a', { href: 'https://github.com/AnEntrypoint', target: '_blank', rel: 'noopener', class: 'panel-head-link' }, 'all repos'),
        children: ordered.map(renderRow)
    });

    const Manifesto = C().Manifesto ? C().Manifesto({ paragraphs: [
        { text: 'we are the creative department of the internet. always open (24/7). always a little bit high on possibility (420).' },
        { text: 'move fast. break things on purpose. document honestly. ship the rough draft. humor is load-bearing.' },
        { text: 'we will not tolerate simpleton design patterns, trifectas, gradients, or anything silly. nothing lame. we\'re internet natives and not easily pleased.', dim: true }
    ]}) : null;

    // The front door invites you into the room straight away. The projects are
    // the work; the discord is where the work happens. Loud, first, honest.
    const joinBanner = h('div', { class: 'home-join' },
        h('div', {},
            h('span', { class: 'home-join-eyebrow' }, 'the room is on discord'),
            h('p', { class: 'ds-prose home-join-line' }, 'this is the window. the bar is on discord — 1,300+ people posting, riffing, and shipping rough drafts all day. take your shoes off and come in.')
        ),
        h('div', { class: 'home-join-actions' },
            JoinLink({ variant: 'btn-primary', label: 'join the discord' }),
            h('a', { class: 'btn', href: '/#/community' }, 'what goes on in there'),
            h('a', { class: 'btn', href: '/#/blog' }, 'weekly progress blog')
        )
    );

    const main = [Hero, shippingStrip, joinBanner, worksPanel].filter(Boolean);
    if (Manifesto) main.push(h('section', { class: 'ds-section' }, h('h3', {}, 'manifesto, rough draft'), Manifesto));

    return C().AppShell({
        topbar: Topbar('home'),
        crumb: C().Crumb({
            trail: ['247420'], leaf: 'projects',
            right: [Chip({ tone: 'dim', children: 'probably emerging' }), ThemeToggleSlot()]
        }),
        main
    });
}

// LorePage — homepage Writing pattern (index of posts)

function LorePage(state) {
    const Panel = C().Panel;
    const Heading = C().Heading;
    const Lede = C().Lede;
    const Chip = C().Chip;
    const opened = state.openedLoreId || null;

    const rules = [
        { n: '01', t: 'ship the rough draft.',          b: 'perfection is just a procrastination strategy with better marketing. ship it tuesday. fix it wednesday.' },
        { n: '02', t: 'humor is load-bearing.',         b: 'if the docs aren\'t a little bit funny, nobody reads them. if nobody reads them, they don\'t exist. comedy is documentation.' },
        { n: '03', t: 'deterministic over clever.',     b: 'clever AI demos make great tweets and bad infrastructure. boring is the goal. "it usually works" is not a property.' },
        { n: '04', t: 'observability is non-negotiable.', b: 'window.__debug exposes everything. if you can\'t inspect it at runtime, it doesn\'t ship.' },
        { n: '05', t: 'no faith-based engineering.',    b: 'either it\'s deterministic or it\'s a casino. casinos belong in vegas, not in our agent loop.' },
        { n: '06', t: 'document honestly.',             b: 'include the part where it broke. include the part you don\'t understand yet. the rough draft is the documentation.' }
    ];

    const renderPost = (r) => {
        const isOpen = opened === r.n;
        return h('div', { key: r.n },
            h('div', {
                class: 'row' + (isOpen ? ' active' : ''),
                onclick: () => { state.openedLoreId = isOpen ? null : r.n; window.__router.render(); }
            },
                h('span', { class: 'code' }, r.n),
                h('span', { class: 'title' }, r.t, h('span', { class: 'sub' }, 'commandment')),
                h('span', { class: 'meta' }, isOpen ? '-' : '+')
            ),
            isOpen ? h('div', { class: 'work-detail' },
                h('p', { class: 'ds-prose ds-work-body' }, r.b)
            ) : null
        );
    };

    const main = [
        Heading({ level: 1, children: 'bar rules.' }),
        Lede({ children: 'the manifesto, in six commandments. rough draft. amended whenever the bar gets new patrons.' }),
        Panel({
            title: 'commandments, 06 of 06',
            right: h('span', {}, 'manifesto, rough draft'),
            children: rules.map(renderPost)
        }),
        h('section', { class: 'ds-section' },
            h('h3', {}, 'chronicles'),
            C().Manifesto ? C().Manifesto({ paragraphs: [
                { text: '247420 started in 2018 as a joke about hours and herbs and accreted into infrastructure. AnEntrypoint fell out of it — a structured flag for builders who wanted fewer whitepapers and more PRs.' },
                { text: 'the joke is the infrastructure now. reality blurs, memes compile, the broadcast keeps running.' },
                { text: 'every gm pattern, every gm-cc workflow gets validated on the air. real users, real timing, real consequences. not a lab.', dim: true }
            ]}) : null
        )
    ];

    return C().AppShell({
        topbar: Topbar('lore'),
        crumb: C().Crumb({
            trail: ['247420', 'writing'], leaf: 'bar-rules',
            right: [Chip({ tone: 'dim', children: 'manifesto, rough draft' }), ThemeToggleSlot()]
        }),
        main
    });
}

// BlogPage — homepage Writing pattern, sourced from lib/blog-posts.json

function blogDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function blogBodyBlock(b, i) {
    if (b.type === 'heading') return h(b.tag || 'h3', { key: i, class: 'ds-prose' }, b.text);
    if (b.type === 'quote') return h('blockquote', { key: i, class: 'ds-prose' }, b.text);
    return h('p', { key: i, class: 'ds-prose' }, b.text);
}

function BlogPostPage(state) {
    const slug = state.params && state.params[0];
    const post = blogPosts().find(p => p.slug === slug);
    const Heading = C().Heading;
    const Lede = C().Lede;
    const Chip = C().Chip;

    if (!post) {
        return C().AppShell({
            topbar: Topbar('blog'),
            crumb: C().Crumb({ trail: ['247420', 'blog'], leaf: 'not found', right: [ThemeToggleSlot()] }),
            narrow: true,
            main: [
                Heading({ level: 1, children: 'post not found' }),
                Lede({ children: ['"' + (slug || '') + '" isn\'t in the archive. ', h('a', { href: '/#/blog' }, 'back to weekly progress')] })
            ]
        });
    }

    const main = [
        h('a', { class: 'crumb-link', href: '/#/blog' }, '<- weekly progress'),
        Heading({ level: 1, children: post.title }),
        Lede({ children: blogDate(post.publishedAt) }),
        h('section', { class: 'ds-section' }, (post.body || []).map(blogBodyBlock))
    ];

    return C().AppShell({
        topbar: Topbar('blog'),
        crumb: C().Crumb({
            trail: ['247420', 'blog'], leaf: post.slug,
            right: [Chip({ tone: 'dim', children: 'weekly progress' }), ThemeToggleSlot()]
        }),
        narrow: true,
        main
    });
}

function BlogPage(state) {
    if (state && state.params && state.params[0]) return BlogPostPage(state);

    const Panel = C().Panel;
    const Heading = C().Heading;
    const Lede = C().Lede;
    const Chip = C().Chip;

    const posts = blogPosts();

    const renderPost = (p) => h('a', {
        key: p.slug,
        class: 'row',
        href: '/#/blog/' + p.slug
    },
        h('span', { class: 'code' }, blogDate(p.publishedAt)),
        h('span', { class: 'title' }, p.title, p.description ? h('span', { class: 'sub' }, p.description) : null),
        h('span', { class: 'meta' }, 'read')
    );

    const main = [
        Heading({ level: 1, children: 'weekly progress.' }),
        Lede({ children: 'what actually shipped across the AnEntrypoint org and the 247420 collective, one post per week, pulled straight from git history.' }),
        posts.length
            ? Panel({
                title: `weekly progress, ${posts.length} of ${posts.length}`,
                children: posts.map(renderPost)
            })
            : Panel({
                title: 'weekly progress',
                children: [h('div', { class: 'row' },
                    h('span', { class: 'title' }, 'couldn\'t load the post index',
                        h('span', { class: 'sub' }, 'try refreshing — the archive is generated at deploy time.'))
                )]
            })
    ];

    return C().AppShell({
        topbar: Topbar('blog'),
        crumb: C().Crumb({
            trail: ['247420'], leaf: 'blog',
            right: [Chip({ tone: 'dim', children: 'weekly progress' }), ThemeToggleSlot()]
        }),
        main
    });
}

// OrgPage — gallery+homepage hybrid (Side jump nav + per-category panels)

function OrgPage(state) {
    const Panel = C().Panel;
    const Heading = C().Heading;
    const Lede = C().Lede;
    const Chip = C().Chip;
    const Side = C().Side;

    const groups = categories
        .map(c => ({ c, items: projects.filter(p => p.cat === c.id) }))
        .filter(g => g.items.length);

    const gmProject = projects.find(p => p.title === 'gm');
    const reachSecond = rankByActivity(projects.filter(p => p !== gmProject && activityFor(p.code).tier === 2))[0];
    const reachForFirst = [gmProject, reachSecond].filter(Boolean)
        .map(p => ({ label: p.title, href: '/#/p/' + projectSlug(p) }));

    const sideSections = [
        { group: 'jump', items: groups.map(({ c, items }) => ({
            label: c.label,
            href: '#cat-' + c.id,
            count: items.length,
        })) },
        { group: 'reach for first', items: reachForFirst },
        { group: 'links', items: [
            { label: 'discord',    href: DISCORD_INVITE },
            { label: 'github org', href: 'https://github.com/AnEntrypoint' },
            { label: 'broadcast',  href: '/#/tv' }
        ] }
    ];

    const renderRow = (p) => {
        const sc = showcaseFor(p.code);
        const stars = (sc && sc.stars !== undefined) ? sc.stars : p.stars;
        const tier = activityFor(p.code).tier;
        const statusWord = tier === 2 ? 'active' : (tier === 1 ? 'dormant' : 'archived');
        return h('a', {
            key: p.code,
            class: 'row',
            href: '/#/p/' + projectSlug(p)
        },
            h('span', { class: 'code' }, p.code),
            h('span', { class: 'title' },
                p.title,
                h('span', { class: 'sub' }, p.sub),
                h('span', { class: 'row-status' + (tier === 2 ? ' g-green' : '') }, statusWord)
            ),
            h('span', { class: 'meta' }, stars > 0 ? String(stars) : '—')
        );
    };

    const heroPanel = Panel({
        title: 'when you reach for this stack',
        children: [
            h('p', { class: 'ds-prose' },
                'when an agent is drifting and you want it on rails. when a Claude Code task fans out and you want it parallel. when you need to know that what worked on a slide yesterday still works on the air today.'
            ),
            h('div', { class: 'row' },
                h('span', { class: 'code' }, 'gm'),
                h('span', { class: 'title' }, 'inside the agent loop', h('span', { class: 'sub' }, 'PLAN, EXECUTE, EMIT, VERIFY on every turn')),
                h('span', { class: 'meta' }, 'p/gm')
            ),
            h('div', { class: 'row' },
                h('span', { class: 'code' }, 'agentplug'),
                h('span', { class: 'title' }, 'when the work fans out', h('span', { class: 'sub' }, 'one native host, many shared wasm plugins, no per-host wrapper')),
                h('span', { class: 'meta' }, 'p/agentplug')
            ),
            h('div', { class: 'row' },
                h('span', { class: 'code' }, '247420'),
                h('span', { class: 'title' }, 'where it gets proven', h('span', { class: 'sub' }, 'real users, broadcast synced to the second')),
                h('span', { class: 'meta' }, 'this site')
            )
        ]
    });

    const categoryPanels = groups.map(({ c, items }) => Panel({
        title: h('span', { id: 'cat-' + c.id }, c.label),
        count: items.length,
        children: items.map(renderRow)
    }));

    return C().AppShell({
        topbar: Topbar('org'),
        crumb: C().Crumb({
            trail: ['247420', 'org'], leaf: 'index',
            right: [
                Chip({ tone: 'dim', children: 'probably emerging' }),
                h('a', { href: 'https://github.com/AnEntrypoint', class: 'crumb-link' }, 'github'),
                ThemeToggleSlot()
            ]
        }),
        side: Side ? Side({ sections: sideSections }) : null,
        main: [
            Heading({ level: 1, children: 'AnEntrypoint' }),
            Lede({ children: 'tools you reach for when an agent needs to plan, run, find, remember, or speak — the broadcast that pressure-tests them in public, and the discord where it all gets built. everything here started as a joke in that room.' }),
            heroPanel,
            ...categoryPanels
        ]
    });
}

// ProjectPage — project_page-kit grammar (Side rail + narrow main)

function ProjectPage(state) {
    const slug = state.params && state.params[0];
    const p = findProject(slug);
    const Heading = C().Heading;
    const Lede = C().Lede;
    const Panel = C().Panel;
    const Chip = C().Chip;
    const Side = C().Side;
    const Install = C().Install;
    const Receipt = C().Receipt;

    if (!p) {
        return C().AppShell({
            topbar: Topbar(''),
            crumb: C().Crumb({ trail: ['247420', 'projects'], leaf: 'unknown', right: [ThemeToggleSlot()] }),
            narrow: true,
            main: [
                Heading({ level: 1, children: 'project not found' }),
                Lede({ children: ['"' + (slug || '') + '" is not in the catalog. ', h('a', { href: '/#/home' }, 'back to projects')] })
            ]
        });
    }

    const sc = showcaseFor(p.code);
    const hero = sc && sc.home && sc.home.hero;
    const features = sc && sc.home && sc.home.features;
    const quickstart = sc && sc.home && sc.home.quickstart;
    const description = (sc && sc.site && sc.site.description) || p.body;
    const stars = (sc && sc.stars !== undefined) ? sc.stars : p.stars;
    const liveUrl = sc && sc.src;

    const sideSections = [
        { group: 'project', items: [
            { label: 'overview',  href: '#overview',  active: true },
            { label: 'install',   href: '#install' },
            { label: 'features',  href: '#features' },
            { label: 'metadata',  href: '#metadata' }
        ] },
        { group: 'reference', items: (p.tags || []).slice(0, 6).map(t => ({ label: t, href: '#' })) },
        { group: 'links', items: [
            { label: 'source',   href: p.url },
            liveUrl ? { label: 'site',     href: liveUrl } : null,
            { label: 'all projects', href: '/#/home' }
        ].filter(Boolean) }
    ];

    const installCmd = (quickstart && quickstart.lines && quickstart.lines.length)
        ? quickstart.lines.find(l => l && l.kind !== 'cmt' && l.text)?.text || null
        : (p.install && p.install !== '-' ? p.install : null);

    const receiptRows = [
        ['code', p.code],
        ['category', p.cat],
        ['stars', stars > 0 ? String(stars) : '—'],
        ['tags', (p.tags || []).join(', ') || '—'],
        sc && sc.site && sc.site.year ? ['year', String(sc.site.year)] : null,
        ['source', h('a', { href: p.url, target: '_blank', rel: 'noopener' }, p.url.replace(/^https?:\/\//, ''))],
        liveUrl ? ['site', h('a', { href: liveUrl, target: '_blank', rel: 'noopener' }, liveUrl.replace(/^https?:\/\//, ''))] : null
    ].filter(Boolean);

    const main = [
        h('div', { id: 'overview', class: 'project-head' },
            h('div', {},
                h('span', { class: 'project-eyebrow' }, p.code + ', ' + p.cat),
                Heading({ level: 1, children: hero && hero.heading || p.title })
            )
        ),
        Lede({ children: hero && hero.subheading || p.sub }),
        h('p', { class: 'ds-prose project-body' }, hero && hero.body || description),
        h('div', { class: 'project-chips' },
            Chip({ tone: 'accent', children: p.cat }),
            stars > 0 ? Chip({ tone: 'dim', children: stars + ' stars' }) : null,
            ...(p.tags || []).slice(0, 5).map((t, i) => Chip({ key: i, tone: 'dim', children: t }))
        )
    ].filter(Boolean);

    main.push(h('div', { id: 'install' }, h('h3', {}, 'install')));
    if (installCmd && Install) {
        main.push(Install({ cmd: installCmd, copied: !!state.copiedInstall, onCopy: () => {
            navigator.clipboard?.writeText(installCmd);
            state.copiedInstall = true;
            window.__router.render();
            setTimeout(() => { state.copiedInstall = false; window.__router.render(); }, 1200);
        } }));
    } else {
        main.push(h('p', { class: 'ds-prose' }, 'no install line — read the source.'));
    }

    if (quickstart && quickstart.lines && quickstart.lines.length > 1) {
        main.push(h('h3', {}, quickstart.heading || 'quick start'));
        main.push(h('div', { class: 'cli' },
            ...quickstart.lines.flatMap((ln, i) => {
                if (!ln || !ln.text) return [];
                if (ln.kind === 'cmt') return [h('div', { key: 'l' + i, class: 'cli-cmt' }, ln.text)];
                return [h('div', { key: 'l' + i, class: 'cli-line' },
                    h('span', { class: 'prompt' }, '$'),
                    h('span', { class: 'cmd' }, ln.text)
                )];
            })
        ));
    }

    if (features && features.items && features.items.length) {
        main.push(h('div', { id: 'features' }, h('h3', {}, features.heading || 'features')));
        main.push(Panel({
            children: features.items.map((f, i) => h('div', { key: i, class: 'row' },
                h('span', { class: 'code' }, String(i + 1).padStart(2, '0')),
                h('span', { class: 'title' }, f.name || f.title || '', h('span', { class: 'sub' }, f.desc || f.text || ''))
            ))
        }));
    }

    main.push(h('div', { id: 'metadata' }, h('h3', {}, 'metadata')));
    if (Receipt) main.push(Receipt({ rows: receiptRows }));

    // The projects are open. Every project page invites you to clone it, break
    // it, and bring the result back to the room.
    main.push(h('div', { class: 'project-contribute' },
        h('p', { class: 'ds-prose' }, 'this one is open. clone it, run it, tell us where it broke — in the discord or a pull request. rough drafts welcome.'),
        h('div', { class: 'project-contribute-actions' },
            h('a', { class: 'btn-primary', href: p.url, target: '_blank', rel: 'noopener' }, 'read the source'),
            JoinLink({ variant: 'btn', label: 'bring it to the discord' })
        )
    ));

    return C().AppShell({
        topbar: Topbar('home'),
        crumb: C().Crumb({
            trail: ['247420', h('a', { href: '/#/home', class: 'crumb-link' }, 'projects')],
            leaf: p.code,
            right: [
                stars > 0 ? Chip({ tone: 'dim', children: stars + ' stars' }) : null,
                Chip({ tone: 'accent', children: p.cat }),
                ThemeToggleSlot()
            ].filter(Boolean)
        }),
        side: Side ? Side({ sections: sideSections }) : null,
        narrow: true,
        main
    });
}

// TvPage — chrome via SDK, broadcast stage stays custom

function TvPage() {
    const Panel = C().Panel;
    const Chip = C().Chip;

    const stage = h('div', { class: 'tv-stage' },
        h('div', { id: 'tv-player' }),
        h('div', { id: 'tv-guide-overlay', class: 'tv-guide-overlay hidden' },
            h('div', { class: 'panel-head' },
                h('span', {}, 'full schedule — today'),
                h('button', {
                    class: 'btn',
                    onclick: () => { document.getElementById('tv-guide-overlay').classList.add('hidden'); }
                }, 'close')
            ),
            h('div', { id: 'schedule', class: 'panel-body' })
        )
    );

    // Now-playing + up-next lives ON the page, not hidden behind a button. main.js
    // fills #tv-now / #tv-next from the scheduler every route enter + on a tick.
    const nowNext = h('div', { class: 'tv-nownext panel' },
        h('div', { class: 'tv-nownext-now' },
            h('span', { class: 'tv-nownext-label g-green' }, 'on air now'),
            h('span', { id: 'tv-now', class: 'tv-nownext-title' }, 'syncing to the broadcast clock...')
        ),
        h('div', { class: 'tv-nownext-next' },
            h('span', { class: 'tv-nownext-label' }, 'up next'),
            h('span', { id: 'tv-next', class: 'tv-nownext-title' }, '—')
        )
    );

    const controls = h('div', { class: 'panel' },
        h('div', { class: 'panel-head' },
            h('span', {}, h('span', { id: 'tv-status' }, 'loading broadcast...')),
            h('span', { class: 'tv-controls-right' },
                h('span', { class: 'tv-vol-label' }, 'VOL'),
                h('input', {
                    id: 'tv-volume', type: 'range', min: '0', max: '1', step: '0.05', value: '0.8',
                    class: 'tv-volume-input',
                    oninput: (e) => {
                        const p = window.__debug?.videoPlayer;
                        if (p) { p.setVolume(parseFloat(e.target.value)); if (p.videoElement) p.videoElement.muted = false; }
                    }
                }),
                h('button', { class: 'btn', onclick: () => window.__tvGuideToggle() }, 'full guide')
            )
        )
    );

    // The broadcast is a community artifact: mux pulls what people drop in the
    // discord and feeds it here. Watching is one step from participating.
    const tiein = Panel({
        title: 'this channel is fed by the room',
        children: [
            h('p', { class: 'ds-prose' },
                'the broadcast is not a playlist someone locked in. people drop clips in the discord, mux pulls the good ones, and they earn a slot. what you are watching is the community, curated and put on a UTC clock so everyone sees the same frame at the same second.'
            ),
            h('div', { class: 'tv-tiein-actions' },
                JoinLink({ variant: 'btn-primary', label: 'get your clip on the air' }),
                h('a', { class: 'btn', href: '/#/community' }, 'how the room works')
            )
        ]
    });

    return C().AppShell({
        topbar: Topbar('tv'),
        crumb: C().Crumb({
            trail: ['247420'], leaf: 'broadcast',
            right: [Chip({ tone: 'dim', children: 'broadcast' }), ThemeToggleSlot()]
        }),
        main: [stage, nowNext, controls, tiein]
    });
}

export const pages = {
    home: HomePage,
    community: CommunityPage,
    blog: BlogPage,
    lore: LorePage,
    tv: TvPage,
    org: OrgPage,
    p: ProjectPage
};
