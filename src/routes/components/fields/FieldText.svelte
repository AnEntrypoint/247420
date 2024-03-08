<script>
	import { createEventDispatcher } from 'svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	export let name = ''
	export let id = ''

	export let inputClass
	export let value = ''
	let isVisible = true
	export let error = ''
	let touched = false
	let required = true
	let props = {}
	const dispatch = createEventDispatcher()

	function handleChange(event) {
		touched = true;
		dispatch('change', { name, value: event.target.value });
	}
</script>

{#if isVisible}
	<div class="grid w-full items-center gap-1.5 mb-8">
		<Label for={id}>{name}</Label>
		<Input
			type="text"
			{id}
			placeholder={name}
			class={"text-black "+inputClass}
			bind:value
			on:input={handleChange}
			aria-invalid={error}
			aria-describedby="{name}-description"
			aria-required={required}
			{...props}
		/>
		<!--p class="text-sm text-muted-foreground">{name}</p-->
		{#if error}
			<div id="{name}-error">{error}</div>
		{/if}
	</div>
{/if}
