#!/usr/bin/env node
/* eslint-disable no-console */
const axios = require('axios')

async function main() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8080'
  const email =
    process.env.SMOKE_USER_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.SMOKE_EMAIL ||
    ''
  const password =
    process.env.SMOKE_USER_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    process.env.SMOKE_PASSWORD ||
    ''

  if (!email || !password) {
    console.error(
      '❌ Missing credentials. Set SMOKE_USER_EMAIL/SMOKE_USER_PASSWORD (or ADMIN_EMAIL/ADMIN_PASSWORD).',
    )
    process.exit(1)
  }

  const client = axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    validateStatus: () => true,
  })

  console.log('🔐 Logging in…')
  const loginResponse = await client.post(
    '/api/auth/login',
    {
      email,
      password,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  if (loginResponse.status !== 200 || !loginResponse.data?.sessionActive) {
    console.error('❌ Login failed', {
      status: loginResponse.status,
      data: loginResponse.data,
    })
    process.exit(1)
  }

  const cookies = loginResponse.headers['set-cookie'] || []
  if (!cookies.length) {
    console.error('❌ Login succeeded but no cookies were returned.')
    process.exit(1)
  }
  const cookieHeader = cookies.map((cookie) => cookie.split(';')[0]).join('; ')

  console.log('💾 Requesting short-lived API token…')
  const tokenResponse = await client.post(
    '/api/auth/token',
    {},
    {
      headers: {
        Cookie: cookieHeader,
        Accept: 'application/json',
      },
    },
  )

  if (tokenResponse.status !== 200 || !tokenResponse.data?.token) {
    console.error('❌ Token request failed', {
      status: tokenResponse.status,
      data: tokenResponse.data,
    })
    process.exit(1)
  }

  const apiToken = tokenResponse.data.token
  console.log('✅ Received API token (length:', apiToken.length, ')')

  console.log('🧪 Verifying API token against /api/me …')
  const meResponse = await client.get('/api/me', {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
    },
  })

  if (meResponse.status !== 200 || !meResponse.data?.email) {
    console.error('❌ /api/me with token failed', {
      status: meResponse.status,
      data: meResponse.data,
    })
    process.exit(1)
  }

  console.log('✅ /api/me returned user:', meResponse.data.email)
  console.log('🖼️ Fetching protected logo asset with token…')
  const assetUrl = `/assets/customization/logo.png?token=${encodeURIComponent(apiToken)}`
  const assetResponse = await client.get(assetUrl, {
    responseType: 'arraybuffer',
    headers: {
      Accept: 'image/png,image/*;q=0.8',
    },
  })

  if (!(assetResponse.status >= 200 && assetResponse.status < 400)) {
    console.error('❌ Asset fetch failed', {
      status: assetResponse.status,
      headers: assetResponse.headers,
    })
    process.exit(1)
  }

  console.log('✅ Asset fetch succeeded, bytes:', assetResponse.data?.byteLength || assetResponse.data?.length)
  console.log('🎉 Smoke test completed successfully.')
}

main().catch((error) => {
  console.error('❌ Smoke test crashed:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
  })
  process.exit(1)
})
