<template>
  <div id="app">
    <nav>
      <router-link to="/menu">Menu</router-link>
      <router-link to="/login">Login</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>
