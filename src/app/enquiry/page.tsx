import type { Metadata } from 'next';
import ContactUsClient from '../contact-us/ContactUsClient';

export const metadata: Metadata = {
  title: "Advertising & Business Enquiry | Today's Coimbatore",
  description: "Submit your business, real estate, sponsorship, and promotional advertising enquiries on Today's Coimbatore.",
  alternates: {
    canonical: 'https://todayscoimbatore.com/enquiry',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnquiryPage() {
  return <ContactUsClient />;
}
