import { EngravedString } from '@/components/ui/interactive-string';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <EngravedString text="Careerate" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1
            className="text-5xl md:text-7xl font-bold text-white mb-4"
            style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)' }}
          >
            AI Pair Programmer for DevOps & SRE
          </h1>
          <p
            className="text-lg md:text-xl text-gray-300 mb-8"
            style={{ textShadow: '0 2px 5px rgba(0, 0, 0, 0.5)' }}
          >
            Build, deploy, and manage your infrastructure with an AI partner that understands your code.
          </p>
          <Link
            to="/dashboard"
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 