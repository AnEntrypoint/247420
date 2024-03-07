<script>
    import { createEventDispatcher } from 'svelte';
    import { RangeCalendar } from "$lib/components/ui/range-calendar";

  
    export let name = '';
    export let id = '';
    export let value = [];
    let isVisible = true;
    let error = '';
    let touched = false;
    let required = true;
    let props = {};
    const dispatch = createEventDispatcher();
  
    function handleSelect(newValue) {
      touched = true;
      dispatch('change', { name, value: newValue });
    }
  </script>
  
  {#if isVisible}
    <div class="grid w-full items-center gap-1.5 mb-8">
      <label for={id}>{name}</label>
      <RangeCalendar
        bind:value
        id={id}
        class="rounded-md border shadow"
        {...props}
      />
      {#if touched && error}
        <div id="{name}-error">{error}</div>
      {/if}
    </div>
  {/if}
  