
import axios from 'axios'
import api from '@/api/config'

// Cliente separado para login, cadastro e renovação.
// Assim, não envia um access token expirado nessas rotas.
const publicApi = axios.create({
  baseURL: api.defaults.baseURL,
})

// 1. REGISTRAR USUÁRIO
export async function registrarUsuario(dados) {
  const response = await publicApi.post('registro/', {
    email: dados.email,
    username: dados.username,
    name: dados.name,
    password: dados.password,
  })

  return response.data
}

// 2. FAZER LOGIN POR E-MAIL OU USERNAME
export async function fazerLogin(identificador, senha) {
  const response = await publicApi.post('token/', {
    login: identificador,
    password: senha,
  })

  const { access, refresh } = response.data

  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)

  return response.data
}

// 3. BUSCAR PERFIL DO USUÁRIO AUTENTICADO
export async function buscarPerfil() {
  const response = await api.get('usuarios/me/')

  return response.data
}

// 4. ATUALIZAR PERFIL
export async function atualizarPerfil(dados) {
  const response = await api.patch('usuarios/me/', dados)

  return response.data
}

// 5. RENOVAR ACCESS TOKEN
export async function renovarToken() {
  const refresh = localStorage.getItem('refresh_token')

  if (!refresh) {
    throw new Error('Sessão não encontrada.')
  }

  try {
    const response = await publicApi.post('token/refresh/', {
      refresh,
    })

    localStorage.setItem(
      'access_token',
      response.data.access
    )

    if (response.data.refresh) {
      localStorage.setItem(
        'refresh_token',
        response.data.refresh
      )
    }

    return response.data.access
  } catch (error) {
    sair()
    throw error
  }
}

// 6. VERIFICAR SE HÁ TOKEN ARMAZENADO
export function possuiToken() {
  return Boolean(localStorage.getItem('access_token'))
}

// 7. SAIR DA CONTA
export function sair() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
