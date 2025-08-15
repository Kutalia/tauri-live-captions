import { useEffect } from 'react'
import './App.css'
import Captions from './containers/Captions'
import { checkForAppUpdates } from './utils/updater'

function App() {
  useEffect(() => {
    checkForAppUpdates()
  }, [])

  return <Captions />
}

export default App
