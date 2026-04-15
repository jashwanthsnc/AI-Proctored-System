import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const TeacherRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === 'teacher';

  if (!userInfo) return <Navigate to="/auth/login" replace />;
  return isTeacher ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
export default TeacherRoute;
