<script>
	import { ModeWatcher } from "mode-watcher";
	import '../app.postcss';
	import Sidebar from './components/Sidebar.svelte';
	export let data;
	$: ({ members } = data)
</script>
<div class="">
<ModeWatcher />
<Sidebar members={members}/>
<div class="flex-auto ml-64 ">
	<slot />
</div>
</div>