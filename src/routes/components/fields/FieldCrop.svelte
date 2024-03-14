<script>
  import db from '$lib/db.js';
  import { createEventDispatcher } from 'svelte'
  import { Label } from '$lib/components/ui/label'
  import Cropper from "svelte-easy-crop"
  import getCroppedImg from '$lib/canvasUtils'

  export let name = ''
  export let id = ''
  export let type, presentable, unique, options, inputClass, title;
  export let value = ''
  export let image;
  export let crop = { x: 0, y: 0 }
  export let zoom = 1
  export let values
  export let pixelCrop, croppedImage
  export let isVisible = true
  export let error = ''
  export let touched = false

  const dispatch = createEventDispatcher();

  function handleChange(event) {
      touched = true;
      dispatch('change', { name, value: event.target.value });
  }

  function onFileSelected(e) {
      let imageFile = e.target.files[0];
      let reader = new FileReader();
      reader.onload = e => {
          image = e.target.result;
      };
      reader.readAsDataURL(imageFile);
  }

  function previewCrop(e) {
      pixelCrop = e.detail.pixels;
  }

  async function cropImage() {
      value = await getCroppedImg(image, pixelCrop);
      dispatch('change', { name, value: croppedImage }); // Dispatch cropped image
  }

  function reset() {
      croppedImage = null;
      image = null;
  }
</script>

{#if isVisible}
  <div class="grid w-full items-center gap-1.5 mb-8">
      <Label for={id}>{title||name}</Label>
      {#if value}
        <img src={db.getUrl(values, value)} width="100" height="100"/>
      {/if}
      {#if image}
      <div style="position: relative; width: 100%; height: 300px;">
        Crop Preview:
        <Cropper
              {image}
              class={inputClass}
              bind:crop 
              bind:zoom
              on:cropcomplete={previewCrop}
              aspect={1}
          />
      </div>
      <button type="button" on:click={cropImage}>Crop Image</button>
      <button type="button" on:click={reset}>Reset</button>
      {/if}
      <input type="file" capture="user" accept="image/*" on:change={onFileSelected} style="margin-top: 10px;">
      {#if touched && error}
          <div id="{name}-error">{error}</div>
      {/if}
  </div>
{/if}

<style>
  /* Styles for Cropper component */
</style>
