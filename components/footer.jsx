import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#081229] text-white mt-10">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Brand Section */}
          <div className="max-w-lg">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                W
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white">
                  WealthSync
                </h2>

                <p className="text-slate-400 text-sm">
                  AI Finance Manager
                </p>
              </div>
            </div>

            <p className="text-slate-400 leading-7 text-base">
              AI-powered platform to help you track expenses, manage budgets,
              analyze spending habits, and make smarter financial decisions
              with real-time insights.
            </p>

            {/* Social Links */}
            <div className="flex gap-4 mt-8">
              <a
                href="https://github.com/YOUR_GITHUB_USERNAME"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all duration-300 flex items-center justify-center"
              >
                <FaGithub className="text-xl text-slate-300" />
              </a>

              <a
                href="https://linkedin.com/in/YOUR_LINKEDIN_USERNAME"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all duration-300 flex items-center justify-center"
              >
                <FaLinkedin className="text-xl text-slate-300" />
              </a>

              <a
                href="mailto:shrashtiyadav188@gmail.com"
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all duration-300 flex items-center justify-center"
              >
                <FaEnvelope className="text-xl text-slate-300" />
              </a>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 mt-10 pt-5 flex justify-center">
            <p className="text-slate-500 text-sm text-center">
              © {new Date().getFullYear()} WealthSync. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;