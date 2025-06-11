import { useState } from 'react'

import './App.css'
import './appkitConfig'; 
import MintButton from './components/MintButton'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './appkitConfig';  
import { modal } from './appkitConfig'; 


function App() {


  return (
    <>
      <MintButton />
    </>
  )
}


export default App
