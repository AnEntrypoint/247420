<script>
    export let props;
    let touched = false;
  
    function handleChange(e) {
      if (!touched) touched = true;
      props.onChange(props.name, e.target.value);
    }
  
    $: displayError = props.submited || touched ? props.error : null;
  </script>
  
  {#if props.isVisible}
    <fieldset>
      <legend aria-label="{props.label} {displayError}">{props.label}</legend>
      {#if props.description}<p>{props.description}</p>{/if}
      <div onchange={handleChange}>
        {#each props.options as opt}
          <label>
            <input type="radio" name="{props.name}" value="{opt.value}" checked={props.value === opt.value} />
            {opt.label}
          </label>
        {/each}
      </div>
      {#if displayError}<p>{displayError}</p>{/if}
    </fieldset>
  {/if}