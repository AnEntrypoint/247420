import { writable } from 'svelte/store'
import { browser } from '$app/environment'
import PocketBase from 'pocketbase'
import Web3 from 'web3';

const pb = new PocketBase('https://pb.lan.247420.xyz')
if (browser) {
    window.pb=pb
}
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

let loggedin = writable();
loggedin.set(pb.authStore.model)

const login=async () => {
    if (browser) {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);

            let accounts = await window.ethereum.enable();
            const message = '247420';
            const account = accounts[0];
            console.log({ account });
            try {
                const signedMessage = await web3.eth.personal.sign(message, account, '');
                var hash = await window.crypto.subtle.digest(
                    'SHA-256',
                    new TextEncoder().encode(signedMessage)
                );
                var hexString = Array.from(new Uint8Array(hash))
                    .map((byte) => ('00' + byte.toString(16)).slice(-2))
                    .join('');
                try {
                    const createOpts = {
                        email: account + '@247420.xyz',
                        name: account,
                        password: hexString,
                        passwordConfirm: hexString
                    };
                    await pb.collection('users').create(createOpts);
                } catch(e) {

                }
                console.log([account + '@247420.xyz', hexString])
                const authData = await pb
                    .collection('users')
                    .authWithPassword(account + '@247420.xyz', hexString);
                loggedin.set(pb.authStore.model)
                } catch (e) {
                console.error(e);
            }
        } else {
            console.error('MetaMask not detected. Please make sure you have MetaMask installed.');
        }
    }
}

const logout=() => {
    pb.authStore.clear();
    loggedin.set(pb.authStore.model)
}

export default { getMembers,  getPosts, getCollections, login, logout, loggedin }