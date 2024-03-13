<script>
	import { onMount } from 'svelte';
	let days;
	let hours;
	let minutes;
	let seconds;
    let run=() =>{
			var now = new Date().getTime();
			var distance = countDownDate - now;
			days = Math.floor(distance / (1000 * 60 * 60 * 24));
			hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			seconds = Math.floor((distance % (1000 * 60)) / 1000);
		}
	var countDownDate = new Date('April 20, 2024 07:07:17 UTC').getTime();
	onMount(async () => {
		setInterval(run , 1000);
        run()
	});
</script>

<div class="pr-4 pl-4 pt-8 text-right">Countdown to 420 BTC Halvening: {days?days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's ':''}</div>
