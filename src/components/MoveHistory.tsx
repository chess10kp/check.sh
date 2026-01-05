import React from 'react';
import { Box, Text } from 'ink';

interface MoveHistoryProps {
  moves: string;
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const movePairs = parsePGN(moves);

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text bold color="gray">Move History:</Text>
      {movePairs.map((pair, index) => (
        <Box key={index} flexDirection="row" gap={2}>
          <Text color="white">
            {index + 1}. {pair.white || '...'}
          </Text>
          <Text color="black">
            {pair.black || ''}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

function parsePGN(moves: string): Array<{ white?: string; black?: string }> {
  const pairs: Array<{ white?: string; black?: string }> = [];
  const moveArray = moves.split(' ').filter(m => m);

  for (let i = 0; i < moveArray.length; i += 2) {
    pairs.push({
      white: moveArray[i],
      black: moveArray[i + 1],
    });
  }

  return pairs;
}
