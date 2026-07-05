import React from 'react';

interface Column<T> {
 key: string;
 header: string;
 render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
 columns: Column<T>[];
 data: T[];
 onRowClick?: (row: T) => void;
 emptyMessage?: string;
}

export function Table<T extends { id?: string }>({ 
 columns, 
 data, 
 onRowClick,
 emptyMessage = "No hay datos para mostrar"
}: TableProps<T>) {
 return (
 <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-soft border border-white/20 overflow-hidden">
 <div className="overflow-x-auto custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-white/40 bg-neutral-light/30 ">
 {columns.map((col) => (
 <th 
 key={col.key} 
 className="px-6 py-4 font-headline text-xs font-semibold text-tertiary uppercase tracking-wider"
 >
 {col.header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-white/40 ">
 {data.length === 0 ? (
 <tr>
 <td colSpan={columns.length} className="px-6 py-12 text-center text-tertiary font-body">
 {emptyMessage}
 </td>
 </tr>
 ) : (
 data.map((row, index) => (
 <tr 
 key={row.id || index}
 onClick={() => onRowClick?.(row)}
 className={`group transition-colors duration-200 ${
 onRowClick ? 'cursor-pointer hover:bg-white/60 ' : 'hover:bg-white/40 '
 }`}
 >
 {columns.map((col) => (
 <td 
 key={col.key} 
 className="px-6 py-4 font-body text-sm text-secondary whitespace-nowrap"
 >
 {col.render ? col.render(row) : (row as any)[col.key]}
 </td>
 ))}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
}
