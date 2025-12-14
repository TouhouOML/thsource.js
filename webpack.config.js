const path = require('path');
const toml = require('js-toml');
const { UserscriptPlugin } = require('webpack-userscript');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  module: {
    rules: [
      {
	test: /\.toml$/i,
        type: 'json',
        parser: {
	  parse: toml.load
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'thsource.user.js',
  },
  plugins: [
    new UserscriptPlugin({
      headers: {
        name: 'thsource',
        description: 'Show Touhou original soundtrack information',
        version: '0.0.1',
	author: 'niconiconi',
	'run-at': 'document-start',
	grant: 'GM_notification',
      },
      pretty: true,
      strict: true,
      whitelist: true,
    })
  ],
};
