import Layout from "./components/Layout";
import { Outlet } from "react-router-dom";
export default function App() {
   // localStorage.setItem('user', JSON.stringify({ name:'Test', email:'viewer@example.com', role:'viewer' }))
//     localStorage.setItem('user', JSON.stringify({ name:'Admin', email:'a@a.com', role:'admin' }))
//     localStorage.removeItem('token');
// localStorage.removeItem('user');
// reload, then log in again



  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
