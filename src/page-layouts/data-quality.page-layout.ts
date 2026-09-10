import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  DATA_QUALITY_DISPLAY_NAME,
  DATA_QUALITY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  DATA_QUALITY_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  DATA_QUALITY_LAYOUT_UNIVERSAL_IDENTIFIER,
  DATA_QUALITY_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: DATA_QUALITY_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: DATA_QUALITY_DISPLAY_NAME,
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: DATA_QUALITY_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Overview',
      position: 0,
      icon: 'IconChecklist',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: DATA_QUALITY_WIDGET_UNIVERSAL_IDENTIFIER,
          title: ' ',
          type: 'FRONT_COMPONENT',
          position: { layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST, index: 0 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: DATA_QUALITY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
