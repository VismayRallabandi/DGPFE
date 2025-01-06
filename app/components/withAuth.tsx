'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthHOC = (props: any) => {
    const router = useRouter();

    React.useEffect(() => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login'); // Redirect to login if no token is found
      }
    }, [router]);

    return <WrappedComponent {...props} />; // Render the wrapped component if authenticated
  };

  return AuthHOC;
};

export default withAuth;