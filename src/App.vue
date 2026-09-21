<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

  // chave guardada escondidinha
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY

  // dados que mudam na tela.
  const temperature = ref<number | null>(null)
  const weatherMain = ref<string>('')
  const description = ref('')
  const city = ref('')
  const searchCity = ref('')
  const icon = ref<string>('')
  const now = ref(new Date())
  const loading = ref(false)
  const error = ref('')
  let clock: ReturnType<typeof globalThis.setInterval>

  // formatos de data e hora usados no template.
  const formattedDate = computed(() =>
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(now.value),
  )

  const formattedTime = computed(() =>
    new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(now.value),
  )

  // tradução do nome da condição que vem em inglês da OpenWeather.
  const conditionTranslations: Record<string, string> = {
    Clear: 'Céu limpo',
    Clouds: 'Nublado',
    Rain: 'Chuva',
    Drizzle: 'Chuvisco',
    Thunderstorm: 'Tempestade',
    Snow: 'Neve',
    Mist: 'Névoa',
    Fog: 'Neblina',
    Haze: 'Névoa seca',
    Squall: 'Rajadas de vento',
    Tornado: 'Tornado',
  }

  const weatherConditionPT = computed(
    () => conditionTranslations[weatherMain.value] || weatherMain.value || '--',
  )

  // imagens de acordo com o clima
  const weatherImage = computed(() => {
    const isNight = icon.value.endsWith('n')

    if (description.value === 'chuva leve') return '/imagens/chuvisco.png'
    if (weatherMain.value === 'Clear') return isNight ? '/imagens/noite.png' : '/imagens/sol.png'
    if (weatherMain.value === 'Clouds') {
      return isNight ? '/imagens/noitecomnuvens.png' : '/imagens/nublado.png'
    }
    if (weatherMain.value === 'Rain' || weatherMain.value === 'Thunderstorm') {
      return '/imagens/chuva.png'
    }
    if (weatherMain.value === 'Drizzle') return '/imagens/chuvisco.png'
    return '/imagens/sol.png'
  })

  // atualiza os dados exibidos depois que a API responde.
  function updateWeather(data: {
    main: { temp: number }
    weather: { main: string; description: string; icon: string }[]
    name: string
  }): void {
    temperature.value = Math.round(data.main.temp)
    weatherMain.value = data.weather[0].main
    description.value = data.weather[0].description
    icon.value = data.weather[0].icon
    city.value = data.name
  }

  // faz a requisição para a API. "params" pode conter cidade ou latitude/longitude.
  async function requestWeather(params: Record<string, string>): Promise<void> {
    if (!apiKey) {
      error.value = 'Configure VITE_OPENWEATHER_API_KEY no arquivo .env.'
      return
    }
    loading.value = true
    error.value = ''
    try {
      const query = new URLSearchParams({
        ...params,
        units: 'metric',
        appid: apiKey,
        lang: 'pt_br',
      })
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${query}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao consultar o clima.')
      }
      updateWeather(data)
    } catch (requestError) {
      error.value =
        requestError instanceof Error && requestError.message === 'city not found'
          ? 'Cidade não encontrada. Confira o nome e tente novamente.'
          : 'Não foi possível carregar o clima. Tente novamente.'
    } finally {
      loading.value = false
    }
  }

  // pesquisa o nome digitado no campo de cidade.
  function searchWeather(): void {
    const query = searchCity.value.trim()
    if (query) requestWeather({ q: query })
    // limpa o historico de pesquisa
    searchCity.value = ''
  }

  function useLocation(): void {
    if (!navigator.geolocation) {
      error.value = 'Seu navegador não oferece suporte à localização.'
      return
    }
    searchCity.value = ''
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        requestWeather({
          lat: String(coords.latitude),
          lon: String(coords.longitude),
        })
      },
      () => {
        error.value =
          'Não foi possível acessar sua localização. Verifique a permissão do navegador.'
      },
      { timeout: 10_000 },
    )
  }

  // atualiza o relógio enquanto o componente estiver aberto.
  onMounted(() => {
    clock = globalThis.setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onBeforeUnmount(() => globalThis.clearInterval(clock))
</script>

<template>
  <!-- principal y responsividade -->
  <main
    class="xs:px-4 xs:py-10 min-h-screen bg-[#f6f7fb] px-3 py-6 font-sans text-slate-800 sm:grid sm:place-items-center">
    <!-- interface  -->
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

      <!-- botão de pesquisa e botão de localização -->
      <form class="mt-7 flex flex-col gap-3 sm:flex-row" @submit.prevent="searchWeather">
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

        <!-- Botões lado a lado em telas pequenas para economizar espaço vertical -->
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
            @click="useLocation">
            <img class="xs:h-6 xs:w-6 h-5 w-5" src="/imagens/localizacao.svg" alt="" />
          </button>
        </div>
      </form>

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

      <!-- exibição do clima -->
      <section v-else class="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-[#f4f6fc]">
        <div class="xs:gap-6 xs:p-7 grid items-center gap-4 p-5 sm:grid-cols-[1fr_1.15fr] sm:p-9">
          <div class="xs:min-h-[200px] grid min-h-40 place-items-center sm:min-h-64">
            <img
              class="xs:h-48 xs:w-48 h-40 w-40 object-contain sm:h-60 sm:w-60"
              :src="weatherImage"
              :alt="description || 'Imagem do clima'" />
          </div>
          <div class="text-center sm:text-left">
            <p class="xs:text-6xl text-5xl font-semibold tracking-tighter text-slate-800">
              {{ temperature === null ? '--' : temperature }}°
            </p>
            <p class="xs:mt-2 xs:text-xl mt-1 text-lg font-medium capitalize">
              {{ description || 'Clima agora' }}
            </p>
          </div>
        </div>

        <!-- resumo inferior: modifica de grid-cols-1 para grid-cols-3 apenas em telas maiores -->
        <div
          class="xs:grid-cols-3 xs:divide-y-0 xs:divide-x grid grid-cols-1 divide-y divide-slate-200 bg-white/55 text-center">
          <!-- hora -->
          <div class="xs:p-4 p-3">
            <img class="xs:h-5 xs:w-5 mx-auto h-4 w-4" src="/imagens/relogio.svg" alt="Hora" />
            <p class="xs:mt-2 mt-1.5 text-[10px] tracking-wide text-slate-400 uppercase"></p>
            <p class="xs:mt-1 xs:text-base mt-0.5 text-sm font-semibold">{{ formattedTime }}</p>
          </div>

          <!-- data -->
          <div class="xs:p-4 p-3">
            <img class="xs:h-5 xs:w-5 mx-auto h-4 w-4" src="/imagens/data.svg" alt="Data" />
            <p class="xs:mt-2 mt-1.5 text-[10px] tracking-wide text-slate-400 uppercase"></p>
            <p class="xs:mt-1 xs:text-base mt-0.5 text-sm font-semibold">
              {{ now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }}
            </p>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
