'use client';

import { Gift, Headphones, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';

interface Incentive {
  title: string;
  icon: LucideIcon;
  text: string;
  id: string;
}

const incentives: Incentive[] = [
  {
    id: '1',
    title: 'Tech Assistance',
    text: 'Mon - Sun, 24h support',
    icon: Headphones,
  },
  {
    id: '2',
    title: 'Quick Exchanges',
    text: 'Returns processed within 60 days',
    icon: RefreshCw,
  },
  {
    id: '3',
    title: 'Premium Wrapping',
    text: 'Free wrapping over $100',
    icon: Gift,
  },
  {
    id: '4',
    title: 'Product Guarantee',
    text: 'Zero hassle warranty',
    icon: ShieldCheck,
  },
];

const Home = (): JSX.Element => (
  <main className="px-30 py-10 flex flex-col gap-10 justify-center">
    <section className="px-5 py-30">
      <div className="container text-center">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <h1 className="text-3xl font-semibold lg:text-6xl">Need a ride?</h1>
          <p className="text-balance text-muted-foreground lg:text-lg">
            Finely crafted components built with React, Tailwind and Shadcn UI. Developers can copy
            and paste these blocks directly into their project.
          </p>
        </div>
        <div className="mt-5 flex gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/sign-up">Create an account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
    <section className="container px-5">
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
        <CarouselContent className="md:ml-0 md:grid md:grid-cols-[repeat(2,_minmax(12.5rem,_18.75rem))] md:justify-center md:gap-5 xl:grid-cols-[repeat(4,_minmax(12.5rem,_18.75rem))]">
          {incentives.map(({ title, icon: Icon, text, id }) => (
            <CarouselItem key={id} className="basis-75 md:pl-0">
              <div className="flex items-center gap-6">
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
    <section>
      <div className="container">
        <div className="flex w-full flex-col gap-16 overflow-hidden border rounded-lg p-8 md:rounded-xl lg:flex-row lg:items-center lg:p-12">
          <div className="flex-1">
            <h3 className="mb-3 text-2xl font-semibold md:mb-4 md:text-4xl lg:mb-6">
              Call to Action
            </h3>
            <p className="max-w-xl text-muted-foreground lg:text-lg">
              Build faster with our collection of pre-built blocks. Speed up your development and
              ship features in record time.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button asChild variant="default">
              <Link href="/sign-up">Create an account</Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
    <section className="px-5">
      <div className="container">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="my-6 text-2xl font-bold text-pretty lg:text-4xl">About Us</h1>
            <p className="mb-8 max-w-lg text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. In vitae suscipit justo, at
              volutpat arcu. Suspendisse consectetur porttitor turpis, in vehicula felis efficitur
              non. Nullam ullamcorper lacinia lacus non euismod. Nulla quam massa, accumsan eget
              erat eget, tristique mattis lectus. Curabitur vestibulum lacus sed orci maximus, non
              efficitur neque feugiat. Sed semper sodales justo, at posuere neque tempus ut. Proin
              efficitur aliquet pharetra. Quisque et nibh erat. Suspendisse in quam turpis. Etiam
              consequat porta sem a fermentum.
            </p>
          </div>
          <img
            alt="Hero section demo showing interface components"
            className="max-h-96 w-full rounded-md object-cover"
            src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg"
          />
        </div>
      </div>
    </section>
  </main>
);

export default Home;
