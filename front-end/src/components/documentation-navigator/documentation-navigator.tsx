import { Link, useLocation } from '@tanstack/react-router';

const DOCUMENTATION_NAVIGATOR_LIST = [
  { label: 'FAQ', link: '/faq' },
  { label: 'TOS', link: '/tos' },
  { label: 'Fairness', link: '/fairness' },
];

export const DocumentationNavigator = () => {
  const location = useLocation();

  return (
    <div className="flex w-fit gap-6 border-b border-[#152947] text-base font-extrabold text-[#6E88AF]">
      {DOCUMENTATION_NAVIGATOR_LIST.map((navigatorItem) => (
        <Link
          to={navigatorItem.link}
          className={`cursor-pointer border-b pb-3 ${navigatorItem.link === location.pathname ? 'border-[#60A4FD] text-white' : 'border-transparent'}`}
          key={`navigator-item-${navigatorItem.label}`}
        >
          {navigatorItem.label}
        </Link>
      ))}
    </div>
  );
};
