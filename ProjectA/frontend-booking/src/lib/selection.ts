/** Quản lý tập ô đã chọn dạng "courtId__slot". */

export function keyOf(courtId: string, slot: number): string {
  return `${courtId}__${slot}`;
}

export function parseKey(key: string): { courtId: string; slot: number } {
  const idx = key.lastIndexOf("__");
  return { courtId: key.slice(0, idx), slot: Number(key.slice(idx + 2)) };
}

export interface SelectedRange {
  courtId: string;
  startSlot: number; // gồm
  endSlot: number; // KHÔNG gồm
}

/** Gom các ô đã chọn thành dải liên tục theo từng sân. */
export function toRanges(selected: Set<string>): SelectedRange[] {
  const byCourt = new Map<string, number[]>();
  for (const key of selected) {
    const { courtId, slot } = parseKey(key);
    (byCourt.get(courtId) ?? byCourt.set(courtId, []).get(courtId)!).push(slot);
  }

  const ranges: SelectedRange[] = [];
  for (const [courtId, slots] of byCourt) {
    slots.sort((a, b) => a - b);
    let start = slots[0];
    let prev = slots[0];
    for (let i = 1; i < slots.length; i++) {
      if (slots[i] === prev + 1) {
        prev = slots[i];
      } else {
        ranges.push({ courtId, startSlot: start, endSlot: prev + 1 });
        start = slots[i];
        prev = slots[i];
      }
    }
    ranges.push({ courtId, startSlot: start, endSlot: prev + 1 });
  }
  return ranges;
}
