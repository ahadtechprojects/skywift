import { FaPlane } from "react-icons/fa";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="text-center">
        <FaPlane className="text-6xl text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">SkySwift</p>
      </div>
    </div>
  );
}