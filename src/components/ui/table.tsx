import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

const Table = ({ className = '', ...props }: HTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
  </div>
)

const TableHeader = ({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`[&_tr]:border-b ${className}`} {...props} />
)

const TableBody = ({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
)

const TableRow = ({ className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={`border-b border-foreground/10 transition-colors hover:bg-foreground/5 ${className}`}
    {...props}
  />
)

const TableHead = ({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={`h-10 px-3 text-left align-middle text-xs font-medium text-foreground/60 [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
)

const TableCell = ({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={`px-3 py-3 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
)

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
