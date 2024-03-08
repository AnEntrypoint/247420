<script>
	import { Label } from '$lib/components/ui/label';
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';

	let element;
	let editor;
	export let value;
	export let name;
	export let id;
	export let inputClass;
	export let error;
	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [StarterKit],
			content: value,
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editor = editor;
				value = editor.getText();
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			console.log('editor destroy');
			editor.destroy();
		}
	});
</script>

<div class="grid w-full items-center gap-1.5 mb-8">
	<Label>{name}</Label>
	<div
		class={'bg-white text-black p-2 rounded-md border border-input shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ' +
			inputClass}
		bind:this={element}
	/>
	{#if error}
		<div id="{name}-error">{error}</div>
	{/if}
</div>
