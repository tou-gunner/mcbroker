import { FaShieldHeart, FaHeartPulse, FaUserShield, FaPlane, FaHouse, FaCarSide, FaBriefcase } from 'react-icons/fa6';
import type { CategorySlug } from '@/app/utils/catalog';
const icons = { life: FaShieldHeart, health: FaHeartPulse, accident: FaUserShield, travel: FaPlane, home: FaHouse, car: FaCarSide, business: FaBriefcase };
export default function CategoryIcon({ category }: { category: CategorySlug }) {
  const Icon = icons[category];
  return <Icon aria-hidden="true" />;
}
