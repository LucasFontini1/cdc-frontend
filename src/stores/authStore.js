
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import authApi from '@/api/authApi'

export const useAuthStore = defineStore('auth', () => {
  // ==========================================
  // ESTADOS
  // ==========================================

  const accessToken = ref(
    localStorage.getItem('access_token') || null,
  )

  const refreshToken = ref(
    localStorage.getItem('refresh_token') || null,
  )

  const user = ref(null)
  const errorMessage = ref('')
  const loading = ref(false)

  // ==========================================
  // GETTERS
  // ==========================================

  const isAuthenticated = computed(
    () => Boolean(accessToken.value),
  )

  // ==========================================
  // TRATAMENTO DE ERROS
  // ==========================================

  function getErrorMessage(error) {
    const data = error?.response?.data

    if (typeof data?.detail === 'string') {
      return data.detail
    }

    if (data && typeof data === 'object') {
      const messages = Object.entries(data)
        .flatMap(([field, errors]) => {
          const values = Array.isArray(errors)
            ? errors
            : [errors]

          return values.map((message) =>
            `${field}: ${message}`,
          )
        })

      if (messages.length) {
        return messages.join(' ')
      }
    }

    return error?.message || 'Ocorreu um erro inesperado.'
  }

  function clearError() {
    errorMessage.value = ''
  }

  // ==========================================
  // SALVAR SESSÃO JWT
  // ==========================================

  function saveSession({ access, refresh }) {
    if (!access || !refresh) {
      throw new Error(
        'O backend não retornou os tokens necessários.',
      )
    }

    accessToken.value = access
    refreshToken.value = refresh

    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  // ==========================================
  // BUSCAR USUÁRIO AUTENTICADO
  // ==========================================

  async function loadCurrentUser() {
    clearError()

    try {
      const response = await authApi.me()

      user.value = response.data

      return user.value
    } catch (error) {
      errorMessage.value = getErrorMessage(error)

      if (error.response?.status === 401) {
        logout()
      }

      throw error
    }
  }

  // ==========================================
  // LOGIN
  // ==========================================

  async function login(credentials) {
    clearError()
    loading.value = true

    try {
      const response = await authApi.login(credentials)

      saveSession(response.data)

      await loadCurrentUser()

      return true
    } catch (error) {
      const message = getErrorMessage(error)

      logout()
      errorMessage.value = message

      return false
    } finally {
      loading.value = false
    }
  }

  // ==========================================
  // REGISTRO COM LOGIN AUTOMÁTICO
  // ==========================================

  async function register(credentials) {
    clearError()
    loading.value = true

    try {
      await authApi.register(credentials)

      const loggedIn = await login({
        login: credentials.email,
        password: credentials.password,
      })

      if (!loggedIn) {
        errorMessage.value =
          'Conta criada, mas não foi possível entrar automaticamente. ' +
          errorMessage.value
      }

      return loggedIn
    } catch (error) {
      errorMessage.value = getErrorMessage(error)
      return false
    } finally {
      loading.value = false
    }
  }

  // ==========================================
  // RENOVAR ACCESS TOKEN
  // ==========================================

  async function refreshAccessToken() {
    const token = localStorage.getItem('refresh_token')

    if (!token) {
      logout()
      return null
    }

    try {
      const response = await authApi.refresh(token)

      const { access, refresh } = response.data

      if (!access) {
        throw new Error('Token de acesso não retornado.')
      }

      accessToken.value = access
      localStorage.setItem('access_token', access)

      if (refresh) {
        refreshToken.value = refresh
        localStorage.setItem('refresh_token', refresh)
      }

      return access
    } catch (error) {
      logout()
      errorMessage.value = getErrorMessage(error)
      return null
    }
  }

  // ==========================================
  // RESTAURAR SESSÃO AO ABRIR O SITE
  // ==========================================

  async function restoreSession() {
    const savedAccess = localStorage.getItem('access_token')
    const savedRefresh = localStorage.getItem('refresh_token')

    if (!savedAccess && !savedRefresh) {
      logout()
      return false
    }

    // Renova antes de buscar o perfil.
    // Evita usar um access token expirado.
    if (savedRefresh) {
      const newAccess = await refreshAccessToken()

      if (!newAccess) return false
    } else {
      accessToken.value = savedAccess
    }

    try {
      await loadCurrentUser()
      return true
    } catch {
      return false
    }
  }

  // ==========================================
  // ATUALIZAR PERFIL
  // ==========================================

  async function updateUserAccount(data) {
    clearError()
    loading.value = true

    try {
      const response = await authApi.updateMe(data)

      user.value = response.data

      return response.data
    } catch (error) {
      errorMessage.value = getErrorMessage(error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_profile_cache')
  }

  // ==========================================
  // EXPORTAÇÕES
  // ==========================================

  return {
    accessToken,
    refreshToken,
    user,
    errorMessage,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    loadCurrentUser,
    refreshAccessToken,
    restoreSession,
    updateUserAccount,
    clearError,
  }
})
