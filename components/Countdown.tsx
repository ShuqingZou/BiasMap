'use client';
import { useState, useEffect } from 'react';

type Props = {
  targetDate: string;    // "2026-08-01"
  localTime?: string | null; // "20:00"
};

export default function Countdown({ targetDate, localTime }: Props) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    function compute() {
      const timeStr = localTime ?? '20:00';
      const target = new Date(`${targetDate}T${timeStr}`).getTime();
      const diff = target - Date.now();
      if (diff <= 0) { setLabel(''); return; }
      const totalHours = diff / 3_600_000;
      if (totalHours < 48) {
        const h = Math.floor(totalHours);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        setLabel(`${h}h ${m}m`);
      } else {
        setLabel(`${Math.ceil(totalHours / 24)} days`);
      }
    }
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [targetDate, localTime]);

  return label ? <>{label}</> : null;
}
