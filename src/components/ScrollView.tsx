import React, { useEffect, useRef } from 'react';
import { Box, Text, measureElement } from 'ink';

interface ScrollViewProps {
  children: React.ReactNode;
  height?: number;
  width?: number;
  selectedIndex?: number;
}

type ScrollState = {
  height: number;
  innerHeight: number;
  scrollTop: number;
};

type ScrollAction =
  | { type: 'SET_INNER_HEIGHT'; innerHeight: number }
  | { type: 'SCROLL_DOWN' }
  | { type: 'SCROLL_UP' }
  | { type: 'JUMP_TO_INDEX'; index: number };

function reducer(state: ScrollState, action: ScrollAction): ScrollState {
  switch (action.type) {
    case 'SET_INNER_HEIGHT':
      return {
        ...state,
        innerHeight: action.innerHeight
      };

    case 'SCROLL_DOWN':
      return {
        ...state,
        scrollTop: Math.min(
          state.innerHeight - state.height,
          state.scrollTop + 1
        )
      };

    case 'SCROLL_UP':
      return {
        ...state,
        scrollTop: Math.max(0, state.scrollTop - 1)
      };

    case 'JUMP_TO_INDEX': {
      const maxScrollTop = Math.max(0, state.innerHeight - state.height);
      let newScrollTop = state.scrollTop;

      if (action.index < state.scrollTop) {
        newScrollTop = action.index;
      } else if (action.index >= state.scrollTop + state.height) {
        newScrollTop = action.index - state.height + 1;
      }

      return {
        ...state,
        scrollTop: Math.min(newScrollTop, maxScrollTop)
      };
    }

    default:
      return state;
  }
}

export default function ScrollView({
  children,
  height = 20,
  width,
  selectedIndex,
}: ScrollViewProps) {
  const [state, dispatch] = React.useReducer(reducer, {
    height,
    innerHeight: 0,
    scrollTop: 0
  });

  const innerRef = useRef<React.ElementRef<typeof Box>>(null);

  useEffect(() => {
    if (innerRef.current) {
      const dimensions = measureElement(innerRef.current);
      dispatch({
        type: 'SET_INNER_HEIGHT',
        innerHeight: dimensions.height
      });
    }
  }, [children]);

  useEffect(() => {
    if (selectedIndex !== undefined) {
      dispatch({
        type: 'JUMP_TO_INDEX',
        index: selectedIndex
      });
    }
  }, [selectedIndex]);

  const canScrollUp = state.scrollTop > 0;
  const canScrollDown = state.scrollTop + state.height < state.innerHeight;

  return (
    <Box flexDirection="column" height={height} width={width}>
      {canScrollUp && (
        <Box>
          <Text dimColor>↑</Text>
        </Box>
      )}

      <Box
        height={state.height - (canScrollUp ? 1 : 0) - (canScrollDown ? 1 : 0)}
        flexDirection="column"
        overflow="hidden"
      >
        <Box
          ref={innerRef}
          flexShrink={0}
          flexDirection="column"
          marginTop={-state.scrollTop}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                ...(typeof child.props === 'object' && child.props !== null && {
                  isSelected: index === selectedIndex,
                }),
              });
            }
            return child;
          })}
        </Box>
      </Box>

      {canScrollDown && (
        <Box>
          <Text dimColor>↓</Text>
        </Box>
      )}
    </Box>
  );
}

export function truncateText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text;
  return text.slice(0, maxWidth - 1) + '…';
}
