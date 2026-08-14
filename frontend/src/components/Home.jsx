import React, { useEffect } from 'react';
import api from '../api';
import Header from './Header';
import { useLocation, useNavigate } from 'react-router-dom';
import { showNotification } from '../notifications';
import { motion } from 'framer-motion';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/user/profile')
        .then(() => navigate('/dashboard'))
        .catch(() => {
          localStorage.removeItem('token');
          showNotification('Session expired. Please log in again.', 'warning');
          navigate('/login');
        });
    }
  }, [navigate]);

  useEffect(() => {
    if (!location.hash) return;
    const sectionId = location.hash.replace('#', '');
    const section = document.getElementById(sectionId);
    if (section) {
      setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [location.hash]);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section id="home" className="scroll-mt-24 min-h-screen flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-4 py-16 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="z-10"
        >
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 tracking-tight text-gray-900">
            Welcome to <span className="text-blue-600">OweGo</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto font-light">
            The smartest, most secure way to split expenses with friends and family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-4 cursor-pointer bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Get Started for Free
            </button>
            <button 
              onClick={() => scrollTo('features')}
              className="px-8 py-4 cursor-pointer bg-gray-100 text-gray-700 rounded-full font-semibold text-lg hover:bg-gray-200 transition-colors"
            >
              Explore Features
            </button>
          </div>
        </motion.div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl -z-10 opacity-50"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-24 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900">Why OweGo?</h2>
            <p className="text-xl text-gray-500 mt-4 max-w-2xl mx-auto">Everything you need to manage shared expenses without the headache.</p>
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: false, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { title: 'Natural Language AI', desc: 'Just type "Person A paid ₹1000, Person B paid ₹200" and we figure out who owes whom.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { title: 'Smart Splits', desc: 'OweGo intelligently splits bills and calculates exact balances instantly.', color: 'text-blue-600', bg: 'bg-blue-50' },
              { title: 'Debt Simplification', desc: 'Minimize the total number of transactions required to settle up your group.', color: 'text-green-600', bg: 'bg-green-50' },
              { title: 'Personal Expenses', desc: 'Track your personal spending alongside group splits, all in one unified dashboard.', color: 'text-purple-600', bg: 'bg-purple-50' },
              { title: 'Group Management', desc: 'Create and manage unlimited groups for trips, roommates, or special events easily.', color: 'text-orange-600', bg: 'bg-orange-50' },
              { title: 'Visual Analytics', desc: 'Monitor your spending habits with interactive charts and beautiful dashboard graphs.', color: 'text-pink-600', bg: 'bg-pink-50' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={fadeUp}
                whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center font-bold text-xl mb-6`}>
                  {i + 1}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust / Security Section */}
      <section id="security" className="py-24 bg-blue-600 text-white overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: false, amount: 0.3 }}
          >
            <h2 className="text-4xl font-bold mb-6">Bank-Grade Security & Data Integrity</h2>
            <p className="text-blue-100 text-lg mb-6 leading-relaxed">
              We take your financial data seriously. Unlike traditional apps, OweGo uses <strong>Cryptographic HMAC Signatures</strong> to protect your records.
            </p>
            <ul className="space-y-4">
              {[
                'Immutable expense records via cryptographic hashing.',
                'Zero risk of database tampering by unauthorized admins.',
                'Perfect floating-point math stored in exact integer cents.'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center space-x-3 text-blue-50">
                  <svg className="w-6 h-6 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: false, amount: 0.3 }}
            className="bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
              <span className="font-mono text-blue-200">System Logs</span>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
            <div className="font-mono text-sm space-y-3 text-gray-300">
              <p>➜ validating_signature...</p>
              <p className="text-green-400">✔ HMAC_SHA256 match confirmed.</p>
              <p>➜ checking_integrity...</p>
              <p className="text-green-400">✔ Data immutable.</p>
              <p>➜ parsing_amount: 1550 cents</p>
              <p className="text-blue-300">➔ Transaction Secure.</p>
            </div>
          </motion.div>
        </div>
        
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-700 rounded-full blur-3xl opacity-50 z-0"></div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="scroll-mt-24 py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-500 mt-4 max-w-2xl mx-auto">Three simple steps to settle up.</p>
          </motion.div>

          <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 transform -translate-y-1/2"></div>
            
            {[
              { step: '1', title: 'Describe', desc: 'Create a group and add expenses using simple language.', color: 'text-blue-600' },
              { step: '2', title: 'Analyze', desc: 'OweGo instantly calculates exact balances and splits.', color: 'text-green-600' },
              { step: '3', title: 'Settle', desc: 'See who owes whom and settle up with one click.', color: 'text-yellow-600' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                viewport={{ once: false, amount: 0.3 }}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full md:w-1/3 text-center z-10"
              >
                <div className={`w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-2xl font-bold ${item.color} mb-6 shadow-inner`}>
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-gray-50 text-center border-t border-gray-100">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to stop doing math?</h2>
          <button 
            onClick={() => navigate('/signup')}
            className="px-10 py-4 cursor-pointer bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-colors"
          >
            Create Your Account
          </button>
        </motion.div>
      </section>
    </div>
  );
}

export default Home;
