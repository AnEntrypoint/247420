<script>
	import { ModeWatcher } from "mode-watcher";
	import '../app.postcss';
	import Sidebar from './components/Sidebar.svelte';
	export let data;
</script>
<div class="dark:bg-black dark:text-white">
<ModeWatcher />
<Sidebar members={data.members}/>
<div class="flex-auto ml-64 ">
	<slot />
</div>
</div>