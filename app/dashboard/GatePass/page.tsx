'use client';
import Form from 'app/components/form';
import withAuth from '@/app/components/withAuth';

function Page() {
  return (
    <div>
      <Form />
    </div>
  );
}
export default withAuth( Page);