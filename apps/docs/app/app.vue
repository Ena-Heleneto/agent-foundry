<script setup lang="ts">
/**
 * 使用NuxtPage提供的路由生成页面键，避免全局路由与Suspense渲染互相影响。
 * @param route 正在渲染的目标路由。
 * @returns 文档路径对应的稳定页面键。
 */
function docsPageKey(route: { path: string }): string {
  return route.path
}
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage :page-key="docsPageKey" />
    </NuxtLayout>
  </UApp>
</template>
