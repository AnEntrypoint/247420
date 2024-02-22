<script>
    import showdown from "showdown"
    export let post;
    export let data;
	let members = data.members;
    let converter = new showdown.Converter({simplifiedAutoLink:true,excludeTrailingPunctuationFromURLs:true,tables:true});
    post.body = converter.makeHtml(post.body);
    </script>
<div class="mb-5 md:col-span-10 space-y-5">
    <div class="infinite-scroll-component__outerdiv">
        <div class="infinite-scroll-component" style="height: auto; overflow: auto;">
            <div
                class="rounded-none sm:rounded-xl border dark:border-gray-700 dark:bg-black divide-y-[1px] dark:divide-gray-700"
                data-test=""
            >
                <article
                    class="cursor-pointer p-5 first:rounded-t-xl last:rounded-b-xl hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                    <a href="https://hey.xyz/posts/{post.remote_id}">
                        <div class="flex justify-between space-x-1.5 pb-4">
                            <span>
                                <div class="flex items-center justify-between">
                                    <span>
                                        <span aria-expanded="false">
                                            <div class="flex items-center space-x-3">
                                                <img
                                                    src={members.filter((a) => a.id == post.member)[0].avatarUrl}
                                                    loading="lazy"
                                                    class="h-10 w-10 rounded-full border bg-gray-200 dark:border-gray-700"
                                                    height="40"
                                                    width="40"
                                                    alt=""
                                                />
                                                <div>
                                                    <div class="flex max-w-sm items-center truncate">
                                                        <div class="text-md">
                                                            {members.filter((a) => a.id == post.member)[0].pseudonym}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span
                                                            class="from-brand-600 dark:from-brand-400 bg-gradient-to-r to-pink-600 bg-clip-text text-transparent dark:to-pink-400 text-sm"
                                                            >@{members.filter((a) => a.id == post.member)[0].lens}</span
                                                        >
                                                        <span class="lt-text-gray-500">
                                                            <span class="mx-1.5">·</span>
                                                            <span class="text-xs" title={post.createdAt}
                                                                >{post.createdAt}</span
                                                            >
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </span>
                                    </span>
                                </div>
                            </span>
                        </div>
                        <div class="ml-[53px]">
                            {@html post.body}
                            <div class="grid-cols-1 grid-rows-1 grid gap-2 pt-3">
                                {#each post.imageUrls as url}
                                    <div class="w-2/3 relative">
                                        <img
                                            class="cursor-pointer rounded-lg border bg-gray-100 object-cover dark:border-gray-700 dark:bg-gray-800"
                                            loading="lazy"
                                            height="1000"
                                            width="1000"
                                            src={url}
                                            alt={url}
                                        />
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </a>
                </article>
            </div>
        </div>
    </div>
</div>
