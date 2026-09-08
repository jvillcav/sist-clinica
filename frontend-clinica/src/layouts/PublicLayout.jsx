import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/publicLayout.css';

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <Navbar />

      <div className="public-layout__content">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
};

export default PublicLayout;
