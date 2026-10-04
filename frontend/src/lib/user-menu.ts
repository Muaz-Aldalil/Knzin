/**
 * Normal-user account menu model, shared by the desktop avatar menu and the mobile sheet.
 *
 * Every href points at a route that already exists in the app:
 *  - /dashboard  -> Learning Hub
 *  - /affiliate  -> Affiliate Portal (the referral link card lives on this page)
 *  - /raffle     -> promotional raffle transparency
 * "Referral" deep-links to the existing referral card via a hash anchor, not a new route.
 */
export type UserMenuItemId = 'learning-hub' | 'referral' | 'transparency' | 'affiliate';

export interface UserMenuItem {
  id: UserMenuItemId;
  href: string;
  labelAr: string;
  labelEn: string;
}

export const USER_MENU_ITEMS: UserMenuItem[] = [
  { id: 'learning-hub', href: '/dashboard', labelAr: 'لوحة تدريبي ودوراتي', labelEn: 'My Learning Hub' },
  { id: 'referral', href: '/affiliate#referral', labelAr: 'رابط الإحالة', labelEn: 'Referral' },
  { id: 'transparency', href: '/raffle', labelAr: 'الشفافية', labelEn: 'Transparency' },
  { id: 'affiliate', href: '/affiliate', labelAr: 'بوابة الشركاء والمسوّقين', labelEn: 'Affiliate Portal' },
];
