<script>
	import FieldNumber from './fields/FieldNumber.svelte'
	import FieldText from './fields/FieldText.svelte'
	import FieldRadio from './fields/FieldRadio.svelte'
	import FieldEditor from './fields/FieldEditor.svelte'
	import FieldDropdown from './fields/FieldDropdown.svelte'
	import { Button } from "$lib/components/ui/button"
	import Ajv from 'ajv'
	//import RangeCalendar from '$lib/components/ui/range-calendar/range-calendar.svelte';
	const ajv = new Ajv()
	const fields = {
		number: FieldNumber,
		text: FieldText,
		editor: FieldEditor,
		radio: FieldRadio,
		dropdown: FieldDropdown,
		//rangeCalendar: RangeCalendar
	};
	export let schema;
	const buildajvschema = (schema) => {
        const out = {
			type:"object",
            properties:{},
            required:[]
        };
        for(let index in schema) {
            const field = schema[index]
            const { name } = field
            out.properties[name] = {}
            if(field.type == "text" || field.type == "") {
                out.properties[name].type = "string"
            } 
			if(field.required) {
				out.required.push(name)
			}
        }

		return out;
	};
	const ajvschema = buildajvschema(schema)
	console.log(ajvschema)
	let compiledschema = ajv.compile(ajvschema)
	let values = {}
	const handleSubmit = ()=>{
		if(!compiledschema(values)) {
			console.log(compiledschema.errors)
		} else {
						
		}
	}
</script>

<div class="m-4">
	{#each schema as field, index}
		<svelte:component this={fields[field.type]} {...field} bind:value={values[field.name]}/>
	{/each}
	<Button on:click={handleSubmit}>Submit</Button>
</div>
