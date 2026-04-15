/**
 * Footer 컴포넌트
 *
 * 레퍼런스: g7.gnuboard.com 공식 데모 footer
 * 상단: 브랜드(좌) + 링크 그룹 컬럼(우)
 * 하단: 저작권(좌) + Powered by(우)
 */

import React from 'react';

import { Div } from '../basic/Div';
import { A } from '../basic/A';
import { P } from '../basic/P';
import { Footer as FooterBasic } from '../basic/Footer';
import { Icon } from '../basic/Icon';

const t = (key: string, params?: Record<string, string | number>) =>
  (window as any).G7Core?.t?.(key, params) ?? key;

const navigate = (path: string) => {
  (window as any).G7Core?.dispatch?.({
    handler: 'navigate',
    params: { path },
  });
};

interface SocialLinks {
  github?: string;
  twitter?: string;
  discord?: string;
  facebook?: string;
  instagram?: string;
}

interface FooterLink {
  label: string;
  href: string;
}

interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  siteName?: string;
  siteDescription?: string;
  copyrightText?: string;
  poweredByText?: string;
  socialLinks?: SocialLinks;
  linkGroups?: FooterLinkGroup[];
  className?: string;
}

const socialIconMap: Record<keyof SocialLinks, string> = {
  github: 'github',
  twitter: 'twitter',
  discord: 'discord',
  facebook: 'facebook',
  instagram: 'instagram',
};

const Footer: React.FC<FooterProps> = ({
  siteName = '그누보드7',
  siteDescription,
  copyrightText,
  poweredByText,
  socialLinks = {},
  linkGroups,
  className = '',
}) => {
  const currentYear = new Date().getFullYear();

  const defaultLinkGroups: FooterLinkGroup[] = [
    {
      title: t('footer.community'),
      links: [
        { label: t('nav.home'), href: '/' },
        { label: t('nav.popular'), href: '/boards/popular' },
        { label: t('footer.all_boards'), href: '/boards' },
      ],
    },
    {
      title: t('footer.info'),
      links: [
        { label: t('footer.about'), href: '/page/about' },
        { label: t('footer.faq'), href: '/page/faq' },
        { label: t('footer.contact'), href: '/page/contact' },
      ],
    },
    {
      title: t('footer.policy'),
      links: [
        { label: t('footer.terms'), href: '/page/terms' },
        { label: t('footer.privacy'), href: '/page/privacy' },
        { label: t('footer.refund'), href: '/page/refund' },
      ],
    },
  ];

  const groups = linkGroups || defaultLinkGroups;

  const activeSocials = Object.entries(socialLinks).filter(
    ([, url]) => !!url
  );

  return (
    <FooterBasic className={`w-full mt-16 bg-base-200 ${className}`}>
      {/* 상단: 브랜드 + 링크 그룹 */}
      <Div className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-8">
        <Div className="flex flex-col md:flex-row justify-between gap-10">
          {/* 좌: 브랜드 */}
          <Div className="shrink-0">
            <Div className="text-xl font-bold tracking-tight text-base-content">
              {siteName}
            </Div>
            {siteDescription && (
              <P className="mt-2 text-sm text-base-content/50 max-w-xs">
                {siteDescription}
              </P>
            )}
            {/* 소셜 아이콘 */}
            {activeSocials.length > 0 && (
              <Div className="flex gap-4 mt-5">
                {activeSocials.map(([type, url]) => (
                  <A
                    key={type}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base-content/40 hover:text-primary transition-colors duration-200"
                    aria-label={type}
                  >
                    <Icon
                      name={socialIconMap[type as keyof SocialLinks]}
                      className="w-5 h-5"
                    />
                  </A>
                ))}
              </Div>
            )}
          </Div>

          {/* 우: 링크 그룹 컬럼 */}
          <Div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
            {groups.map((group, gi) => (
              <Div key={gi} className="flex flex-col gap-3">
                <Div className="text-sm font-semibold text-base-content">
                  {group.title}
                </Div>
                {group.links.map((link, li) => (
                  <A
                    key={li}
                    className="text-sm text-base-content/50 hover:text-base-content transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate(link.href)}
                  >
                    {link.label}
                  </A>
                ))}
              </Div>
            ))}
          </Div>
        </Div>
      </Div>

      {/* 하단: 저작권 + Powered by */}
      <Div className="w-full border-t border-base-300">
        <Div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <P className="text-xs text-base-content/40">
            {copyrightText ||
              `© ${currentYear} ${siteName}. All rights reserved.`}
          </P>
          <P className="text-xs text-base-content/40">
            {poweredByText || t('footer.powered_by')}
          </P>
        </Div>
      </Div>
    </FooterBasic>
  );
};

export default Footer;
