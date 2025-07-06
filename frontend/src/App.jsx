import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import SignUp from './components/SignUp' 
import Profile from './components/Profile'
import HowItWork from './components/HowItWork'
import Features from './components/Features'
import GroupDetails from './components/GroupDetails'
import CreateGroup from './components/CreateGroup'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/features" element={<Features />} />
        <Route path="/howItWork" element={<HowItWork/>} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/groupdetails" element={<GroupDetails/>}/>
        <Route path="/creategroup" element={<CreateGroup/>}/>
      </Routes>
    </div>
  )
}

export default App
