import { MARQUEE_BOTTOM, MARQUEE_TOP } from '../data';

const Row = ({ items, reverse = false }: { items: string[]; reverse?: boolean }) => (
  <div className={`nx-marquee-track ${reverse ? 'is-reverse' : ''}`}>
    {[0, 1].map((copy) => (
      <div key={copy} style={{ display: 'flex' }} aria-hidden={copy === 1}>
        {items.map((t) => (
          <span key={t} className="nx-marquee-item">
            {t}
            <span className="nx-marquee-sep">✦</span>
          </span>
        ))}
      </div>
    ))}
  </div>
);

const Marquee = () => (
  <section className="nx-marquee" aria-label="Exams NEXUS helps you prepare for">
    <div className="nx-mono" style={{ textAlign: 'center', color: 'rgba(226,232,245,0.4)', marginBottom: 18 }}>
      Train for the tests that decide your next move
    </div>
    <Row items={MARQUEE_TOP} />
    <Row items={MARQUEE_BOTTOM} reverse />
  </section>
);

export default Marquee;
