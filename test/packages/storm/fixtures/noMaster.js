/* eslint import/extensions: 0 */

import { storm } from '@rayo/storm/index.js';

storm(
  () => {
    process.stdout.write('Worker!');
    process.exit();
  },
  {
    keepAlive: false,
    monitor: false,
    workers: parseInt(process.argv[2], 10)
  }
);
