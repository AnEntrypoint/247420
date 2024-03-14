<script>
	import Form from '../components/Form.svelte'
	import table from './members.json'
	export let data
	console.log({data})
</script>

<div class="container mx-auto max-w-screen-xl flex-grow px-0 pt-8 pb-2 sm:px-5 pt-6">
	<Form schema={table.schema} values={data.member}/>
</div>
