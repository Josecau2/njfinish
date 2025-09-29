import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y'
import globals from 'globals'

export default [
  {
    ignores: [
      'eslint.config.mjs',
      'src/pages/customers/Customers_broken.jsx',
      'src/i18n/locales/*.backup.json',
    ],
  },
  {
    ...eslintPluginReact.configs.flat.recommended,
    ...eslintPluginReact.configs.flat['jsx-runtime'],
    ...eslintPluginJsxA11y.flatConfigs.recommended,
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      'jsx-a11y': eslintPluginJsxA11y,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginJsxA11y.flatConfigs.recommended.rules,
      // Stricter A11y rules for production
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',

      // Ground Rules enforcement (Section 2 of playbook)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@coreui/*'],
              message: 'Use Chakra UI components instead of CoreUI'
            },
            {
              group: ['react-icons/*', '@fortawesome/*', 'font-awesome/*'],
              message: 'Use lucide-react icons only'
            },
            {
              group: ['formik', 'yup'],
              message: 'Use React Hook Form instead of Formik'
            },
            {
              group: ['react-select/*'],
              message: 'Use Chakra Select or custom combobox instead'
            },
            {
              group: ['sweetalert2', 'react-toastify'],
              message: 'Use Chakra useToast instead'
            },
            {
              group: ['framer-motion'],
              message: 'Import framer-motion is allowed but ensure proper reduced-motion handling'
            }
          ]
        }
      ],
      // Enforce i18next for strings
      'react/jsx-no-literals': [
        'warn',
        {
          noStrings: true,
          allowedStrings: ['', ' ', '&nbsp;', '...', '-', '|', '/', '+', '*', '='],
          ignoreProps: false,
          noAttributeStrings: true
        }
      ]
    },
  },
  eslintPluginPrettierRecommended,
]
