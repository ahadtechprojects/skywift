import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            ✈️ SkySwift
          </h2>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Your trusted partner for seamless travel experiences.  
            Book flights, track journeys, and manage bookings with ease.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Explore
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Home</Link></li>
            <li><Link to="/search" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Flights</Link></li>
            <li><Link to="/manage-bookings" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Bookings</Link></li>
            <li><Link to="/profile" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">My Account</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Support
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Contact Us</Link></li>
            <li><Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">FAQs</Link></li>
            <li><Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Help Center</Link></li>
            <li><Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Policies</Link></li>
          </ul>
        </div>

        {/* Contact & Socials */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Stay Connected
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">support@skyswift.com</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">+1 (800) 555-0123</p>

          <div className="flex gap-4 mt-3 text-gray-600 dark:text-gray-400">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              <FaFacebookF />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              <FaLinkedin />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        © {new Date().getFullYear()} SkySwift. All rights reserved.
      </div>
    </footer>
  );
}
