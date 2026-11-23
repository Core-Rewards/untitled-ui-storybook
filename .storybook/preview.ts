import { createElement } from 'react';
import type { Preview } from '@storybook/react-vite';
import { ProgramBrandProvider } from '../src/components/themes/program-brand';
import { PROGRAM_BRANDS } from '../src/components/themes/program-brands';
import type { ProgramBrandId } from '../src/components/themes/program-brands';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    viewport: {
      options: {
        phone: {
          name: 'Phone (390 × 844)',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
        desktop: {
          name: 'Desktop (1440 × 900)',
          styles: { width: '1440px', height: '900px' },
          type: 'desktop',
        },
      },
    },
  },

  globalTypes: {
    programBrand: {
      description: 'Program brand: neutral Untitled UI tokens or a client theme',
      toolbar: {
        title: 'Brand',
        icon: 'paintbrush',
        items: [
          { value: 'neutral', title: 'Neutral' },
          { value: 'basf', title: 'BASF Advisor Advantage' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    programBrand: 'neutral',
  },

  decorators: [
    (Story, context) => {
      const id = (context.globals.programBrand as ProgramBrandId | undefined) ?? 'neutral';
      return createElement(
        ProgramBrandProvider,
        { brand: PROGRAM_BRANDS[id] ?? PROGRAM_BRANDS.neutral },
        createElement(Story),
      );
    },
  ],
};

export default preview;
