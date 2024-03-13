<script>
	import { ModeWatcher } from "mode-watcher"
	import '../app.postcss'
	import Sidebar from './components/Sidebar.svelte'
	import Countdown from './components/Countdown.svelte'
	export let data;
	$: ({ members } = data)
</script>
<ModeWatcher />
<Sidebar members={members}/>
<div class="flex-auto ml-64 ">
	<Countdown></Countdown>
	<slot />
</div>
