const packagesToTranspile = [
  '@pega/cosmos-react-core',
  '@pega/cosmos-react-social',
  '@pega/cosmos-react-rte',
  '@pega/cosmos-react-work',
  '@storybook/react',
  'storybook',
  'shortcuts',
  'preact',
];
const packagesToTranspileStr = packagesToTranspile.map((p) => `${p}`).join('|');

module.exports = {
  preset: 'ts-jest',
  verbose: true,
  /* One worker per core OOM-kills workers on a cold transform cache (a fresh
     clone, CI, or the first run after a Node upgrade): every worker type-checks
     TypeScript at once. Half the cores runs cold without kills, and faster. */
  maxWorkers: '50%',
  moduleNameMapper: {
    shortcuts: '<rootDir>/node_modules/shortcuts/dist/index.js',
  },
  collectCoverageFrom: ['src/components/**/*.{ts,tsx,js,jsx}', '!**/*.(test|stories).{ts,tsx,js,jsx}'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ['./setupFiles.ts'],
  setupFilesAfterEnv: ['./setupTests.ts'],
  testPathIgnorePatterns: ['<rootDir>/lib/'],
  transformIgnorePatterns: [`node_modules/(?!(${packagesToTranspileStr}))`],
  testEnvironment: 'jsdom',
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
};
