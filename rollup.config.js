import babel from 'rollup-plugin-babel';

export default {
  input: 'src/api.js',
  plugins: [
    babel({
      babelrc: false,
      presets: [
        [
          '@babel/env',
          {
            modules: false,
            exclude: ['transform-async-to-generator', 'transform-regenerator'],
            targets: {
              browsers: ['ie >= 11'],
            },
          },
        ],
      ],
    }),
  ],
  output: [
    {
      format: 'umd',

      name: 'apiMiddleware',
      file: 'dist/api-middleware.js',
    },
    {
      format: 'es',
      file: 'dist/api-middleware.es.js',
    },
  ],
};