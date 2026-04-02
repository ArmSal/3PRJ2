<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script>
export default { name: 'App' }
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; background: #1a1a2e; color: #fff; }
button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
input { padding: 10px; border-radius: 4px; border: 1px solid #444; background: #16213e; color: #fff; }
</style>
