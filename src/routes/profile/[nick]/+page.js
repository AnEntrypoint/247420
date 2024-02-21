import db from '$lib/db.js';
export const prerender = true;

export async function load(ctx) {
    const membersSub = await db.getMembers();
    const member = await new Promise(res=>{
        membersSub.subscribe((a)=>{
            if(a) res(a.filter((item) => {
                const nick = ctx.params.nick
                return item.id === nick
            })[0])
        })
    })
    
    return {member}
}