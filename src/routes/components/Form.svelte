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
			const props = field.ajv || {}
            if(field.type == "text" || field.type == "editor") {
                props.type = "string"
            } 
			
			if(field.required) {
				out.required.push(name)
                if(props.type == "string") {
					if(!props.minLength) props.minLength = 1
				}
			}
			out.properties[name] = props;
		}
		console.log({out})
		return out;
	};
	const ajvschema = buildajvschema(schema)
	let compiledschema = ajv.compile(ajvschema)
	let values = {}
	export let errors = {}
	const handleSubmit = ()=>{
		for(let field of schema) {
			field.error = null
		}
		if(!compiledschema(values)) {
			errors = compiledschema.errors
			for(let eindex in compiledschema.errors) {
				const error = compiledschema.errors[eindex];
				const pathparts = error.instancePath.split('/');
				pathparts.shift()
				let out = schema;
				for(let depth in pathparts) {
					const path = pathparts[depth]
					for(let p of pathparts) {
						out=out.filter(i=>i.name==p)[0]
						schema=schema
					}
				}
				console.log(out.element)
				out.element.scrollIntoView({behavior: 'smooth'})
				out.error = error.message
			}
		} else {
						
		}
	}
</script>

<div class="m-4">
	
	{#each schema as field, index}
		<div bind:this={field.element}>
		<svelte:component this={fields[field.type]} {...field} bind:value={values[field.name]}/>
		</div>
	{/each}
	<Button on:click={handleSubmit}>Submit</Button>
</div>
