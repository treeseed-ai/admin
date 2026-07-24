#!/usr/bin/env node

import { runVerifyDriver } from '@treeseed/sdk/verification';

if (process.env.TREESEED_VERIFY_ENTRYPOINT_CHECK === 'true') {
	process.exit(0);
}

process.exit(runVerifyDriver({ packageRoot: process.cwd() }));
