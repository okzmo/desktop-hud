<script>
	import '../app.css';
</script>

<slot />

<style lang="postcss">
	:global(body) {
		background-color: theme(colors.zinc.925);
		color: theme(colors.zinc.50);
		height: 100vh;
		font-family: 'Outfit';
	}
</style>
