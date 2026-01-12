export type StockViewMode = 'compact' | 'expanded';

export const SLOT_DIMENSIONS = {
  compact: {
    container: 'w-[52px] sm:w-[60px] md:w-[68px]',
    slot: 'w-12 sm:w-14 md:w-16',
    height: 'h-[65px] sm:h-[75px] md:h-[85px]',
    block: 'w-7 sm:w-8 md:w-9 h-1 sm:h-1.5',
    fontSize: {
      slot: 'text-[8px] sm:text-[9px]',
      model: 'text-[5px] sm:text-[6px]',
    },
    modelLines: 1 as const,
  },
  expanded: {
    container: 'w-[68px] sm:w-[80px] md:w-[96px]',
    slot: 'w-16 sm:w-[72px] md:w-[88px]',
    height: 'h-[85px] sm:h-[100px] md:h-[115px]',
    block: 'w-9 sm:w-10 md:w-12 h-1.5 sm:h-2',
    fontSize: {
      slot: 'text-[9px] sm:text-[10px]',
      model: 'text-[7px] sm:text-[8px] md:text-[9px]',
    },
    modelLines: 2 as const,
  },
} as const;
