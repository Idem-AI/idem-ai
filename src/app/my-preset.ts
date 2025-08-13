//mypreset.ts
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '#1447e6',
          hoverColor: '#0f3ac0',
          activeColor: '#1447e6',
        },
        highlight: {
          // Use the primary color for selection/highlight backgrounds
          background: '#1447e6',
          focusBackground: '#0f3ac0',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          // Slightly lighter tints for dark mode interactions
          color: '#93c5fd',
          hoverColor: '#bfdbfe',
          activeColor: '#60a5fa',
        },
        highlight: {
          // Subtle blue-tinted highlights to match --color-primary-glow
          background: 'rgba(20, 71, 230, 0.24)',
          focusBackground: 'rgba(20, 71, 230, 0.32)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
  components: {
    // Accordion styling aligned with project glass UI and primary blue
    accordion: {
      root: {
        transitionDuration: '{transition.duration}'
      },
      panel: {
        // subtle bottom divider between panels
        borderWidth: '0 0 1px 0',
        borderColor: '{content.border.color}'
      },
      header: {
        color: '{text.muted.color}',
        hoverColor: '{text.color}',
        activeColor: '{text.color}',
        activeHoverColor: '{text.color}',
        padding: '1rem',
        fontWeight: '600',
        borderWidth: '0.5px',
        borderColor: '{content.border.color}',
        // glass-like backgrounds (match styles.css glass vars)
        background: 'rgba(15, 20, 27, 0.7)',
        hoverBackground: 'rgba(20, 20, 30, 0.6)',
        activeBackground: 'rgba(20, 20, 30, 0.6)',
        activeHoverBackground: 'rgba(20, 20, 30, 0.6)',
        focusRing: {
          width: '{focus.ring.width}',
          style: '{focus.ring.style}',
          color: '{primary.color}',
          offset: '2px',
          shadow: '{focus.ring.shadow}'
        },
        toggleIcon: {
          color: '{text.muted.color}',
          hoverColor: '{text.color}',
          activeColor: '{text.color}',
          activeHoverColor: '{text.color}'
        },
        first: {
          topBorderRadius: '1.25rem',
          borderWidth: '1px'
        },
        last: {
          bottomBorderRadius: '1.25rem',
          activeBottomBorderRadius: '1.25rem'
        }
      },
      content: {
        borderColor: '{content.border.color}',
        background: 'rgba(15, 20, 27, 0.7)',
        color: '{text.color}',
        padding: '0 1rem 1rem 1rem'
      }
    }
  }
});
