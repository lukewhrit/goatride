import { CONTACT_EMAIL, LegalPage } from '@/app/ui/legalPage';

import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = { title: 'Terms of Service | GoatRide' };

const TermsPage = (): JSX.Element => (
  <LegalPage title="Terms of Service">
    <p>
      These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of GoatRide
      (&ldquo;GoatRide,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), including
      the website and all related features (the &ldquo;Service&rdquo;). Please read them carefully.
    </p>

    <h2>1. Acceptance of These Terms</h2>
    <p>
      By creating an account or otherwise using the Service, you agree to be bound by these Terms
      and by our Privacy Policy. If you do not agree, you may not use the Service.
    </p>

    <h2>2. About GoatRide</h2>
    <p>
      GoatRide is an online platform that allows users to post ride offers and communicate with one
      another to arrange shared travel. GoatRide is not a transportation provider. We do not provide
      rides, employ or contract with drivers, or own or operate vehicles. We do not conduct
      background checks, verify driving records, licenses, or insurance, or inspect vehicles.
    </p>
    <p>
      Any ride arranged through the Service is an agreement solely between the users involved. You
      are responsible for evaluating the people you choose to travel with, and you participate in
      any ride at your own risk.
    </p>
    <p>
      GoatRide is an independent project and is not operated, sponsored, or endorsed by Worcester
      Polytechnic Institute (WPI) or any other educational institution.
    </p>

    <h2>3. Eligibility</h2>
    <p>
      You must be at least 17 years of age to use the Service. If you are under 18, you represent
      that your parent or legal guardian has reviewed and agreed to these Terms on your behalf and
      has consented to your use of the Service.
    </p>

    <h2>4. Your Account</h2>
    <ul>
      <li>You must provide accurate and complete information, including your real name.</li>
      <li>You may maintain only one account and may not create an account for another person.</li>
      <li>
        You are responsible for maintaining the confidentiality of your login credentials and for
        all activity that occurs under your account.
      </li>
      <li>You may delete your account at any time from your account settings.</li>
    </ul>

    <h2>5. Driver Responsibilities</h2>
    <p>If you offer a ride through the Service, you represent and agree that you will:</p>
    <ul>
      <li>
        Hold a valid driver&apos;s license and maintain valid vehicle registration and insurance as
        required by law.
      </li>
      <li>
        Comply with all restrictions on your license, including any limits on passengers or driving
        hours that apply to junior or provisional licenses.
      </li>
      <li>Comply with all applicable laws, including traffic and motor vehicle laws.</li>
      <li>Operate a vehicle that is safe and in good working condition.</li>
    </ul>

    <h2>6. Rider Responsibilities</h2>
    <p>
      If you join a ride, you agree to arrive on time, treat the driver and other passengers with
      respect, and comply with all applicable laws.
    </p>

    <h2>7. Prohibited Conduct</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Post false, misleading, or fraudulent ride offers or information.</li>
      <li>Harass, threaten, intimidate, or discriminate against any other user.</li>
      <li>Use the Service to operate a commercial transportation, taxi, or delivery business.</li>
      <li>Send spam or unsolicited advertising.</li>
      <li>
        Post or share content that is unlawful or that infringes the rights of any other person.
      </li>
      <li>
        Attempt to gain unauthorized access to the Service or other users&apos; accounts, or
        interfere with the proper operation of the Service.
      </li>
    </ul>

    <h2>8. Payments</h2>
    <p>
      Drivers may indicate a price per seat for the purpose of sharing travel costs. GoatRide does
      not process payments and is not a party to any payment arrangement between users. We are not
      responsible for payments, refunds, or disputes between users.
    </p>

    <h2>9. User Content</h2>
    <p>
      You retain ownership of the content you submit to the Service, including ride posts, messages,
      and profile information. By submitting content, you grant GoatRide a non-exclusive,
      royalty-free license to store, display, and transmit that content solely as necessary to
      operate the Service.
    </p>

    <h2>10. Suspension and Termination</h2>
    <p>
      We may remove content, or suspend or terminate any account, at our discretion and without
      prior notice, including if we believe a user has violated these Terms or poses a risk to other
      users.
    </p>

    <h2>11. Disclaimer of Warranties</h2>
    <p>
      The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis,
      without warranties of any kind, whether express or implied. We do not warrant that the Service
      will be uninterrupted or error-free, or that any ride, user, or content is accurate, reliable,
      or safe.
    </p>

    <h2>12. Limitation of Liability</h2>
    <p>
      To the fullest extent permitted by law, GoatRide and its operators shall not be liable for any
      indirect, incidental, special, or consequential damages, or for any personal injury, property
      damage, or other loss arising from or related to your use of the Service, any ride arranged
      through the Service, or the conduct of any user.
    </p>

    <h2>13. Changes to These Terms</h2>
    <p>
      We may revise these Terms from time to time. When we do, we will update the effective date
      above and, for material changes, provide notice through the Service. Your continued use of the
      Service after the revised Terms take effect constitutes your acceptance of them.
    </p>

    <h2>14. Contact</h2>
    <p>If you have any questions about these Terms, please contact us at {CONTACT_EMAIL}.</p>
  </LegalPage>
);

export default TermsPage;
