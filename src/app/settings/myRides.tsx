'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
// eslint-disable-next-line import-x/no-namespace
import * as z from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ContactPlatforms } from '@/generated/prisma/enums';
import { ungeocode } from '@/lib/maps';
import { deletePost, fetchPosts, updatePost } from '@/lib/posts';

import { useUserContext } from '../layout';
import { FmtContactMethods } from '../posts/page';

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import type { JSX } from 'react';

import type { ContactPlatforms as ContactPlatformsType } from '@/generated/prisma/enums';

import type { PostDisplay } from '../posts/page';

const editSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  seatsAvailable: z.coerce.number().min(1).max(8),
  seatPrice: z.coerce.number().min(0),
  contactMethod: z.string().min(1),
  contactMethodType: z.enum(ContactPlatforms),
  comments: z.string(),
});

const EditRideDialog = ({
  post,
  userId,
  onSuccess,
}: {
  post: PostDisplay;
  userId: string;
  onSuccess: () => void;
}): JSX.Element => {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      origin: post.origin,
      destination: post.destination,
      departureDate: format(new Date(post.departureTime), 'yyyy-MM-dd'),
      seatsAvailable: String(post.seatsAvailable),
      seatPrice: post.price,
      contactMethod: post.contactMethod,
      contactMethodType: post.contactPlatform,
      comments: post.notes,
    },
  });

  const onSubmit = async (data: z.infer<typeof editSchema>) => {
    try {
      await updatePost(post.id, userId, {
        origin: data.origin,
        destination: data.destination,
        departureDate: data.departureDate,
        seatsAvailable: data.seatsAvailable,
        seatPrice: data.seatPrice,
        contactMethod: data.contactMethod,
        contactMethodType: data.contactMethodType,
        comments: data.comments,
      });
      toast.success('Ride updated');
      setOpen(false);
      onSuccess();
    } catch {
      toast.error('Failed to update ride');
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </DialogTrigger>
      <form id={`edit-ride-${post.id}`} onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit ride</DialogTitle>
            <DialogDescription>Update the details of your ride posting.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid gap-3">
            <Controller
              control={form.control}
              name="origin"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={`origin-${post.id}`}>Origin</FieldLabel>
                  <Input {...field} id={`origin-${post.id}`} type="text" />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="destination"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={`dest-${post.id}`}>Destination</FieldLabel>
                  <Input {...field} id={`dest-${post.id}`} type="text" />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="departureDate"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Departing at</FieldLabel>
                  <Input {...field} type="date" />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <FieldGroup className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="seatsAvailable"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Seats available</FieldLabel>
                    <Input
                      {...field}
                      max={8}
                      min={1}
                      type="number"
                      value={String(field.value ?? '')}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="seatPrice"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Price per seat</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                        max={9999.99}
                        min={0}
                        placeholder="0.00"
                        type="number"
                        value={String(field.value ?? '')}
                      />
                    </InputGroup>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Contact method</FieldLabel>
              <div className="grid grid-cols-6 gap-3">
                <Controller
                  control={form.control}
                  name="contactMethod"
                  render={({ field, fieldState }) => (
                    <Field className="col-span-4">
                      <Input {...field} />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="contactMethodType"
                  render={({ field, fieldState }) => (
                    <Field className="col-span-2">
                      <Select defaultValue={field.value} onValueChange={field.onChange} {...field}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value={ContactPlatforms.EMAIL}>Email</SelectItem>
                          <SelectItem value={ContactPlatforms.INSTAGRAM}>Instagram</SelectItem>
                          <SelectItem value={ContactPlatforms.SMS}>SMS</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
            <Controller
              control={form.control}
              name="comments"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Comments (optional)</FieldLabel>
                  <Textarea {...field} />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={form.formState.isSubmitting}
              form={`edit-ride-${post.id}`}
              type="submit"
            >
              {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

const DeleteRideDialog = ({
  postId,
  userId,
  onSuccess,
}: {
  postId: string;
  userId: string;
  onSuccess: () => void;
}): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deletePost(postId, userId);
      toast.success('Ride deleted');
      setOpen(false);
      onSuccess();
    } catch {
      toast.error('Failed to delete ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete ride</DialogTitle>
          <DialogDescription>
            This will permanently remove your ride posting. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={loading} onClick={handleDelete} variant="destructive">
            {loading ? 'Deleting…' : 'Delete ride'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MyRides = (): JSX.Element => {
  const userCtx = useUserContext();
  const [posts, setPosts] = useState<PostDisplay[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const fetchData = useCallback(async () => {
    if (!userCtx?.user.id) return;

    const p = await fetchPosts({
      page: 1,
      pageSize: 50,
      rideStatus: 'ALL',
      ownerId: userCtx.user.id,
    });

    const enriched = await Promise.all(
      p.items.map(async (post) => {
        try {
          const [origin, destination] = await Promise.all([
            post.originLat != null && post.originLng != null
              ? ungeocode(post.originLat, post.originLng)
              : Promise.resolve('Unknown'),
            post.destinationLat != null && post.destinationLng != null
              ? ungeocode(post.destinationLat, post.destinationLng)
              : Promise.resolve('Unknown'),
          ]);
          return { ...post, origin, destination };
        } catch {
          return { ...post, origin: 'Unknown', destination: 'Unknown' };
        }
      }),
    );

    setPosts(enriched);
  }, [userCtx?.user.id]);

  useEffect(() => {
    let cancelled = false;

    fetchData().catch((e) => {
      if (!cancelled) console.error(e);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const columns = useMemo<ColumnDef<PostDisplay>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
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
        header: 'Seats',
        cell: ({ row }) => <div>{row.getValue('seatsAvailable')}</div>,
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => <div>${row.getValue('price')}</div>,
      },
      {
        accessorKey: 'contactPlatform',
        header: 'Platform',
        cell: ({ row }) => <div>{FmtContactMethods[row.getValue('contactPlatform')]}</div>,
      },
      {
        accessorKey: 'contactMethod',
        header: 'Contact',
        cell: ({ row }) => <div>{row.getValue('contactMethod')}</div>,
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => <div className="max-w-32 truncate">{row.getValue('notes')}</div>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <EditRideDialog
              onSuccess={fetchData}
              post={row.original}
              userId={userCtx?.user.id ?? ''}
            />
            <DeleteRideDialog
              onSuccess={fetchData}
              postId={row.original.id}
              userId={userCtx?.user.id ?? ''}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [userCtx?.user.id, fetchData],
  );

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
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  return (
    <section className="max-w-5xl" id="my-rides">
      <h3 className="text-xl mb-4">My Rides</h3>
      <div className="flex items-center py-4">
        <Input
          className="max-w-sm"
          onChange={(event) => table.getColumn('destination')?.setFilterValue(event.target.value)}
          placeholder="Filter by destination…"
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
                  No rides found.
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
