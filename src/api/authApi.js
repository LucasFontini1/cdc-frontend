
import axios from 'axios'
import api from '@/api/config'

// Cliente sem interceptor de autenticação.
// Evita enviar tokens antigos no login e cadastro.
const publicApi = axios.create({
  baseURL: api.defaults.baseURL,
})

const authApi = {
  login(credentials) {
    return publicApi.post('token/', {
      login: credentials.login,
      password: credentials.password,
    })
  },

  register(credentials) {
    return publicApi.post('registro/', {
      name: credentials.name,
      email: credentials.email,
      username: credentials.username,
      password: credentials.password,
    })
  },

  refresh(refreshToken) {
    return publicApi.post('token/refresh/', {
      refresh: refreshToken,
    })
  },

  me() {
    return api.get('usuarios/me/')
  },

  updateMe(data) {
    return api.patch('usuarios/me/', data)
  },
}

export default authApi
