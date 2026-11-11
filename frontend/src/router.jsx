import { createBrowserRouter } from 'react-router';
import { lazy, Suspense } from 'react';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import AdminLayout from '@/layouts/AdminLayout';
import CustomerLayout from '@/layouts/CustomerLayout';
import ProtectedRoute from '@/components/ui/ProtectedRoute';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import HomePage from '@/pages/storefront/HomePage';

const p = (importFn) => {
  const Lazy = lazy(importFn);
  return {
    element: (
      <Suspense fallback={<PageLoader />}>
        <Lazy />
      </Suspense>
    ),
  };
};

export const router = createBrowserRouter([
  {
    element: <StorefrontLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', ...p(() => import('@/pages/storefront/CatalogPage')) },
      { path: 'shop/:categorySlug', ...p(() => import('@/pages/storefront/CatalogPage')) },
      { path: 'shop/:categorySlug/:subcategorySlug', ...p(() => import('@/pages/storefront/CatalogPage')) },
      { path: 'product/:slug', ...p(() => import('@/pages/storefront/ProductDetailPage')) },
      { path: 'cart', ...p(() => import('@/pages/storefront/CartPage')) },
      { path: 'checkout', ...p(() => import('@/pages/storefront/CheckoutPage')) },
      { path: 'wishlist', ...p(() => import('@/pages/storefront/WishlistPage')) },
      { path: 'search', ...p(() => import('@/pages/storefront/SearchResultsPage')) },
      { path: 'about-us', ...p(() => import('@/pages/storefront/AboutPage')) },
      { path: 'contact-us', ...p(() => import('@/pages/storefront/ContactPage')) },
      { path: 'blog', ...p(() => import('@/pages/storefront/BlogPage')) },
      { path: 'blog/:slug', ...p(() => import('@/pages/storefront/BlogArticlePage')) },
      { path: 'login', ...p(() => import('@/pages/auth/LoginPage')) },
      { path: 'register', ...p(() => import('@/pages/auth/RegisterPage')) },
      { path: 'forgot-password', ...p(() => import('@/pages/auth/ForgotPasswordPage')) },
      { path: 'reset-password', ...p(() => import('@/pages/auth/ResetPasswordPage')) },
      {
        path: 'account',
        element: <ProtectedRoute role="customer" />,
        children: [
          {
            element: <CustomerLayout />,
            children: [
              { index: true, ...p(() => import('@/pages/customer/ProfilePage')) },
              { path: 'addresses', ...p(() => import('@/pages/customer/AddressesPage')) },
              { path: 'orders', ...p(() => import('@/pages/customer/OrderHistoryPage')) },
              { path: 'orders/:orderId', ...p(() => import('@/pages/customer/OrderDetailPage')) },
              { path: 'settings', ...p(() => import('@/pages/customer/SettingsPage')) },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'admin',
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, ...p(() => import('@/pages/admin/DashboardPage')) },
          { path: 'products', ...p(() => import('@/pages/admin/ProductListPage')) },
          { path: 'products/new', ...p(() => import('@/pages/admin/ProductFormPage')) },
          { path: 'products/:id/edit', ...p(() => import('@/pages/admin/ProductFormPage')) },
          { path: 'categories', ...p(() => import('@/pages/admin/CategoryManagementPage')) },
          { path: 'orders', ...p(() => import('@/pages/admin/OrderListPage')) },
          { path: 'orders/:id', ...p(() => import('@/pages/admin/OrderDetailPage')) },
          { path: 'inventory', ...p(() => import('@/pages/admin/InventoryPage')) },
          { path: 'admins', ...p(() => import('@/pages/admin/AdminManagementPage')) },
        ],
      },
    ],
  },
  { path: '*', ...p(() => import('@/pages/NotFoundPage')) },
]);
