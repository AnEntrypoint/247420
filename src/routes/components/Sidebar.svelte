<script>
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Button } from '$lib/components/ui/button';
	import Sun from 'svelte-radix/Sun.svelte';
	import Moon from 'svelte-radix/Moon.svelte';

	import { toggleMode } from 'mode-watcher';
	export let members;
</script>

<div class="pb-12 hidden lg:block flex-1 w-64 absolute dark:bg-black dark:text-white">
	<div class="space-y-4 py-4">
		<div class="px-3 py-2">
			
			<img
									class="object-cover transition-all rounded-md m-1 hover:scale-105 aspect-[3/4]"
									src="/logo.gif"
									alt=""
								/>
			<div class="space-y-1">
				<button
					type="button"
					tabindex="0"
					class="inline-flex items-center rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 w-full justify-start"
					data-bits-button-root=""
					><svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="mr-2 h-4 w-4"
						><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg
					>
					Sign in</button
				>
				<Button on:click={toggleMode} class="inline-flex items-center rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 w-full justify-start" variant="outline" size="icon">
					<Sun
						class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
					/>
					<Moon
						class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
					/>
					<span class="sr-only">Toggle theme</span>
				</Button>
				<!--button
					type="button"
					tabindex="0"
					class="inline-flex items-center rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full justify-start"
					data-bits-button-root=""
					><svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="mr-2 h-4 w-4"
						><rect width="7" height="7" x="3" y="3" rx="1" /><rect
							width="7"
							height="7"
							x="14"
							y="3"
							rx="1"
						/><rect width="7" height="7" x="14" y="14" rx="1" /><rect
							width="7"
							height="7"
							x="3"
							y="14"
							rx="1"
						/></svg
					>
					Profile</button
			-->
				<!--button
					type="button"
					tabindex="0"
					class="inline-flex items-center rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full justify-start"
					data-bits-button-root=""
					><svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="mr-2 h-4 w-4"
						><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path
							d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"
						/><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path
							d="M19.1 4.9C23 8.8 23 15.1 19.1 19"
						/></svg
					>
					Live</button
				-->
			</div>
		</div>
		{#if members}
			<div class="px-3 py-2">
				<h2 class="mb-2 px-4 text-lg font-semibold tracking-tight">Community</h2>
				<div class="space-y-1">
					{#each members as listitem}
						<a
							href="/profile/{listitem.ERC20}"
							type="button btn"
							tabindex="0"
							class="inline-flex items-center text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full justify-start"
							data-bits-button-root=""
							>{#if listitem.avatarUrl}<img
									class="object-cover transition-all rounded-md m-1 hover:scale-105 aspect-[3/4]"
									src={listitem.avatarUrl}
									alt=""
									width="24"
									height="24"
								/>
							{/if}
							{#if !listitem.avatarUrl}
								<Skeleton
									class="w-8 h-8 object-cover transition-all rounded-md m-1 hover:scale-105 aspect-[3/4]"
								/>
							{/if}
							{listitem.pseudonym}</a
						>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
