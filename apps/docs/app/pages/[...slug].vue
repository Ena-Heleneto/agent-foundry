<script setup lang="ts">
/**
 * Nuxt页面按地址重新创建，文档请求与404使用同一规范路径。
 */
const route = useRoute()
/**
 * 去掉末尾斜线以匹配Content默认路径，首页保持根路径。
 */
const path = route.path.replace(/\/$/, '') || '/'
/**
 * 只查询当前用户文档；不存在时向服务器返回真实404。
 */
const { data: page } = await useAsyncData(`docs:${path}`, () => queryCollection('docs').path(path).first())
if (!page.value)
  throw createError({ statusCode: 404, statusMessage: 'Not Found', message: '文档不存在', fatal: true })
useSeoMeta({ title: page.value.title, description: page.value.description })
</script>

<template>
  <div v-if="page" grid="~ cols-1 xl:cols-[minmax(0,1fr)_12rem]" gap="12">
    <article min-w="0" max-w="190" w="full">
      <p text="xs brand" tracking="widest" font="semibold" mb="5">
        AGENT FOUNDRY / DOCS
      </p>
      <h1 text="3xl sm:4xl slate-950" tracking="tight" leading="tight" font="bold" m="0">
        {{ page.title }}
      </h1>
      <p v-if="page.description" text="lg slate-500" leading="8" mt="5" mb="10">
        {{ page.description }}
      </p>
      <div border="t slate-200" pt="8" prose="~ slate" max-w="none">
        <ContentRenderer :value="page" />
      </div>
    </article>
    <aside un-hidden="~" xl:block="~">
      <div position="sticky" top="28">
        <DocsTableOfContents :links="page.body.toc?.links || []" />
      </div>
    </aside>
  </div>
</template>
