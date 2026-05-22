module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@assets': './src/assets',
          '@components': './src/components',
          '@constants': './src/constants',
          '@data': './src/data',
          '@i18n': './src/i18n',
          '@locales': './src/locales',
          '@navigation': './src/navigation',
          '@runtime': './src/runtime',
          '@screens': './src/screens',
          '@services': './src/services',
          '@styles': './src/styles',
          '@theme': './src/theme',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
