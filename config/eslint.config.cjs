const eslint = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  // Base ESLint recommended configuration
  eslint.configs.recommended,
  
  // Prettier configuration
  prettier,
  
  // Custom configuration
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
        es2022: true,
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly'
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }],
      'arrow-spacing': ['error', { before: true, after: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'eol-last': ['error', 'always'],
      'no-trailing-spaces': 'error',
      'prettier/prettier': 'error'
    }
  },
  
  // Override for all JavaScript files
  {
    files: ['**/*.js'],
    rules: {
      'strict': ['error', 'global']
    }
  },
  
  // Override for client files
  {
    files: ['client/**/*.js'],
    languageOptions: {
      globals: {
        browser: true
      }
    },
    rules: {
      'no-console': 'warn'
    }
  },
  
  // Override for API files
  {
    files: ['api/**/*.js'],
    languageOptions: {
      globals: {
        node: true
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];