import './App.css'
import AppBar from './components/appBar'
import Hero from './components/hero'
function App() {

  return (
    <div className="min-h-screen flex flex-col justify-center w-screen bg-gray-900 text-white">
      <AppBar />
      <Hero />
    </div>
  )
}

export default App
