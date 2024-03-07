<script>
	import Form from '../components/Form.svelte';
	import table from './members.json';
</script>

<div class="container mx-auto max-w-screen-xl flex-grow px-0 pt-8 pb-2 sm:px-5 pt-6">
	<Form schema={table.schema} />
</div>
