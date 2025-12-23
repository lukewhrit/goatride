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
import { Textarea } from '@/components/ui/textarea';

import type { JSX } from 'react';

const Profile = (): JSX.Element => (
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
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <FieldDescription>Provide your full name for identification</FieldDescription>
            </FieldContent>
            <Input required id="name" placeholder="Evil Rabbit" />
          </Field>
          <FieldSeparator />
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="lastName">Message</FieldLabel>
              <FieldDescription>
                You can write your message here. Keep it short, preferably under 100 characters.
              </FieldDescription>
            </FieldContent>
            <Textarea
              required
              className="min-h-[100px] resize-none sm:min-w-[300px]"
              id="message"
              placeholder="Hello, world!"
            />
          </Field>
          <FieldSeparator />
          <Field orientation="responsive">
            <Button type="submit">Submit</Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  </div>
);

export default Profile;
