const http = require('http')

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET'
}

const req = http.request(options, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1)
})

req.on('error', () => process.exit(1))
req.end()