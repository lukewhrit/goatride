'use client';

import ChangePassword from './changePassword';
import MFA from './mfa';
import MyRides from './myRides';
import Profile from './profile';

import type { JSX } from 'react';

const SettingsPage = (): JSX.Element => (
  <main className="h-screen overflow-y-scroll w-full p-6 space-y-4 text-white">
    <h1 className="text-3xl">Settings</h1>
    <section className="space-y-4" id="preferences">
      <h2 className="text-2xl">Preferences</h2>
      <Profile />
      <MyRides />
    </section>
    <section className="space-y-4" id="privacy-and-security">
      <h2 className="text-2xl">Privacy and security</h2>
      <ChangePassword />
      <MFA />
    </section>
  </main>
);

export default SettingsPage;
