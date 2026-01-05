import React from 'react';
import { Box, Text, useInput } from 'ink';

interface ErrorDisplayProps {
  message: string;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onQuit: () => void;
}

export default function ErrorDisplay({
  message,
  retryCount,
  maxRetries,
  onRetry,
  onQuit,
}: ErrorDisplayProps) {
  useInput((input, key) => {
    if (input === 'r' && retryCount < maxRetries) {
      onRetry();
    } else if (input === 'q') {
      onQuit();
    }
  });

  const canRetry = retryCount < maxRetries;

  return (
    <Box flexDirection="column" justifyContent="center" padding={2}>
      <Box borderStyle="double" borderColor="red" paddingX={1} paddingY={1}>
        <Text color="red" bold>❌ Connection Error</Text>
        <Text marginTop={1}>{message}</Text>
        <Text color="gray" marginTop={1}>
          Retry attempt: {retryCount}/{maxRetries}
        </Text>
        {canRetry && (
          <Text color="yellow" marginTop={1}>[r] Retry  [q] Quit</Text>
        )}
        {!canRetry && (
          <Text color="red" marginTop={1}>Max retries reached. [q] Quit</Text>
        )}
      </Box>
    </Box>
  );
}
