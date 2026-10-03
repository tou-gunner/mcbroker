import { useTranslations } from 'next-intl';
import { FaCommentDots, FaListCheck, FaFileShield } from 'react-icons/fa6';
import Section from './ui/Section';
const steps = [{ key: '1', Icon: FaCommentDots }, { key: '2', Icon: FaListCheck }, { key: '3', Icon: FaFileShield }] as const;
export default function HowItWorksSection() {
  const t = useTranslations('how');
  return <Section id="how-it-works" eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} className="how-section">
    <ol className="steps-grid">{steps.map(({ key, Icon }) => <li key={key} className="step-card"><div className="step-top"><span className="step-number">0{key}</span><Icon aria-hidden="true" /></div><h3>{t(`steps.${key}.title`)}</h3><p>{t(`steps.${key}.body`)}</p></li>)}</ol>
  </Section>;
}
