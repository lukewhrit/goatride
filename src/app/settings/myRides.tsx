'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ungeocode } from '@/lib/maps';
import { fetchPosts } from '@/lib/posts';

import { useUserContext } from '../layout';
import { FmtContactMethods } from '../posts/page';

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import type { JSX } from 'react';

import type { ContactPlatforms } from '@/generated/prisma/enums';

import type { PostDisplay } from '../posts/page';

const rideColumns: ColumnDef<PostDisplay>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        className="self-center"
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'origin',
    header: 'Origin',
    cell: ({ row }) => <div>{row.getValue('origin')}</div>,
  },
  {
    accessorKey: 'destination',
    header: 'Destination',
    cell: ({ row }) => <div>{row.getValue('destination')}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status')?.toString() ?? '';
      return <Badge className={`badge-${status.toLowerCase()}`}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'seatsAvailable',
    header: 'Seats available',
    cell: ({ row }) => <div>{row.getValue('seatsAvailable')}</div>,
  },
  {
    accessorKey: 'price',
    header: 'Price per seat',
    cell: ({ row }) => <div>${row.getValue('price')}</div>,
  },
  {
    accessorKey: 'contactPlatform',
    header: 'Contact Method Platform',
    cell: ({ row }) => (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      <div>{FmtContactMethods[row.getValue('contactPlatform') as ContactPlatforms]}</div>
    ),
  },

  {
    accessorKey: 'contactMethod',
    header: 'Contact Method',
    cell: ({ row }) => <div>{row.getValue('contactMethod')}</div>,
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => <div>{row.getValue('notes')}</div>,
  },
];

const MyRides = (): JSX.Element => {
  const userCtx = useUserContext();
  const [posts, setPosts] = useState<PostDisplay[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const p = await fetchPosts({
        page: 1,
        pageSize: 12,
        rideStatus: 'ALL',
        ownerId: userCtx?.user.id,
      });

      const enriched = await Promise.all(
        p.items.map(async (post) => {
          try {
            const destination =
              post.destinationLat != null && post.destinationLng != null
                ? await ungeocode(post.destinationLat, post.destinationLng)
                : 'Unknown destination';

            return { ...post, origin: 'Worcester, MA', destination };
          } catch {
            return { ...post, origin: 'Worcester, MA', destination: 'Unknown destination' };
          }
        }),
      );

      if (!cancelled) setPosts(enriched);
    }

    fetchData().catch((e) => console.error(e));

    return () => {
      cancelled = true;
    };
  }, [userCtx?.user.id]);

  // ✅ Columns are stable and outside render; this memo is optional now.
  const columns = useMemo(() => rideColumns, []);

  const table = useReactTable({
    data: posts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <section className="max-w-3xl" id="my-rides">
      <h3 className="text-xl">My Rides</h3>
      <div className="flex items-center py-4">
        <Input
          className="max-w-sm"
          onChange={(event) => table.getColumn('destination')?.setFilterValue(event.target.value)}
          placeholder="Filter by destination..."
          value={(table.getColumn('destination')?.getFilterValue() as string) ?? ''}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ml-auto" variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  className="capitalize"
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        <div className="space-x-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MyRides;
