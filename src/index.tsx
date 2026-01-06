import React from 'react';
import { render } from 'ink';
import App from './App';

try {
  render(<App />, {
    maxFps: 20,
  });
} catch (error: any) {
  if (error.message.includes('Raw mode')) {
    console.error('Error: This terminal does not support raw mode required by Ink.');
    console.error('Try running in a standard terminal (not in IDE or special console).');
  } else {
    console.error('Failed to start:', error.message);
  }
  process.exit(1);
}
