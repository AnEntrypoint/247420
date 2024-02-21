import { Web3 } from 'web3'
import { LensClient, production } from "@lens-protocol/client"
import PocketBase from 'pocketbase/cjs'
let web3 = new Web3("https://polygon-rpc.com")


const lensClient = new LensClient({
    environment: production
});

const pb = new PocketBase('http://localhost:8090')

const getMembers = (async () => {
    global.members =(await pb.collection('members').getList()).items// JSON.parse(fs.readFileSync('../migrate/memberslist.json'))//
    try {
        for (const member of global.members) {
            member.Posts = [];
        }
        for (const member of global.members) {
            const address = member.ERC20 || member.User;
            member.nft = '';
            member.url = '/@' + member.Id;
            const eth = web3.utils.toChecksumAddress(member.ERC20 || member.User || member.User);
            if (eth) {
                try {
                    const allOwnedProfiles = (await lensClient.profile.fetchAll({
                        where: { ownedBy: [member.ERC20] },
                    })).items
                    if (allOwnedProfiles.length) member.Lens = allOwnedProfiles
                } catch (e) {
                    console.error(JSON.stringify(e, null, 2));
                }
            }

            if (member.Lens && member.Lens.length) {
                //console.log(member.Lens)
                const lensposts = (await lensClient.publication.fetchAll({
                    where: {
                        from: [member.Lens[0].id],
                    }
                }));
                member.Posts = [];
                let moreposts = lensposts;
                /*while(moreposts = await moreposts.next()) {
                    await new Promise(res=>{setTimeout(res,1000)})
                    moreposts.items.map(a=>member.Posts.push(a));
                }*/
                moreposts.items.map(a=>member.Posts.push(a));
                //console.log(moreposts.items);
                //member.Posts = lensposts.items
                for (let post of member.Posts) {
                    post.createdAt = new Date(post.createdAt).getTime()
                    delete post.by
                    delete post.operations
                    delete post.quoteOn
                }
            }
            console.log(member.Posts.length)
            try {
                member.Lens = member.Lens[member.Lens.length - 1].handle
            } catch (e) {

            }
            //console.log('posts',member.Posts.length)
            Object.keys(member).forEach(a => {
                member[a.toLowerCase()] = member[a]
                delete member[a]
            })
            delete member.id
            //console.log(member);
            member.ERC20 = web3.utils.toChecksumAddress(member.erc20 || member.user || member.User)
            member.catchphrase = member.subtitle
            //console.log(member)
            //process.exit()
            const authData = await pb.admins.authWithPassword('admin@247420.xyz', 'Bigdikn3rgBigdikn3rg');
            const members = await pb.collection("members");
            const posts = await pb.collection("posts");
            let created;
            try {
                created = await members.create(member);
            } catch (e) {
            }
            if (!created) {
                created = (await members.getList(1, 1, {
                    filter: 'ERC20 = "' + member.ERC20 + '"'
                })).items[0];
            }
            //console.log(created)
            let changed = false
            //console.log(JSON.stringify(member.posts,null, 2))\
            //console.log(member.posts)
            for (let post of member.posts) {
                //console.log({post})
                //process.exit()
                if(!post.metadata) continue;
                const newPost = {
                    body: post.metadata?.content || post.body || post.metadata?.marketplace.name || "",
                    title: post.metadata?.title || post.metadata?.marketplace.name || post.title || "",
                    metadata: JSON.stringify(post.metadata) || "",
                    member: created.id || "",
                    createdAt: new Date(post.createdAt),
                    network: 'lens' || "",
                    remote_id: post.id || ""
                }
                //process.exit()
                //console.log(JSON.stringify(post, null, 2))
                //console.log(JSON.stringify(newPost, null, 2))
                try {
                    const createdPost = await posts.create(newPost)
                    created.posts.push(createdPost.id)
                    changed = true;
                    console.log(newPost.createdAt)

                } catch (e) {
                    console.log('skipped ', newPost.remote_id)
                    //console.error(JSON.stringify(e, null, 2))
                    //process.exit();
                }
            }
            if (changed) members.update(created.id, created)
        }

        //console.log('done')
    } catch (e) {
        console.error(e);
    }
})
setInterval(getMembers, 180000)
getMembers();