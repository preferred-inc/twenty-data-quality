import { defineApplication } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

/**
 * Marketplace metadata comes from here. `aboutDescription` is deliberately
 * omitted so the listing's About tab uses the package README from npm, which
 * stays in step with the repository instead of drifting from it.
 */
export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  author: 'Preferred Inc.',
  category: 'Data',
  logo: 'public/logo.svg',
  galleryImages: ['public/overview.jpg', 'public/per-field.jpg'],
  websiteUrl: 'https://pref.co.jp',
  issueReportUrl: 'https://github.com/preferred-inc/twenty-data-quality/issues',
});
