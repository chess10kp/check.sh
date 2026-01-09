import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../lib/themes.js';

interface HelpScreenProps {
  onClose: () => void;
}

export default function HelpScreen({ onClose }: HelpScreenProps) {
  useInput((input) => {
    if (input === 'q' || input === '?' || input === 'escape') {
      onClose();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold>Keyboard Shortcuts:</Text></Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color={defaultTheme.accent}>Broadcast List:</Text>
        <Text>  ↑/k    - Move up</Text>
        <Text>  ↓/j    - Move down</Text>
        <Text>  Enter   - Select broadcast</Text>
        <Text>  r       - Refresh list</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color={defaultTheme.accent}>Game View:</Text>
        <Text>  q       - Return to list</Text>
        <Text>  r       - Refresh game</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color={defaultTheme.accent}>Global:</Text>
        <Text>  ?       - Show this help</Text>
        <Text>  q       - Quit application</Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Press any key to close</Text>
      </Box>
    </Box>
  );
}
