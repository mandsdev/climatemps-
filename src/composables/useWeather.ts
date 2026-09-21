import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// 1. Definindo as interfaces corretas para o TypeScript parar de reclamar de 'any' ou 'unknown'
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

interface WeatherResponse {
  main: {
    temp: number
  }
  weather: {
    main: string
    description: string
    icon: string
  }[]
  name: string
}

function isWeatherResponse(value: unknown): value is WeatherResponse {
  if (!isRecord(value)) return false

  const { main, weather } = value

  if (
    typeof value.name !== 'string' ||
    !isRecord(main) ||
    typeof main.temp !== 'number' ||
    !Array.isArray(weather) ||
    weather.length === 0
  ) {
    return false
  }

  return weather.every((item) => {
    if (!isRecord(item)) return false
    const condition = item
    return (
      typeof condition.main === 'string' &&
      typeof condition.description === 'string' &&
      typeof condition.icon === 'string'
    )
  })
}

interface UseWeatherReturn {
  temperature: Ref<number | null>
  description: Ref<string>
  city: Ref<string>
  searchCity: Ref<string>
  loading: Ref<boolean>
  error: Ref<string>
  formattedDate: ComputedRef<string>
  formattedTime: ComputedRef<string>
  weatherConditionPT: ComputedRef<string>
  weatherImage: ComputedRef<string>
  searchWeather: () => void
  useLocation: () => void
}

export function useWeather(): UseWeatherReturn {
  const apiKey = String(import.meta.env.VITE_OPENWEATHER_API_KEY ?? '')

  // Dados reativos com tipos explícitos
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

  // Formatos de data e hora
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

  // Traduções das condições climáticas
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

  // Imagens dinâmicas baseadas no clima
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

  // Corrigido: data agora usa a interface estrita WeatherResponse
  function updateWeather(data: WeatherResponse): void {
    temperature.value = Math.round(data.main.temp)
    weatherMain.value = data.weather[0].main
    description.value = data.weather[0].description
    icon.value = data.weather[0].icon
    city.value = data.name
  }

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
      const data = await response.json().then((body: unknown): unknown => body)

      if (!response.ok) {
        // Se a resposta der erro estruturado da API
        const message =
          isRecord(data) && typeof data.message === 'string'
            ? data.message
            : 'Erro ao consultar o clima.'
        throw new Error(message)
      }

      if (!isWeatherResponse(data)) throw new Error('Resposta inválida da API.')
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

  function searchWeather(): void {
    const query = searchCity.value.trim()
    if (query) void requestWeather({ q: query })
    searchCity.value = ''
  }

  function requestLocation(): void {
    searchCity.value = ''
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void requestWeather({
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

  // Controle do relógio interno
  onMounted(() => {
    clock = globalThis.setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onBeforeUnmount(() => {
    globalThis.clearInterval(clock)
  })

  return {
    temperature,
    description,
    city,
    searchCity,
    loading,
    error,
    formattedDate,
    formattedTime,
    weatherConditionPT,
    weatherImage,
    searchWeather,
    useLocation: requestLocation,
  }
}
