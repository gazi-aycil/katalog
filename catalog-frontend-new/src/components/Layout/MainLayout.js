import { Outlet } from 'react-router-dom';
import MainNav from '../Navigation/MainNav';

export default function MainLayout() {
  return (
    <div>
      <MainNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}