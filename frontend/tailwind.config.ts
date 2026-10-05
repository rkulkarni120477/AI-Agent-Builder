import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        sidebar: 'var(--sidebar)',
        surface: 'var(--surface)',
        panel: 'var(--panel)',
        chip: 'var(--chip)',
        text: {
          DEFAULT: 'var(--text)',
          '2': 'var(--text-2)',
          '3': 'var(--text-3)',
          '4': 'var(--text-4)',
        },
        muted: 'var(--muted)',
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        divider: 'var(--divider)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
        },
        required: 'var(--required)',
        success: 'var(--success, #10b981)',
        'success-light': 'var(--success-light, #d1fae5)',
        warning: 'var(--warning, #f59e0b)',
        'warning-light': 'var(--warning-light, #fef3c7)',
        error: 'var(--error, #ef4444)',
        'error-light': 'var(--error-light, #fee2e2)',
        secondary: 'var(--secondary, #6b7280)',
        'secondary-light': 'var(--secondary-light, #f3f4f6)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        mono: ['Consolas', 'Menlo', 'monospace'],
      },
      fontWeight: {
        500: '500',
      },
      borderRadius: {
        input: '8px',
        badge: '6px',
        icon: '8px',
        button: '10px',
        checkbox: '6px',
        'icon-tile': '8px',
        'option-card': '12px',
        'model-card': '14px',
        pill: '999px',
      },
      boxShadow: {
        menu: '0 8px 24px rgba(31, 29, 24, 0.16)',
        dialog: '0 10px 28px rgba(31, 29, 24, 0.18)',
      },
      spacing: {
        'sidebar-w': '232px',
        'panel-min': '340px',
        'panel-max': '440px',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
      },
    },
  },
  plugins: [],
}

export default config
