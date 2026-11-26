import { Config } from '@remotion/cli/config';

// Used by `npm run studio` and `npm run render`.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
