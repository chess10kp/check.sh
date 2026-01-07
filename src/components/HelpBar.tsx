import { Box, Text } from 'ink';

interface HelpBarProps {
  shortcuts: string;
}

export default function HelpBar({ shortcuts }: HelpBarProps) {
  return (
    <Box justifyContent="space-between">
      <Box borderStyle="single" borderColor="gray" paddingX={2}>
        <Text color="gray">{shortcuts}</Text>
      </Box>
    </Box>
  );
}
