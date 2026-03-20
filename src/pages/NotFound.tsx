import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute, getModuleForPath } from '@/lib/data/rbac';

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const isUnauthorizedModuleRoute =
    isAuthenticated &&
    !!user &&
    !!getModuleForPath(location.pathname) &&
    !canAccessRoute(user.id, location.pathname);

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  if (isUnauthorizedModuleRoute) {
    return (
      <Navigate
        to="/"
        replace
        state={{ accessDenied: true, deniedPath: location.pathname }}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
