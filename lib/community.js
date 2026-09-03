// The 247420 community — the Discord is the room the whole site opens onto.
// This module single-sources the invite so a swap is one edit (DISCORD_INVITE),
// and renders CommunityPage from the same SDK kit primitives every other page
// uses (Panel/Row/Chip/Heading/Lede/Manifesto/Section) — no bespoke surface.

const C = () => (window.ds && window.ds.components) || {};
const h = (...a) => window.ds.h(...a);

// One place. Every join button on the site points here. Swap this line to
// rotate the invite. Confirmed live + never-expiring (Discord API, guild "247420").
export const DISCORD_INVITE = 'https://discord.com/invite/c9VV59MKNr';

// ---- blog post index ----
// scripts/fetch-blog-posts.mjs pulls the weekly-progress post YAML (including
// the flattened Lexical body) from AnEntrypoint/247420-blog's content/ at
// deploy time and caches it here — the posts render natively at #/blog and
// #/blog/<slug>, no outbound site. Empty/missing cache degrades to BlogPage's
// honest "couldn't load posts" state, never a crash.

let _blogPosts = null;
let _blogPostsPromise = null;

export async function loadBlogPosts() {
    if (_blogPosts) return _blogPosts;
    if (_blogPostsPromise) return _blogPostsPromise;
    _blogPostsPromise = fetch('/lib/blog-posts.json', { cache: 'no-cache' })
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
        .then(data => { _blogPosts = Array.isArray(data) ? data : []; return _blogPosts; });
    return _blogPostsPromise;
}

export function blogPosts() {
    return _blogPosts || [];
}

// A join anchor — real link, real text, opens in a new tab. Used in the topbar,
// the home hero, the footer, and the community page. `variant` picks the class
// so the same anchor reads as a button or a plain link depending on where it sits.
export function JoinLink({ variant = 'btn-primary', label = 'join the discord', key } = {}) {
    return h('a', {
        key,
        class: variant,
        href: DISCORD_INVITE,
        target: '_blank',
        rel: 'noopener'
    }, label);
}

// The community page. The Discord is the loudest thing on it. Everything else
// explains what you're walking into — the rooms, the broadcast, the projects —
// and points back at the invite.
export function CommunityPage() {
    const Panel = C().Panel;
    const Heading = C().Heading;
    const Lede = C().Lede;
    const Chip = C().Chip;
    const Manifesto = C().Manifesto;

    // The hero: name it, then the loudest join button on the whole site.
    const hero = h('div', { class: 'community-hero' },
        h('span', { class: 'community-eyebrow' }, 'the brain casino — 24/7/420'),
        Heading({ level: 1, children: 'this whole thing is a doorway. the room is on discord.' }),
        Lede({ children: '247420 is a discord first and a website second. the site is the window; the discord is the bar. creatives post, priests riff, the eye remixes, someone always ascends. no bedtime, no badtime.' }),
        h('div', { class: 'community-cta' },
            JoinLink({ variant: 'btn-primary community-join', label: 'walk in — join the discord' }),
            h('span', { class: 'community-count' }, '1,300+ in the room. no shoes past the door.')
        )
    );

    // What the rooms actually are — the nuance, not a feature list.
    const rooms = Panel({
        title: 'what goes on in there',
        children: [
            roomRow('01', 'the feed never stops', 'people drop clips, memes, half-built ideas, and rough drafts all day. it is 420 ideas a minute and most of them are load-bearing jokes.'),
            roomRow('02', 'voice rooms stay open', 'push-to-talk and stage channels running on our own voice stack (zellous, wireweave). show up, talk, or just leave it on in the background while you build.'),
            roomRow('03', 'the broadcast is fed from here', 'mux watches what people post and pulls the good media into the broadcast. drop a clip in discord and it can end up on the air. the tv you see on this site is the room, curated.'),
            roomRow('04', 'the projects are open', 'everything in the catalog gets built, broken, and argued about in the open. no whitepapers, more PRs. lurk, ask, or open a pull request.')
        ]
    });

    // How to actually show up. Concrete, not a funnel.
    const showUp = Panel({
        title: 'how to show up',
        children: [
            roomRow('→', 'take your shoes off', 'the first channel is welcome-please-remove-shoes. read it, say hi, that is the whole onboarding.'),
            roomRow('→', 'post the rough draft', 'the thing you half-finished counts. ship it here before it is ready — that is the point.'),
            roomRow('→', 'pick a project and poke it', 'clone one from the catalog, run it, tell us where it broke. the projects page lists every one with a source link.'),
            roomRow('→', 'get on the air', 'make or find something worth a broadcast slot and drop it in the media channels. mux does the rest.')
        ]
    });

    // Reinforce the invite once more before the manifesto, and route to the
    // two internal surfaces that are really community surfaces: projects + tv.
    const secondCta = h('div', { class: 'community-second-cta' },
        h('p', { class: 'ds-prose' }, 'the site is just the map. the place is the discord.'),
        h('div', { class: 'community-cta-row' },
            JoinLink({ variant: 'btn-primary', label: 'join the discord' }),
            h('a', { class: 'btn', href: '/#/home' }, 'browse the projects'),
            h('a', { class: 'btn', href: '/#/tv' }, 'watch the broadcast'),
            h('a', { class: 'btn', href: '/#/blog' }, 'read the weekly progress blog')
        )
    );

    const main = [
        hero,
        rooms,
        showUp,
        secondCta,
    ];
    if (Manifesto) {
        main.push(h('section', { class: 'ds-section' },
            h('h3', {}, 'house voice'),
            Manifesto({ paragraphs: [
                { text: '247420 — the brain casino. 24 hours a day, 7 days a week, 420 ideas a minute.' },
                { text: 'creatives post, priests riff, the eye remixes, someone always ascends. no bedtime, no badtime, no bathroom breaks (lie).' },
                { text: 'we are the creative department of the internet. always open, always a little bit high on possibility. the door is unlocked. take your shoes off.', dim: true }
            ]})
        ));
    }

    return C().AppShell({
        topbar: window.__topbar('community'),
        crumb: C().Crumb({
            trail: ['247420'], leaf: 'community',
            right: [Chip({ tone: 'accent', children: 'the room' }), window.__themeToggle()]
        }),
        narrow: true,
        main
    });
}

function roomRow(mark, title, sub) {
    return h('div', { class: 'row community-row' },
        h('span', { class: 'code' }, mark),
        h('span', { class: 'title' }, title, h('span', { class: 'sub' }, sub))
    );
}
