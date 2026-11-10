const C = () => (window.ds && window.ds.components) || {};
const h = (...a) => window.ds.h(...a);
export const DISCORD_INVITE = 'https://discord.com/invite/c9VV59MKNr';

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
export function JoinLink({ variant = 'btn-primary', label = 'join the discord', key } = {}) {
    return h('a', {
        key,
        class: variant,
        href: DISCORD_INVITE,
        target: '_blank',
        rel: 'noopener'
    }, label);
}
export function CommunityPage() {
    const Panel = C().Panel;
    const Heading = C().Heading;
    const Lede = C().Lede;
    const Chip = C().Chip;
    const Manifesto = C().Manifesto;
    const hero = h('div', { class: 'community-hero' },
        h('span', { class: 'community-eyebrow' }, 'the brain casino — 24/7/420'),
        Heading({ level: 1, children: 'this whole thing is a doorway. the room is on discord.' }),
        Lede({ children: '247420 is a discord first and a website second. the site is the window; the discord is the bar. creatives post, priests riff, the eye remixes, someone always ascends. no bedtime, no badtime.' }),
        h('div', { class: 'community-cta' },
            JoinLink({ variant: 'btn-primary community-join', label: 'walk in — join the discord' }),
            h('span', { class: 'community-count' }, '1,300+ in the room. no shoes past the door.')
        )
    );
    const rooms = Panel({
        title: 'what goes on in there',
        children: h('div', { class: 'row-list' }, [
            roomRow('01', 'the feed never stops', 'people drop clips, memes, half-built ideas, and rough drafts all day. it is 420 ideas a minute and most of them are load-bearing jokes.'),
            roomRow('02', 'voice rooms stay open', 'push-to-talk and stage channels running on our own voice stack (zellous, wireweave). show up, talk, or just leave it on in the background while you build.'),
            roomRow('03', 'the broadcast is fed from here', 'mux watches what people post and pulls the good media into the broadcast. drop a clip in discord and it can end up on the air. the tv you see on this site is the room, curated.'),
            roomRow('04', 'the projects are open', 'everything in the catalog gets built, broken, and argued about in the open. no whitepapers, more PRs. lurk, ask, or open a pull request.')
        ])
    });
    const showUp = Panel({
        title: 'how to show up',
        children: h('div', { class: 'row-list' }, [
            roomRow('→', 'take your shoes off', 'the first channel is welcome-please-remove-shoes. read it, say hi, that is the whole onboarding.'),
            roomRow('→', 'post the rough draft', 'the thing you half-finished counts. ship it here before it is ready — that is the point.'),
            roomRow('→', 'pick a project and poke it', 'clone one from the catalog, run it, tell us where it broke. the projects page lists every one with a source link.'),
            roomRow('→', 'get on the air', 'make or find something worth a broadcast slot and drop it in the media channels. mux does the rest.')
        ])
    });
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
        main.push(C().Section({
            title: 'house voice',
            children: [Manifesto({ paragraphs: [
                { text: '247420 — the brain casino. 24 hours a day, 7 days a week, 420 ideas a minute.' },
                { text: 'creatives post, priests riff, the eye remixes, someone always ascends. no bedtime, no badtime, no bathroom breaks (lie).' },
                { text: 'we are the creative department of the internet. always open, always a little bit high on possibility. the door is unlocked. take your shoes off.', dim: true }
            ] })]
        }));
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
