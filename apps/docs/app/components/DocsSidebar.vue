<script setup lang="ts">
/**
 * 导航由同一内容集合生成，新增文档无需维护另一份页面清单。
 */
const { data: pages } = await useAsyncData('docs-navigation', () => queryCollection('docs').order('path', 'ASC').select('path', 'title').all())
/**
 * 当前地址只用于导航语义及选中样式。
 */
const route = useRoute()
</script>

<template>
  <nav aria-label="文档导航">
    <p text="xs slate-500" font="semibold" tracking="widest" mb="5">
      开始使用
    </p>
    <ul list="none" p="0" m="0" space-y="2">
      <li v-for="page in pages" :key="page.path">
        <NuxtLink :to="page.path" :aria-current="route.path === page.path ? 'page' : undefined" block="~" px="3" py="3" rounded="lg" un-text="sm slate-600 hover:brand" bg="hover:slate-100" decoration="none">
          <span v-if="route.path === page.path" text="brand" mr="2" aria-hidden="true">当前</span>{{ page.title }}
        </NuxtLink>
      </li>
    </ul>
    <div mt="8" pt="5" border="t slate-200" text="xs slate-500" leading="7">
      当前工作流<br><span text="slate-800">Implement / Increment</span>
    </div>
  </nav>
</template>
