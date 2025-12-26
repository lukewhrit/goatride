'use client';

import {
  Car,
  Gift,
  Headphones,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

import { useUserContext } from './layout';

import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, JSX } from 'react';

interface Incentive {
  title: string;
  icon: LucideIcon;
  text: string;
  id: string;
}

const incentives: Incentive[] = [
  {
    id: '1',
    title: 'Ride with friends',
    text: 'Find and share rides with people from your school and community.',
    icon: Headphones,
  },
  {
    id: '2',
    title: 'Save time & money',
    text: 'Split gas, reduce planning friction, and avoid last-minute scrambling.',
    icon: RefreshCw,
  },
  {
    id: '3',
    title: 'One post, huge reach',
    text: 'Create a ride post and let others join—no endless group chat threads.',
    icon: Gift,
  },
  {
    id: '4',
    title: 'Built for real life',
    text: 'Perfect for campus trips, weekends away, concerts, and everyday plans.',
    icon: ShieldCheck,
  },
];

const features: Incentive[] = [
  {
    id: '1',
    title: 'Post a ride',
    text: 'Add your destination, time, and seats available.',
    icon: MapPin,
  },
  {
    id: '2',
    title: 'Join a ride',
    text: 'Browse rides from people on your campus.',
    icon: Users,
  },
  {
    id: '3',
    title: 'Coordinate easily',
    text: 'Details stay in one place, no group-chat chaos.',
    icon: MessageSquare,
  },
  {
    id: '4',
    title: 'Go together',
    text: 'Split costs, save time, and travel smarter.',
    icon: Car,
  },
];

const ButtonGroup = (props: ComponentProps<'div'>): JSX.Element => {
  const user = useUserContext();

  if (user) {
    return (
      <div {...props}>
        <Button asChild size="lg" variant="default">
          <Link href="/posts">View Posts</Link>
        </Button>
      </div>
    );
  }
  return (
    <div {...props}>
      <Button asChild size="lg" variant="default">
        <Link href="/sign-up">Create an account</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
};

const Home = (): JSX.Element => (
  <main className="my-5 xl:px-20 flex flex-col gap-10 justify-center items-center">
    <section className="container xl:px-15 py-30">
      <div className="text-center">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <h1 className="text-3xl font-semibold lg:text-6xl">Need a ride?</h1>
          <p className="text-balance text-muted-foreground lg:text-lg">
            GoatRide helps you find, share, and join rides with people you already trust—so getting
            there is easier, cheaper, and more social.
          </p>
        </div>
        <ButtonGroup className="mt-5 flex gap-3 justify-center" />
      </div>
    </section>
    <section className="w-full xl:px-15">
      <Carousel
        opts={{
          breakpoints: {
            '(min-width: 768px)': {
              active: false,
            },
          },
          align: 'start',
        }}
      >
        <CarouselContent className="md:ml-0 md:grid md:grid-cols-[repeat(2,_minmax(12.5rem,_18.75rem))] md:justify-center md:gap-3 xl:grid-cols-[repeat(4,_minmax(12.5rem,_18.75rem))]">
          {incentives.map(({ title, icon: Icon, text, id }) => (
            <CarouselItem key={id} className="h-full basis-75 md:pl-0">
              <div className="h-full flex items-center gap-3">
                <div className="shrink-0 basis-16">
                  <div className="flex size-16 place-content-center place-items-center rounded-full border">
                    <Icon className="w-10" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="text-sm">{text}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
    <section className="w-full md:px-5">
      <div className="flex w-full flex-col gap-3 md:gap-4 lg:gap-16 overflow-hidden border rounded-lg p-8 md:rounded-xl lg:flex-row lg:items-center">
        <div className="flex-1">
          <h3 className="mb-3 text-2xl font-semibold md:mb-4 md:text-4xl lg:mb-6">Ready to go?</h3>
          <p className="max-w-xl text-muted-foreground lg:text-lg">
            Start posting and joining rides in minutes—your next trip is closer than you think.
          </p>
        </div>
        <ButtonGroup className="flex shrink-0 flex-col gap-2 sm:flex-row" />
      </div>
    </section>
    <section className="xl:px-15">
      <div className="mx-auto">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How GoatRide Works</h2>
          <p className="mt-3 text-muted-foreground">Because getting there should be simple.</p>
        </div>

        <div className="relative mt-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-7 hidden md:block"
          >
            <div className="mx-auto h-px w-[85%] bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ title, text, icon: Icon }) => (
              <Card
                key={title}
                className="overflow-hidden rounded-2xl backdrop-blur transition hover:-translate-y-0.5 hover:border-border/70"
              >
                <CardHeader className="flex items-center">
                  <div className="bg-foreground text-background p-2 rounded-full">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg">{title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
    <section className="md:px-5 xl:px-15 grid items-center gap-8 md:grid-cols-2">
      <div className="flex flex-col">
        <h1 className="my-6 text-2xl font-bold text-pretty lg:text-4xl">About Us</h1>
        <p className="mb-8 max-w-lg text-muted-foreground">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. In vitae suscipit justo, at
          volutpat arcu. Suspendisse consectetur porttitor turpis, in vehicula felis efficitur non.
          Nullam ullamcorper lacinia lacus non euismod. Nulla quam massa, accumsan eget erat eget,
          tristique mattis lectus. Curabitur vestibulum lacus sed orci maximus, non efficitur neque
          feugiat. Sed semper sodales justo, at posuere neque tempus ut. Proin efficitur aliquet
          pharetra. Quisque et nibh erat. Suspendisse in quam turpis. Etiam consequat porta sem a
          fermentum.
        </p>
      </div>
      <img
        alt="Hero section demo showing interface components"
        className="max-h-96 w-full rounded-md object-cover"
        src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg"
      />
    </section>
  </main>
);

export default Home;
