import React from 'react';
import './ui.css';

export const Card = ({ children, className = '', glass = false, ...props }) => {
    return (
        <div className={`card ${glass ? 'glass' : ''} ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardHeader = ({ title, subtitle, className = '', action }) => {
    return (
        <div className={`card-header ${className}`}>
            <div>
                <h3 className="card-title">{title}</h3>
                {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
            {action && <div className="card-header-action">{action}</div>}
        </div>
    );
};

export const CardContent = ({ children, className = '' }) => {
    return (
        <div className={`card-content ${className}`}>
            {children}
        </div>
    );
};

export const CardFooter = ({ children, className = '' }) => {
    return (
        <div className={`card-footer ${className}`}>
            {children}
        </div>
    );
};
