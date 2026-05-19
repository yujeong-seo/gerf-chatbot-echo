/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stone: {
          50:  '#F7F7F7',
          100: '#F5F5F5',
          150: '#F4F4F4',
          200: '#F0F0F0',
          300: '#D9D9D9',
          500: '#8F8F8F',
          700: '#42474A',
          800: '#3A3A3A',
          850: '#2E3133',
          900: '#272727',
        },
        primary: {
          300: '#6FA59C',
          500: '#3F8579',
          700: '#2E665E',
        },
        'slate-a':         '#5E7E9C',
        'slate-inactive':  '#B6BFCB',
        'hay-a':           '#B89A5A',
        'hay-inactive':    '#DAC99B',
        'orange-a':        '#C07B58',
        'orange-inactive': '#E0BEAC',
        'green-a':         '#299571',
        'green-inactive':  '#B7DCC9',
      },
      fontFamily: {
        main:   ['Pretendard', 'Pretendard Variable', '-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
        accent: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        main:   '-0.02em',
        accent: '-0.03em',
        label:  '0.12em',
      },
      lineHeight: {
        welcome: '1.2',
      },
      borderRadius: {
        app: '24px',
      },
      boxShadow: {
        'tab-active':   '0 0 10px rgba(0,0,0,0.25)',
        'card-light':   '0 0 10px rgba(0,0,0,0.04)',
        'chip-round':   '0 0 6px rgba(0,0,0,0.10)',
        'btn-light':    '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 1.5px rgba(34,36,34,0.05), 0 2px 4px rgba(34,36,34,0.04)',
        'btn-mid':      '0 1px 0 rgba(255,255,255,0.10) inset, 0 1px 1.5px rgba(20,22,20,0.14), 0 2px 6px rgba(20,22,20,0.12)',
        'btn-dark':     '0 1px 0 rgba(255,255,255,0.06) inset, 0 1px 1.5px rgba(0,0,0,0.22), 0 4px 10px rgba(0,0,0,0.18)',
        'btn-primary':  '0 1px 0 rgba(255,255,255,0.12) inset, 0 1px 1.5px rgba(20,22,20,0.14), 0 2px 6px rgba(20,22,20,0.12)',
        'input':        '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(20,22,20,0.05), 0 6px 16px rgba(20,22,20,0.06)',
        'card':         '0 2px 12px rgba(34,36,34,0.08), 0 1px 2px rgba(34,36,34,0.04)',
        'sheet':        '0 -4px 32px rgba(34,36,34,0.14)',
      },
      backgroundImage: {
        'entry-grad':       'linear-gradient(160deg, #6BB8B0 0%, #4E8C84 30%, #2E6860 65%, #1B4A44 100%)',
        'primary-grad':     'linear-gradient(135deg, #5FA199 0%, #4E8C84 45%, #2E6860 100%)',
        'btn-stone-50':     'linear-gradient(180deg, #FAFBFA 0%, #F2F3F1 100%)',
        'btn-stone-900':    'linear-gradient(180deg, #2F3231 0%, #242726 100%)',
        'btn-primary':      'linear-gradient(180deg, #589A92 0%, #3F7A72 100%)',
        'tab-container':    'linear-gradient(180deg, #F4F4F4 0%, #F0F0F0 100%)',
        'tab-active':       'linear-gradient(180deg, #3A3A3A 0%, #272727 100%)',
        'card-mid':         'linear-gradient(180deg, #F5F5F5 0%, #F0F0F0 100%)',
        'card-dark':        'linear-gradient(180deg, #42474A 0%, #2E3133 100%)',
        'canvas':           'linear-gradient(180deg, #FFFFFF 0%, #F7F7F7 100%)',
      },
      animation: {
        'slide-up': 'slideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in':   'popIn 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':  'fadeIn 0.2s ease',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        popIn: {
          '0%':   { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      maxWidth: {
        app: '600px',
      },
    },
  },
  plugins: [],
}
