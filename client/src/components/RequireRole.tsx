import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { selectUser } from '../features/auth/authSlice'
import { can, Role } from '../utils/rbac'

export default function RequireRole({
  role, action='read', resource, children
}: {
  role?: Role
  action?: 'read' | 'create' | 'update' | 'delete' | 'manage'
  resource: 'dashboard' | 'companies' | 'contacts' | 'deals' | 'activities' | 'purchaseOrders' | 'invoices' | 'grns'
  children: ReactNode
}) {
  const user = selectUser()
  const userRole = (user?.role || 'viewer') as Role
  if (!can(userRole, action, resource)) return <Navigate to="/" replace />
  return <>{children}</>
}
