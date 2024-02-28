<script>
	import Post from "./components/Post.svelte"
	export let data;
	$: ({ posts } = data)
</script>

<div class="container mx-auto max-w-screen-xl flex-grow px-0 pt-8 pb-2 sm:px-5 pt-6">
	<div class="grid grid-cols-12 lg:gap-8">
		{#if posts.length}
        <div class="col-span-12 lg:col-span-8">
            {#each posts as post} <Post post={post} data={data}></Post>   {/each}
</div>			
		{/if}
	</div>
</div>
