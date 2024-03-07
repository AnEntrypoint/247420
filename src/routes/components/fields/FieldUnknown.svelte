<script>
    export let type;
    export let name;
    export let error;
  </script>
  
  <div style="border: 1px dashed gray; padding: 8px;">
    <p>
      Field "{name}" unsupported: The type "{type}" has no UI component built yet.
    </p>
    {#if error}
      <div id="{name}-error">{error}</div>
    {/if}
  </div>