import { CountUp, Reveal } from './primitives';

const STATS = [
  { value: <CountUp to={3} />, label: 'Core domains: quantitative, logical and verbal', color: '#00F5FF' },
  { value: <CountUp to={10} />, label: 'Integrity layers inside every proctored test', color: '#A970FF' },
  { value: '24/7', label: 'AI tutor on call, even at 2 a.m. before the exam', color: '#FF3DBB' },
  { value: '0', label: 'Installs needed. Everything runs in your browser', color: '#FFB800' },
];

const StatsBand = () => (
  <section style={{ position: 'relative', padding: '40px 0' }} aria-label="NEXUS in numbers">
    <div className="nx-container">
      <div className="nx-stats">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="nx-stat">
            <b style={{ color: s.color, textShadow: `0 0 40px ${s.color}55` }}>{s.value}</b>
            <span className="nx-stat-label">{s.label}</span>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default StatsBand;
