'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronLeft, Flag, Mountain, Plane, Bike, SlidersHorizontal } from 'lucide-react';

const disciplines = [
  { slug: 'rc-cars', label: 'On-road', details: 'Cars & drift builds', icon: Flag },
  { slug: 'rc-trucks-buggies', label: 'Off-road', details: 'Trucks & buggies', icon: Mountain },
  { slug: 'rc-planes-drones', label: 'Flight', details: 'Planes & drones', icon: Plane },
  { slug: 'rc-motorcycles', label: 'Two wheels', details: 'RC motorcycles', icon: Bike },
];

export function GarageFinder({ available }: { available: string[] }) {
  const [selected, setSelected] = useState('');
  const options = disciplines.filter(option => available.includes(option.slug));
  const current = options.find(option => option.slug === selected);
  if (!options.length) return null;

  return (
    <section id="ride-finder" className="garage-finder" aria-label="Ride finder">
      <div className="garage-finder-top"><span><SlidersHorizontal size={15} /> Ride finder</span><small>0{current ? 2 : 1} / 02</small></div>
      <div className="garage-progress" aria-hidden="true"><i /><i className={current ? 'active' : ''} /></div>
      <div aria-live="polite" key={selected} className="garage-step">
        <h2>{current ? 'Set your budget.' : 'Where will you drive?'}</h2>
        <p>{current ? current.details + ' · Choose a price range to see matching models.' : 'Choose a discipline to find your first ride.'}</p>
        <div className="garage-options">
          {current ? [1500, 3000, 5000, null].map(price => (
            <Link key={price ?? 'all'} href={'/products?category=' + current.slug + (price ? '&maxPrice=' + price : '')}>
              <strong>{price ? 'Up to ₹' + price.toLocaleString('en-IN') : 'Any budget'}</strong><ArrowRight size={17} />
            </Link>
          )) : options.map(({ slug, label, details, icon: Icon }) => (
            <button type="button" key={slug} onClick={() => setSelected(slug)}>
              <Icon size={22} strokeWidth={1.5} /><span><strong>{label}</strong><small>{details}</small></span><ArrowRight size={16} />
            </button>
          ))}
        </div>
        {current && <button type="button" className="garage-back" onClick={() => setSelected('')}><ChevronLeft size={15} /> Change discipline</button>}
      </div>
    </section>
  );
}
