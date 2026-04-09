const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Enhanced webpack optimization for charting library
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 500000, // 500KB max chunk size for better loading
          cacheGroups: {
            // Separate charting library into its own chunk
            chartingLibrary: {
              test: /[\\/]charting_library[\\/]/,
              name: 'charting-library',
              chunks: 'async', // Only load when needed
              priority: 30,
              enforce: true,
              maxSize: 2000000, // 2MB max for charting library
            },
            // Chart page in separate chunk
            chartPage: {
              test: /[\\/]src[\\/]pages[\\/]chart[\\/]/,
              name: 'chart-page',
              chunks: 'async',
              priority: 25,
              enforce: true,
            },
            // Chart hooks in separate chunk
            chartHooks: {
              test: /[\\/]src[\\/]hooks[\\/].*chart.*/,
              name: 'chart-hooks',
              chunks: 'async',
              priority: 24,
              enforce: true,
            },
            // MUI components
            mui: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: 'mui',
              chunks: 'all',
              priority: 20,
            },
            // React icons
            icons: {
              test: /[\\/]node_modules[\\/]react-icons[\\/]/,
              name: 'icons',
              chunks: 'all',
              priority: 15,
              minSize: 0,
              maxSize: 244000, // ~240KB limit for icons
            },
            // Other vendors
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
        // Enable module concatenation for better tree shaking
        concatenateModules: true,
        // Enable side effects optimization
        sideEffects: false,
      };

      // Add resolve alias for better module resolution
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@charting': path.resolve(__dirname, 'src/library/charting_library'),
        '@chart': path.resolve(__dirname, 'src/components/chart'),
        '@chartHooks': path.resolve(__dirname, 'src/hooks'),
      };

      // Add module rules for better optimization
      webpackConfig.module.rules.push({
        test: /\.js$/,
        include: /charting_library/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-syntax-dynamic-import'
            ]
          }
        }
      });

      return webpackConfig;
    },
  },
  babel: {
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-transform-runtime'
    ],
  },
}; 