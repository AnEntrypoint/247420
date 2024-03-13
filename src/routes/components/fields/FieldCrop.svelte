<script>
  import { createEventDispatcher } from 'svelte'
  import { Label } from '$lib/components/ui/label'
  import Cropper from "svelte-easy-crop"
  import getCroppedImg from '$lib/canvasUtils'

  export let name = ''
  export let id = ''
  export let system = ''
  export let type, presentable, unique, options, inputClass;
  export let value = ''
  export let image;
  export let crop = { x: 0, y: 0 }
  export let zoom = 1
  let pixelCrop, croppedImage;
  let isVisible = true; // Assuming it's always visible
  let error = '';
  let touched = false;
  let required = true; // Assuming it's always required
  let props = {};
  const defaultSrc = "https://cdn1-www.dogtime.com/assets/uploads/2011/03/puppy-development.jpg";

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
      <Label for={id}>{name}</Label>
      <div style="position: relative; width: 100%; height: 300px;">
          <Cropper
              {image}
              class={inputClass}
              bind:crop 
              bind:zoom
              on:cropcomplete={previewCrop}
              aspect={1}
          />
      </div>
      <input type="file" capture="user" accept="image/*" on:change={onFileSelected} style="margin-top: 10px;">
      {#if touched && error}
          <div id="{name}-error">{error}</div>
      {/if}
      <button type="button" on:click={cropImage}>Crop Image</button>
      <button type="button" on:click={reset}>Reset</button>
  </div>
{/if}

<style>
  /* Styles for Cropper component */
</style>
