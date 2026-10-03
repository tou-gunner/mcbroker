// Preview-only route; no synthetic records are written to the database.
import { cookies } from 'next/headers';
import InsuranceDetail from '@/app/(public)/[locale]/insurance/[id]/InsuranceDetail';
import { formatInsuranceDetail } from '@/app/services/insurance-detail';
import { insuranceRecord } from '@/tests/fixtures/insurance-data';

export default async function InsuranceFixture({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ scenario?: string }> }) {
  const { locale } = await params;
  const { scenario } = await searchParams;
  if (scenario === 'error' && (await cookies()).get('insurance-fixture-ready')?.value !== 'yes') throw new Error('Intentional preview failure');
  if (scenario === 'loading') await new Promise(resolve => setTimeout(resolve, 2500));
  const record = insuranceRecord();
  if (scenario === 'missing') { record.metadata = []; record.category.metadata = []; record.company.metadata = []; record.content = []; }
  if (scenario === 'unpublished') record.content[0].isPublished = false;
  if (scenario === 'text') { record.content[0].contentHtml = '<p><br></p>'; record.content[0].contentText = 'First paragraph.\n\nSecond paragraph.'; }
  if (scenario === 'rich' || scenario === 'long') {
    record.content[0].contentHtml = `<h1 id="contact" style="color:white;font-size:1px">Cover at a glance</h1>
      <p>Before the table. <a href="#contact">Jump to article heading</a></p>
      <ol start="3"><li>First benefit<ul><li>Nested benefit</li></ul></li><li>Second benefit</li></ol>
      <table style="width:1200px"><caption>Coverage comparison</caption><thead><tr><th rowspan="2" scope="col">Benefits</th><th colspan="7" scope="colgroup">Available options</th></tr><tr>${Array.from({ length: 7 }, (_, i) => `<th scope="col">Option ${i + 1}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">Hospital care</th>${'<td>Discuss with your advisor</td>'.repeat(7)}</tr></tbody></table>
      <p>After the table.</p><figure><img src="https://example.test/good-article.png" alt="Coverage diagram" width="800" height="400"><figcaption>Original image caption</figcaption></figure>
      <p><img src="https://example.test/broken-article.png" alt="Plan illustration"></p>
      <h2>Conditions and documents</h2><p><a href="https://example.test/terms.pdf" target="_blank">Read the policy document</a></p>
      <script>window.articleUnsafe = true</script><iframe src="https://example.test/unsafe"></iframe><img src="javascript:alert(1)" onerror="window.articleUnsafe=true"><p onclick="window.articleUnsafe=true">Safe visible text</p>
      ${'<h3>Details to discuss</h3><p>Talk about the cover, conditions, and exclusions with your advisor. Keep a copy of the policy documents and review the details before choosing a plan.</p>'.repeat(6)}`;
  }
  if (scenario === 'long') {
    record.metadata[0].value = locale === 'lo' ? 'ແຜນປະກັນໄພສຳລັບຄອບຄົວແລະການຄຸ້ມຄອງທຸລະກິດຂອງທ່ານ'.repeat(3) : 'InsuranceForEveryStageOfYourFamilyAndBusinessLife'.repeat(3);
    record.content[0].contentHtml += `<p>${'VeryLongDocumentReference'.repeat(20)}</p>`;
  }
  return <InsuranceDetail insurance={formatInsuranceDetail(record, locale)!} />;
}
