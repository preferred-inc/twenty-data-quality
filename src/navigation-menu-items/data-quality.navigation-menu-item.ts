import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import {
  DATA_QUALITY_DISPLAY_NAME,
  DATA_QUALITY_LAYOUT_UNIVERSAL_IDENTIFIER,
  DATA_QUALITY_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: DATA_QUALITY_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: DATA_QUALITY_DISPLAY_NAME,
  icon: 'IconChecklist',
  position: -0.4,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: DATA_QUALITY_LAYOUT_UNIVERSAL_IDENTIFIER,
});
