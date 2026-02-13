import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'san-ssr-loader',
      fileName: 'index',
      formats: ['cjs']
    },
    sourcemap: false,
    rollupOptions: {
      external: ['webpack', 'less', 'postcss', 'postcss-modules', '@ts-morph/common', 'ts-morph', 'san-ssr', 'fs', 'path', 'typescript'],
      output: {
        preserveModules: true,
        exports: 'named',
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        globals: {
          webpack: 'webpack',
          less: 'less',
          postcss: 'postcss',
          'postcss-modules': 'postcssModules',
          '@ts-morph/common': 'tsMorphCommon',
          'ts-morph': 'tsMorph',
          'san-ssr': 'sanSsr',
          fs: 'fs',
          path: 'path'
        }
      }
    }
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: []
})
