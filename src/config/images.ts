/**
 * Central image registry for the Knotify app.
 *
 * All screens and components import images from this registry — never via a
 * raw `require('...png')` path. Swapping an asset is a one-line change here.
 *
 * @see architecture.md §5.2
 */
export const images = {
  onboarding: {
    /** Full-screen background used across most onboarding pages. */
    background: require('@/assets/images/onboarding/backgr.png'),
    /** Knotify banner displayed on welcome/checkpoint pages. */
    banner: require('@/assets/images/onboarding/banner.png'),
    /** Knotify logo shown on the welcome page. */
    logo: require('@/assets/images/onboarding/Logo.png'),
    /** Male gender tile image shown on the sex-selection page. */
    genderMale: require('@/assets/images/onboarding/male.png'),
    /** Female gender tile image shown on the sex-selection page. */
    genderFemale: require('@/assets/images/onboarding/female.png'),
  },
} as const;

/** Union of all keys in the onboarding image group. Extend per group as new groups are added. */
export type ImageKey = keyof typeof images.onboarding;
