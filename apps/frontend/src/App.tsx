import { useState } from 'react'
import client from './api/client'
import './App.css'

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('')

  const testHealthEndpoint = async () => {
    try {
      // Type-safe API call - autocomplete works for /health
      const response = await client.health.$get()
      const data = await response.json()

      // TypeScript knows the shape of data
      setHealthStatus(data.status)
    } catch (error) {
      setHealthStatus('Error: ' + error)
    }
  }

  const testWrongEndpoint = async () => {
    try {
      // This will show TypeScript error - endpoint doesn't exist
      // @ts-expect-error - Testing that wrong endpoints show type errors
      const response = await client.wrongendpoint.$get()
      console.log(response)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <h1>Hono RPC Type Safety Test</h1>
      <div className="card">
        <button onClick={testHealthEndpoint}>
          Test Health Endpoint
        </button>
        <p>Health Status: {healthStatus || 'Not tested yet'}</p>

        <button onClick={testWrongEndpoint}>
          Test Wrong Endpoint (Should have TS error)
        </button>
      </div>
    </>
  )
}

export default App
