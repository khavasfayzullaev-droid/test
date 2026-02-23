import React from 'react';
import './ui.css';

export const Input = ({
    label,
    error,
    className = '',
    id,
    fullWidth = true,
    ...props
}) => {
    const inputId = id || Math.random().toString(36).substr(2, 9);

    return (
        <div className={`input-group ${fullWidth ? 'w-full' : ''} ${className}`}>
            {label && <label htmlFor={inputId} className="input-label">{label}</label>}
            <input
                id={inputId}
                className={`input-field ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};
