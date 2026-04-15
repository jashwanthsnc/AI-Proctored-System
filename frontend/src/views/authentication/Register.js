import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, Stack } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AuthRegister from './auth/AuthRegister';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useRegisterMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import Loader from './Loader';

const userValidationSchema = yup.object({
  name: yup.string().min(2).max(50).required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
  confirm_password: yup.string().required('Required').oneOf([yup.ref('password')], 'Passwords must match'),
  role: yup.string().oneOf(['student', 'teacher']).required('Role is required'),
  phone: yup.string().max(20),
  institution: yup.string().max(100),
  department: yup.string().max(100),
  studentId: yup.string().max(50),
});

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', confirm_password: '', role: 'student', phone: '', institution: '', department: '', studentId: '' },
    validationSchema: userValidationSchema,
    onSubmit: (values) => handleSubmit(values),
  });

  useEffect(() => {
    if (userInfo) navigate('/');
  }, [navigate, userInfo]);

  const handleSubmit = async ({ name, email, password, confirm_password, role, phone, institution, department, studentId }) => {
    if (password !== confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const res = await register({ name, email, password, role, phone, institution, department, studentId }).unwrap();
      dispatch(setCredentials({ ...res }));
      formik.resetForm();
      navigate('/auth/login');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <PageContainer title="Create Account" description="Register for ATE-PROT">
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 60%)',
          bottom: '-200px',
          right: '-200px',
          pointerEvents: 'none',
        },
      }}>
        <Box sx={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: '#0A84FF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              boxShadow: '0 8px 24px rgba(10,132,255,0.4)',
            }}>
              <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem', letterSpacing: '-1px', fontFamily: 'Inter, sans-serif' }}>AP</Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
              Create Account
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.5)', mt: 0.75, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
              ATE-PROT · Secure Exams
            </Typography>
          </Box>

          <Box sx={{
            backgroundColor: '#1C1C1E',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            p: 3,
            boxShadow: '0 32px 64px rgba(0,0,0,0.8)',
          }}>
            <AuthRegister
              formik={formik}
              subtitle={
                <Stack direction="row" spacing={0.75} justifyContent="center" mt={3}>
                  <Typography sx={{ color: 'rgba(235,235,245,0.4)', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                    Already have an account?
                  </Typography>
                  <Typography
                    component={Link}
                    to="/auth/login"
                    sx={{ textDecoration: 'none', color: '#0A84FF', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em', '&:hover': { color: '#409CFF' } }}
                  >
                    Sign in
                  </Typography>
                  {isLoading && <Loader />}
                </Stack>
              }
            />
          </Box>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Register;
