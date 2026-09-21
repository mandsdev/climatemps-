<script setup lang="ts">
  import WeatherForm from './components/weatherForm.vue'
  import { useWeather } from './composables/useWeather'

  // importa a lógica 
  const {
    city,
    searchCity,
    loading,
    error,
    formattedTime,
    temperature,
    weatherConditionPT,
    weatherImage,
    searchWeather,
    useLocation,
  } = useWeather()
</script>

<template>
  <main
    class="xs:px-4 xs:py-10 min-h-screen bg-[#f6f7fb] px-3 py-6 font-sans text-slate-800 sm:grid sm:place-items-center">
    <section
      class="xs:p-6 w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg shadow-slate-300/40 sm:rounded-2xl sm:p-10">
      <!-- local e hora -->
      <header class="xs:flex-row xs:items-start xs:justify-between flex flex-col gap-1">
        <div>
          <p class="text-[10px] font-bold tracking-[.22em] text-sky-600 uppercase sm:text-xs">
            climatemps
          </p>
          <h1
            class="xs:mt-2 mt-1 max-w-[90%] text-2xl font-semibold tracking-tight wrap-break-word text-slate-800 sm:text-3xl">
            {{ city || 'Escolha uma cidade' }}
          </h1>
        </div>
        <p class="xs:text-sm xs:text-right text-xs text-slate-400">{{ formattedTime }}</p>
      </header>

      <!-- componente do formulário isolado -->
      <WeatherForm
        v-model="searchCity"
        :loading="loading"
        @submit="searchWeather"
        @locate="useLocation" />

      <!-- erro ou carregamento -->
      <p
        v-if="error"
        class="mt-5 rounded-xl bg-red-50 p-4 text-center text-sm font-medium text-red-700"
        role="alert">
        {{ error }}
      </p>

      <div v-else-if="loading" class="grid min-h-62.5 place-items-center text-sm text-slate-500">
        Carregando clima…
      </div>

      <!-- exibição do clima (trecho final do seu código) -->
      <section v-else class="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-[#f4f6fc]">
        <div class="xs:gap-6 xs:p-7 grid items-center gap-4 p-5 sm:grid-cols-[1fr_1.15fr] sm:p-9">
          <div class="xs:min-h-[200px] grid min-h-40 place-items-center sm:min-h-64">
        
            <img
              :src="weatherImage"
              :alt="weatherConditionPT"
              class="xs:h-48 xs:w-48 h-40 w-40 object-contain" />
          </div>
          <div>
            <span class="text-5xl font-bold tracking-tighter text-slate-800 sm:text-6xl"
              >{{ temperature }}°</span
            >
            <p class="mt-1 text-base font-medium text-slate-500 sm:text-lg">
              {{ weatherConditionPT }}
            </p>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
