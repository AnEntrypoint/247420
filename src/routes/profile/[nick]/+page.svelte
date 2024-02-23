<script>
	import { Skeleton } from '$lib/components/ui/skeleton';
	import Post from '../../components/Post.svelte'
	export let data;
	$: ({ member } = data)
</script>

<div class="container mx-auto max-w-screen-xl flex-grow px-0 pt-8 pb-2 sm:px-5 pt-6">
	<div class="grid grid-cols-12 lg:gap-8">
		
		<div class="col-span-3 md:col-span-3 lg:col-span-4 align-top">
			<div class="mb-4 space-y-5 px-5 sm:px-0">
				<div class="relative mt-4 h-32 w-32 sm:mt-4 sm:h-52 sm:w-52">
					{#if member.avatarUrl}
						<img
							src={member.avatarUrl}
							class="h-32 w-32 rounded-xl bg-gray-200 ring-8 ring-gray-50 dark:bg-gray-700 dark:ring-black sm:h-52 sm:w-52 shadow-lg"
							height="128"
							width="128"
							alt={member.pseudonym}
						/>
					{/if}
					{#if !member.avatarUrl}
						<Skeleton
							class="h-32 w-32 rounded-xl bg-gray-200 ring-8 ring-gray-50 dark:bg-gray-700 dark:ring-black sm:h-52 sm:w-52 shadow-lg"
						/>
					{/if}
				</div>
				<div class="space-y-1 py-2">
					{#if member.pseudonym}
						<div class="flex items-center gap-1.5 text-2xl font-bold">
							<div class="truncate">{member?.pseudonym}</div>
						</div>
					{/if}

					{#if !member.pseudonym}
						<Skeleton class="h-8" />
					{/if}
					{#if member.lens}
						<div class="flex items-center space-x-3">
							<span
								class="from-brand-600 dark:from-brand-400 bg-gradient-to-r to-pink-600 bg-clip-text text-transparent dark:to-pink-400 text-sm sm:text-base"
								>@{member.lens}</span
							>
						</div>
					{/if}
					{#if !member.lens}
						<Skeleton class="h-8" />
					{/if}
				</div>

				<div class="space-y-5">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<div class="text-md truncate">
								<span>
									{#if member.ERC20}
										<a
											href="https://rarible.com/token/polygon/0x2f880C94572259C100fd8801523dc58a92B5c27e"
											target="_blank"
											rel="noreferrer"
											class="text-sm">{member.ERC20}</a
										>
									{/if}
									{#if !member.ERC20}
										<Skeleton class="h-6">
											<div class="truncate">pseudonym</div>
										</Skeleton>
									{/if}
								</span>
							</div>
						</div>
						{#if member.lens}
							<div class="flex items-center gap-2">
								<img
									src="https://www.google.com/s2/favicons?domain=hey.xyz"
									class="h-4 w-4 rounded-full"
									height="16"
									width="16"
									alt="Website"
								/>
								<div class="text-md truncate">
									<a
										href={'https://hey.xyz/u/' + member.lens}
										target="_blank"
										rel="noreferrer noopener me">https://hey.xyz/u/{member.lens}</a
									>
								</div>
							</div>
						{/if}
						{#if !member.lens}
							<Skeleton class="h-8" />
						{/if}
						{#if member.twitter}
							<div class="flex items-center gap-2">
								<img
									src="https://hey-assets.b-cdn.net/images/brands/x-light.png"
									class="h-4 w-4"
									height="16"
									width="16"
									alt=""
								/>
								<div class="text-md truncate">
									<a
										href={'https://twitter.com/' + member.twitter}
										target="_blank"
										rel="noreferrer noopener">{member.twitter}</a
									>
								</div>
								<div class="flex items-center gap-2">
									<div class="text-md truncate">
										<a target="_blank" href="https://discord.gg/an-entrypoint-367741339393327104">
											<i class="fab fa-discord" />247420
										</a>
									</div>
								</div>
							</div>
						{/if}
						{#if member.github}
							<div class="flex items-center gap-2">
								<img
									src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fpngimg.com%2Fuploads%2Fgithub%2Fgithub_PNG88.png&f=1&nofb=1&ipt=b70d7f1af1408058976e6664ddda668465ae22d44fe4d911bd3a7c775271fa45&ipo=images"
									class="h-4 w-4"
									height="16"
									width="16"
									alt=""
								/>

								<div class="text-md truncate">
									<a target="_blank" href="https://github.om/{member.github}">
										<i class="fab fa-github" />
										{member.github}
									</a>
								</div>
							</div>
						{/if}
						{#if member.youtube}
							<div class="flex items-center gap-2">
								<img
									src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2Fa%2Fa0%2FYouTube_social_red_circle_(2017).svg%2F240px-YouTube_social_red_circle_(2017).svg.png&f=1&nofb=1&ipt=1d8ba35fced4de09196d0e891adbc9f53395ed27bb1de2bab5a1f4b400687b62&ipo=images"
									class="h-4 w-4"
									height="16"
									width="16"
									alt=""
								/>
								<div class="text-md truncate">
									<a target="_blank" href={'https://youtube.com/' + member.youtube}>
										<i class="fab fa-youtube" />
										{member.youtube}
									</a>
								</div>
							</div>
						{/if}
						{#if member.mastodon}
							<div class="flex items-center gap-2">
								<img
									src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fassets.stickpng.com%2Fimages%2F636b9823619a40bec2a4c5bb.png&f=1&nofb=1&ipt=ce2f1adcba64257107b214ab94745add1fd257f3ab80c563e512dbd5c0701390&ipo=images"
									class="h-4 w-4"
									height="16"
									width="16"
									alt=""
								/>

								<div class="text-md truncate">
									<a target="_blank" href={member.mastodon}>
										<i class="fab fa-mastodon" />
										{member.mastodon}
									</a>
								</div>
							</div>
						{/if}
						{#if member.facebook}
							<div class="flex items-center gap-2">
								<img
									src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2Ff%2Fff%2FFacebook_logo_36x36.svg%2F1200px-Facebook_logo_36x36.svg.png&f=1&nofb=1&ipt=415b85c31826323ccede63822c4a6f5c7e09ec780437d7ad1a777b6d43cca4fb&ipo=images"
									class="h-4 w-4"
									height="16"
									width="16"
									alt=""
								/>
								<div class="text-md truncate">
									<a target="_blank" href={'https://www.facebook.com/' + member.facebook}>
										<i class="fab fa-facebook" />
										{member.facebook}
									</a>
								</div>
							</div>
						{/if}
					</div>
				</div>
				{#if member.bio}
					<div class="leading-md linkify text-md mr-0 break-words sm:mr-10">
						<span class="">{member.bio}</span>
					</div>
				{/if}
				{#if !member.bio}
					<Skeleton class="h-24">
						<div class="truncate">pseudonym</div>
					</Skeleton>
				{/if}
			</div>
		</div>
	</div>
</div>
