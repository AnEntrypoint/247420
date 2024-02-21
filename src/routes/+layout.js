import db from '$lib/db.js';
export const prerender = true;
export async function load(ctx) {
    const membersSub = await db.getMembers();
    const postsSub = await db.getPosts();
    const members = await new Promise(res=>{
        membersSub.subscribe((a)=>{
            if(a) res(a)
        })
    })
    const posts = await new Promise(res=>{
        postsSub.subscribe((a)=>{
            if(a) res(a)
        })
    })
    return {members, posts}
}