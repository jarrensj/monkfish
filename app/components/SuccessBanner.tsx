"use client";

interface SuccessBannerProps {
  isVisible: boolean;
  action: 'create' | 'join' | null;
  teamName: string;
  onClose: () => void;
}

export default function SuccessBanner({ isVisible, action, teamName, onClose }: SuccessBannerProps) {
  if (!isVisible || !action) return null;

  const messages = {
    create: `🎉 Team "${teamName}" created successfully! You can now start managing your team.`,
    join: `🎉 Successfully joined "${teamName}"! You can now collaborate with other members.`
  };

  return (
    <div className="flex justify-center mt-4 px-4">
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm max-w-lg animate-in slide-in-from-top duration-300">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-green-800">
              {messages[action]}
            </p>
          </div>
          <div className="ml-4">
            <button
              onClick={onClose}
              className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600 transition-colors"
              aria-label="Close banner"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
