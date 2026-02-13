import path from 'path';
import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import { getConfig } from './webpack.config';
import type { SanSSRLoaderOptions } from '../../src/types';

export function compiler(
  fixture: string,
  options: Partial<SanSSRLoaderOptions> = {}
): Promise<{
  stats: webpack.Stats | undefined;
  outputContent: string;
}> {
  const config = getConfig(fixture, options);
  const compiler = webpack(config);

  const fileSys = createFsFromVolume(new Volume());
  (compiler as any).outputFileSystem = fileSys;
  (compiler as any).outputFileSystem.join = path.join.bind(path);

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        console.error('Compiler run error:', err);
        reject(err);
        return;
      }

      // 简单检查是否有 style 模块被加载
      const hasStyleModules = stats?.compilation?.modules ? Array.from(stats.compilation.modules).some((module: any) => {
        return module.rawRequest?.includes('type=style') || module.resource?.includes('type=style');
      }) : false;

      console.log('Has style modules:', hasStyleModules);

      // 打印所有模块信息（注释掉以避免超时）
      // console.log('All modules:', JSON.stringify(moduleInfo, null, 2));

      // 检查是否有来自 less-loader 的错误（注释掉以避免超时）
      // const lessLoaderErrors = stats?.compilation?.errors?.filter(error =>
      //   error?.message?.includes('less-loader') ||
      //   error?.message?.includes('Unrecognised input')
      // );

      // if (lessLoaderErrors && lessLoaderErrors.length > 0) {
      //   console.error('Less loader errors:', lessLoaderErrors);
      // }

      // 打印编译详情（注释掉以避免超时）
      // console.log('Compilation details:', stats?.toString({
      //   colors: true,
      //   errors: true,
      //   warnings: true,
      //   modules: true
      // }));

      if (stats?.compilation?.errors && stats.compilation.errors.length > 0) {
        console.error('Compilation errors:', stats.compilation.errors);
        const error = stats.compilation.errors[0];
        reject(new Error(error.message || error.toString()));
        return;
      }

      let outputContent = '';
      try {
        const outputPath = path.join(__dirname, 'output', 'bundle.js');
        outputContent = fileSys.readFileSync(outputPath, 'utf-8') as string;
      } catch (error) {
        console.error('Error reading output file:', error);
      }

      resolve({ stats, outputContent });
    });
  });
}
