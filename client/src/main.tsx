import 'bootstrap/dist/css/bootstrap.min.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import './index.css'
import App from './App'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Companies from './pages/Companies/Companies'
import Contacts from './pages/Contacts/Contacts'
import Deals from './pages/Deals/Deals'
import DealsBoard from './pages/Deals/DealsBoard'
import Activities from './pages/Activities/Activities'
import NotFound from './pages/NotFound'
import { store } from './app/store'
import RequireRole from './components/RequireRole'
import PurchaseOrders from './pages/PurchaseOrder/PurchaseOrders'
import Invoices from './pages/Invoices/Invoices'
import GRNs from './pages/GRN/GRNs'

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <RequireRole resource="dashboard"><Dashboard /></RequireRole> },
    { path: 'companies',   element: <RequireRole resource="companies"><Companies /></RequireRole> },
    { path: 'contacts',    element: <RequireRole resource="contacts"><Contacts /></RequireRole> },
    { path: 'deals',       element: <RequireRole resource="deals"><Deals /></RequireRole> },
    { path: 'deals-board', element: <RequireRole resource="deals"><DealsBoard /></RequireRole> },
    { path: 'activities',  element: <RequireRole resource="activities"><Activities /></RequireRole> },
    { path: 'purchase-orders', element: <RequireRole resource='purchaseOrders'><PurchaseOrders /></RequireRole> },
    { path: 'invoices', element: <RequireRole resource="invoices"><Invoices/></RequireRole> },
    { path: 'grns', element: <RequireRole resource="grns"><GRNs /></RequireRole> },

  ]},
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '*', element: <NotFound /> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
)
