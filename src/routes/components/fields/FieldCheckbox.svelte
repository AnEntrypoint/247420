<script>
    import { createEventDispatcher } from 'svelte';
    import Checkbox from '$lib/components/ui/checkbox'; 
    import Label from '$lib/components/ui/label';
  
    export let name = '';
    export let id = '';
    export let isChecked = false;
    let isVisible = true;
    let error = '';
    let touched = false;
    let required = true;
    let props = {};
    const dispatch = createEventDispatcher();
  
    function handleChange(event) {
      touched = true;
      dispatch('change', { name, value: event.target.checked });
    }
  </script>
  
  {#if isVisible}
    <div class="items-top flex space-x-2">
      <Checkbox
        id={id}
        bind:checked={isChecked}
        on:change={handleChange}
        aria-describedby="{name}-description"
        aria-required={required}
        {...props}
      />
      <div class="grid gap-1.5 leading-none">
        <Label
          for={id}
          class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {name}
        </Label>
        <p class="text-sm text-muted-foreground">
          You agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
    {#if touched && error}
      <div id="{name}-error">{error}</div>
    {/if}
  {/if}
  