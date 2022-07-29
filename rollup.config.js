// see https://github.com/rozek/build-configuration-study

import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser'

export default {
  input: './src/_hyperscript.ts',
  output: [
    {
      file:     './dist/_hyperscript.js',
      format:    'iife',
      noConflict:true,
      sourcemap: true,
      plugins: [terser({ format:{ comments:false, safari10:true } })],
    }
  ],
  plugins: [
    typescript(),
  ],
};