'use client';

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import type { JSX } from 'react';

const SettingsPage = (): JSX.Element => (
  <main className="max-w-4xl h-screen p-6 space-y-4 text-white">
    <h1 className="text-2xl">Settings</h1>
    <section>
      <h2 className="text-xl" id="preferences">
        Preferences
      </h2>
    </section>
    <section>
      <h2 className="text-xl" id="privacy-and-security">
        Privacy and security
      </h2>
      <section>
        <FieldSet>
          <FieldLegend>Address Information</FieldLegend>
          <FieldDescription>We need your address to deliver your order.</FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="street">Current password</FieldLabel>
              <Input id="street" placeholder="123 Main St" type="text" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" placeholder="New York" type="text" />
              </Field>
              <Field>
                <FieldLabel htmlFor="zip">Postal Code</FieldLabel>
                <Input id="zip" placeholder="90502" type="text" />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>
      </section>
      <section>
        <h3 className="text-lg" id="2fa">
          Two-factor authentication
        </h3>
      </section>
    </section>
  </main>
);

export default SettingsPage;
