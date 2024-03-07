<script>
    import { createEventDispatcher } from 'svelte';
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  
    export let name = '';
    export let id = '';
    export let options = [];
    let selectedOption = '';
    let isVisible = true;
    let error = '';
    let touched = false;
    let required = true;
    let props = {};
    const dispatch = createEventDispatcher();
  
    function handleSelect(option) {
      touched = true;
      selectedOption = option;
      dispatch('change', { name, value: option });
    }
  </script>
  
  {#if isVisible}
    <div class="grid w-full items-center gap-1.5 mb-8">
      <label for={id}>{name}</label>
      <DropdownMenu
        id={id}
        options={options}
        selectedOption={selectedOption}
        onSelect={handleSelect}
        aria-invalid={error}
        aria-describedby="{name}-description"
        aria-required={required}
        {...props}
      />
      {#if touched && error}
        <div id="{name}-error">{error}</div>
      {/if}
    </div>
  {/if}
  