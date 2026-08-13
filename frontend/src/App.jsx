import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import SignUp from './components/SignUp' 
import Profile from './components/Profile'
import GroupDetails from './components/GroupDetails'
import CreateGroup from './components/CreateGroup'
import Feedback from './components/Feedback'
import NotificationBar from './components/NotificationBar'

function App() {
  return (
    <div className="pb-16">
      <NotificationBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/groupdetails" element={<GroupDetails/>}/>
        <Route path="/creategroup" element={<CreateGroup/>}/>
        <Route path="/feedback" element={<Feedback/>}/>
      </Routes>
    </div>
  )
}

export default App
