<script setup lang="ts">
  // Vmodel bidirecional para o texto da busca
  const searchCity = defineModel<string>({ required: true })

  defineProps({
    loading: {
      type: Boolean,
      required: true,
    },
  })

  // emite eventos para o arquivo pai quando o usuário interagir
  defineEmits<{
    (event: 'submit' | 'locate'): void
  }>()
</script>

<template>
  <form class="mt-7 flex flex-col gap-3 sm:flex-row" @submit.prevent="$emit('submit')">
    <label class="sr-only" for="city">Cidade</label>

    <div
      class="flex flex-1 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 transition focus-within:border-sky-600 focus-within:ring-2">
      <svg
        class="h-5 w-5 shrink-0 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.2-4.2" />
      </svg>
      <input
        id="city"
        v-model="searchCity"
        autocomplete="off"
        class="xs:text-base w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
        type="search"
        placeholder="Digite seu local" />
    </div>

    <div class="flex gap-2 sm:flex-none">
      <button
        class="flex-1 rounded-lg bg-[#13337e] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0f2865] disabled:opacity-60 sm:flex-none sm:text-base"
        :disabled="loading">
        Buscar
      </button>

      <button
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 sm:h-auto sm:w-auto sm:px-4"
        type="button"
        :disabled="loading"
        aria-label="Usar minha localização"
        @click="$emit('locate')">
        <img class="xs:h-6 xs:w-6 h-5 w-5" src="/imagens/localizacao.svg" alt="" />
      </button>
    </div>
  </form>
</template>
