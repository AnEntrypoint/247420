import { writable } from 'svelte/store';

import PocketBase from 'pocketbase';
const pb = new PocketBase('https://pb.lan.247420.xyz');
let posts = writable();
let postsDone = false;
const getPosts = () => {
    if (!postsDone) {
        postsDone = true;
        pb.collection('posts').getList(1, 50,
            {
                sort: '-createdAt'
            }
        ).then(a => {
            posts.set(a.items.map(post => {
                post.imageUrls = [];

                if (post.metadata.asset && post.metadata.asset.image != null && post.metadata.asset.image.optimized.uri.length) {
                    post.imageUrls.push(post.metadata.asset.image.optimized.uri.replace('ipfs://', 'https://gw.ipfs-lens.dev/ipfs/'));
                }
                return post
            }))
        });
    }
    return posts;
}
let members = writable();
let membersDone = false;
const getMembers = () => {
    if (!membersDone) {
        membersDone = true;
        pb.collection('members').getList(1, 50, { expand: 'posts' }).then((items) => {
            for (let loaded of items.items) {
                loaded.avatarUrl = pb.files.getUrl(loaded, loaded.pfp, { 'thumb': '250x330' });


                if (loaded.expand && loaded.expand.posts) {
                    loaded.expand.posts.sort((a,b)=>{
                        return new Date(b.createdAt)-new Date(a.createdAt)
                    })
                    for (let post of loaded.expand.posts) {
                        post.imageUrls = [];

                        if (post.metadata.asset && post.metadata.asset.image != null && post.metadata.asset.image.optimized.uri.length) {
                            post.imageUrls.push(post.metadata.asset.image.optimized.uri.replace('ipfs://', 'https://gw.ipfs-lens.dev/ipfs/'));
                        }
                    }
                } else {
                    loaded.expand = {posts:[]}
                }
            }
            members.set(items.items)
        })
    }
    return members
}
let collections = writable();
let collectionsDone = false;
const getCollections = () => {
    if (!collectionsDone) {
        collectionsDone = true
        pb.collections.getList(1, 30, {}).then(
            (items) => {
                collections.set(items.items)
            }
        )
    }
    return members
}

export default { getMembers,  getPosts, getCollections }