// remotion.config.js
// Configuration for Remotion video rendering

import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Increase memory for complex animations
Config.setChromiumOpenGlRenderer('angle');

export default Config;
