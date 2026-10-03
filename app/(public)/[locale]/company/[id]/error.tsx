"use client";

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { FaRotateRight } from 'react-icons/fa6';
import Button from '../../components/ui/Button';

export default function CompanyError({ reset }: { reset: () => void }) {
  const t = useTranslations('company');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="company-page site-container company-unavailable"><div className="catalog-state" role="alert" aria-busy={pending}>
    <FaRotateRight aria-hidden="true" /><h1>{t('errorTitle')}</h1><p>{t('errorBody')}</p>
    <div className="catalog-state-actions"><Button disabled={pending} onClick={() => startTransition(() => { router.refresh(); reset(); })}>{t(pending ? 'loadingCompany' : 'retry')}</Button><Button href="/#company-list" variant="secondary">{t('backToDirectory')}</Button></div>
  </div></div>;
}
