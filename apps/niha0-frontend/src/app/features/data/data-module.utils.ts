import { ErpItem } from '../../core/api/api.models';
import { ErpFieldConfig } from '../erp/erp-module.config';
import { parseErpDetails, erpListHint } from '../erp/erp-module.config';

export function downloadTextFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportErpItemsCsv(
  items: ErpItem[],
  module: string,
  fields: ErpFieldConfig[],
): void {
  const fieldKeys = fields.map((f) => f.key);
  const header = ['code', 'title', 'status', ...fieldKeys].join(',');
  const lines = items.map((it) => {
    const details = parseErpDetails(it.detailsJson);
    const cols = [
      it.code,
      it.title,
      it.status ?? '',
      ...fieldKeys.map((k) => details[k] ?? ''),
    ];
    return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
  });
  downloadTextFile(
    [header, ...lines].join('\n'),
    `${module.toLowerCase()}-export-${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8',
  );
}

export function exportErpItemsJson(items: ErpItem[], module: string): void {
  downloadTextFile(
    JSON.stringify(items, null, 2),
    `${module.toLowerCase()}-export-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json',
  );
}

export function erpItemSummary(item: ErpItem, fields: ErpFieldConfig[]): string {
  return erpListHint(item, fields) || item.title;
}
