import { Navigate } from 'react-router-dom';

const RutaProtegida = ({ children, rolesPermitidos }) => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const rol = usuario?.rol;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RutaProtegida;