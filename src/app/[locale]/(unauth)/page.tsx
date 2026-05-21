import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

import { Footer } from '@/templates/Footer';
import { Logo } from '@/templates/Logo';
import { Navbar } from '@/templates/Navbar';

export function generateMetadata() {
  return {
    title: 'Tele-CRM',
    description: 'The CRM for Telegram creator agencies.',
  };
}

const IndexPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <Navbar />
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
        <Logo />
        <h1 className="text-center text-4xl font-semibold tracking-tight">
          Tele-CRM
        </h1>
        <p className="max-w-md text-center text-muted-foreground">
          The CRM for Telegram creator agencies. Sign in to access your inbox.
        </p>
        <Link
          href="/sign-in"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Sign in
        </Link>
      </main>
      <Footer />
    </>
  );
};

export default IndexPage;
