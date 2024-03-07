<script>
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import { Label } from "$lib/components/ui/label";

  export let name;
  export let label;
  export let description;
  export let value;
  export let options;
  export let isVisible;
  export let error;
  export let submited;
  export let onChange;

  let touched = false;

  function handleChange(e) {
    if (!touched) touched = true;
    onChange(name, e.target.value);
  }

  let displayError = submited || touched ? error : null;
</script>

{#if isVisible}
  <fieldset>
    <!-- A11Y errors: https://blog.tenon.io/accessible-validation-of-checkbox-and-radiobutton-groups/ -->
    <legend aria-label="{label} {displayError}">
      {label}
    </legend>
    {#if description}
      <p>{description}</p>
    {/if}
    <RadioGroup.Root value={value} on:change={handleChange}>
      {#each options as opt}
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value={opt.value} id={opt.value} />
          <Label for={opt.value}>{opt.label}</Label>
        </div>
      {/each}
      <RadioGroup.Input name={name} />
    </RadioGroup.Root>
    {#if displayError}
      <p>{displayError}</p>
    {/if}
  </fieldset>
{/if}
