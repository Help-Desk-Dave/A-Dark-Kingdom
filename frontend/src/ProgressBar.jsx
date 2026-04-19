import React from 'react';

const ProgressBar = ({ progress, label, onClick, disabled }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`bg-gray-800 text-white px-4 py-2 font-bold hover:bg-gray-700 rounded border border-gray-600 relative overflow-hidden ${disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
            <div
                className="absolute left-0 top-0 h-full bg-gray-600 transition-all duration-75"
                style={{ width: `${progress}%` }}
            />
            <span className="relative z-10">{label}</span>
        </button>
    );
};

export default ProgressBar;
