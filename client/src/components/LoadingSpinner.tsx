import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...', size = 'md' }) => {
  const sizeStyles = {
    sm: {
      container: 'flex items-center justify-center',
      spinner: 'h-5 w-5 border-2',
      ping: 'h-5 w-5 border-2',
    },
    md: {
      container: 'flex flex-col items-center justify-center min-h-[400px]',
      spinner: 'h-16 w-16 border-4',
      ping: 'h-16 w-16 border-4',
    },
    lg: {
      container: 'flex flex-col items-center justify-center min-h-[500px]',
      spinner: 'h-24 w-24 border-4',
      ping: 'h-24 w-24 border-4',
    },
  };

  const styles = sizeStyles[size];

  if (size === 'sm') {
    return (
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-200 border-t-purple-600"></div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="relative">
        <div className={`animate-spin rounded-full ${styles.spinner} border-purple-200 border-t-purple-600 mx-auto mb-4`}></div>
        <div className={`absolute inset-0 animate-ping rounded-full ${styles.ping} border-purple-400 opacity-20 mx-auto`}></div>
      </div>
      <p className="text-gray-600 font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
