import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Placeholder from './components/Placeholder';
import Gallery from './components/Gallery';
import Prices from './components/Prices';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');

  const renderContent = () => {
    switch (currentView) {
      case 'prices':
        return <Prices />;
      case 'gallery':
        return <Gallery />;
      case 'home':
      default:
        return (
          <>
            <Hero />
            <Services />
            <Contact />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-white selection:bg-[#FFC300] selection:text-black">
      <Header currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-grow flex flex-col animate-in fade-in duration-500">
        {renderContent()}
      </main>
      
      <Footer />
    </div>
  );
};

export default App;