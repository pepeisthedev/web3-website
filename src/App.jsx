import { useState } from 'react'

import './App.css'
import './appkitConfig'; 
import LandingPage from './components/LandingPage'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './appkitConfig';  
import { modal } from './appkitConfig'; 


function App() {


  return (
    <>
      <LandingPage />
    </>
  )
}


export default App
