'use client';

import { useEffect } from 'react';
import { initFromAPI } from '@/core/store/poker-store';

export function StoreInit() {
  useEffect(() => {
    void initFromAPI();
  }, []);
  return null;
}
