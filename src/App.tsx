import './App.css'
import Captions from './containers/Captions'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

const appWebview = getCurrentWebviewWindow()
// Seems like it's not working
appWebview.setIgnoreCursorEvents(true)

function App() {
  return <Captions />
}

export default App
