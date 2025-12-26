import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { useUserContext } from '../layout';

import type { JSX } from 'react';

const formatStringToUuid = (str: string): string => {
  // Ensure the input string only contains valid hex characters and is 32 chars long
  // You might want more robust validation based on your needs
  const cleanStr = str.replace(/-/g, '').substring(0, 32);

  if (cleanStr.length !== 32) {
    return str;
  }

  const uuid = `${cleanStr.substring(0, 8)}-${cleanStr.substring(8, 12)}-${cleanStr.substring(
    12,
    16,
  )}-${cleanStr.substring(16, 20)}-${cleanStr.substring(20, 32)}`;

  return uuid;
};

const Profile = (): JSX.Element => {
  const session = useUserContext();

  return (
    <div className="w-full max-w-3xl">
      <form>
        <FieldSet>
          <FieldLegend>
            <h3 className="text-xl">Profile</h3>
          </FieldLegend>
          <FieldDescription>Fill in your profile information.</FieldDescription>
          <FieldSeparator />
          <FieldGroup>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="user-id">User Identifier</FieldLabel>
                <FieldDescription>
                  A 32-character hexadecimal identifier, unique to your user.
                </FieldDescription>
              </FieldContent>
              <p className="self-center font-mono text-muted-foreground" id="user-id">
                {formatStringToUuid(session?.user.id as string)}
              </p>
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>Provide your full name for identification</FieldDescription>
              </FieldContent>
              <Input required id="name" placeholder={session?.user.name as string} />
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="lastName">Email</FieldLabel>
                <FieldDescription>Change your email</FieldDescription>
              </FieldContent>
              <div className="flex flex-col gap-3">
                <Input required id="name" placeholder={session?.user.email as string} />
                <Input required id="name" placeholder="Confirm email..." />
              </div>
            </Field>
            <Field orientation="responsive">
              <Button type="submit">Submit</Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  );
};

export default Profile;
