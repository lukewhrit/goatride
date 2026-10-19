'use client';

import ChangePassword from './changePassword';
import MyRides from './myRides';
import Profile from './profile';

import type { JSX } from 'react';

const SettingsPage = (): JSX.Element => (
  <main className="h-screen overflow-y-scroll w-full p-6 space-y-8">
    <h1 className="text-3xl">Settings</h1>
    <section className="space-y-8" id="preferences">
      <h2 className="text-2xl">Preferences</h2>
      <Profile />
      <MyRides />
      <ChangePassword />
    </section>
  </main>
);

export default SettingsPage;
