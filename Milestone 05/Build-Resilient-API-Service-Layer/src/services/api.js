import axios, { isAxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://fakestoreapi.com'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      console.warn('Global 401 handler triggered')
    } else if (status === 403) {
      console.warn('Global 403 handler triggered')
    } else if (status != null && status >= 500) {
      console.warn('Global 5xx handler triggered', status)
    }
    return Promise.reject(error)
  }
)

export { isAxiosError }

/** GET /products */
export function getProducts() {
  return api.get('/products').then((res) => res.data)
}

/** GET /products/categories */
export function getProductCategories() {
  return api.get('/products/categories').then((res) => res.data)
}

/** POST /carts */
export function createCart(payload) {
  return api.post('/carts', payload).then((res) => res.data)
}

/** GET /products/:id */
export function getProductById(id) {
  return api.get(`/products/${id}`).then((res) => res.data)
}

/** GET /products/category/:category */
export function getProductsByCategory(category) {
  return api.get(`/products/category/${encodeURIComponent(category)}`).then((res) => res.data)
}

/** POST /users — demo “review” submission (same path as starter) */
export function postUser(payload) {
  return api.post('/users', payload).then((res) => res.data)
}

/** GET /carts/user/:userId */
export function getCartsByUserId(userId) {
  return api.get(`/carts/user/${userId}`).then((res) => res.data)
}

/** DELETE /carts/:cartId */
export function deleteCartById(cartId) {
  return api.delete(`/carts/${cartId}`).then((res) => res.data)
}

/** GET /users/:id */
export function getUserById(id) {
  return api.get(`/users/${id}`).then((res) => res.data)
}

/** PUT /users/:id */
export function updateUserById(id, body) {
  return api.put(`/users/${id}`, body).then((res) => res.data)
}

export default api
