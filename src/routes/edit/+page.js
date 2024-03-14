import db from '$lib/db.js';
export const prerender = false;

export async function load(ctx) {
    const membersSub = await db.getMembers();
    const member = await new Promise(res=>{
        membersSub.subscribe((a)=>{
            if(a) res(a.filter((item) => {
                const nick = db.getName()
                return item.ERC20.toLowerCase() == nick
            })[0])
        })
    })
    
    return {member, name:db.getName()}
}