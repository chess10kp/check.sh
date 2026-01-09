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
  useInput((input) => {
    if (input === 'r' && retryCount < maxRetries) {
      onRetry();
    } else if (input === 'q') {
      onQuit();
    }
  });

  const canRetry = retryCount < maxRetries;

  return (
    <Box flexDirection="column" justifyContent="center" padding={2}>
      <Box borderStyle="single" borderColor="red" paddingX={1} paddingY={1} flexDirection="column">
        <Text color="red" bold>❌ Connection Error</Text>
        <Box marginTop={1}><Text>{message}</Text></Box>
        <Box marginTop={1}><Text color="gray">Retry attempt: {retryCount}/{maxRetries}</Text></Box>
        {canRetry && (
          <Box marginTop={1}><Text color="yellow">[r] Retry  [q] Quit</Text></Box>
        )}
        {!canRetry && (
          <Box marginTop={1}><Text color="red">Max retries reached. [q] Quit</Text></Box>
        )}
      </Box>
    </Box>
  );
}
