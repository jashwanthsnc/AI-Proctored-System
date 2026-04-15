import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, Stack } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import AuthLogin from './auth/AuthLogin';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import { toast } from 'react-toastify';
import Loader from './Loader';

const userValidationSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(2).required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: userValidationSchema,
    onSubmit: (values) => handleSubmit(values),
  });

  useEffect(() => {
    if (userInfo) navigate('/');
  }, [navigate, userInfo]);

  const handleSubmit = async ({ email, password }) => {
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      formik.resetForm();
      const redirectLocation = JSON.parse(localStorage.getItem('redirectLocation'));
      if (redirectLocation) {
        localStorage.removeItem('redirectLocation');
        navigate(redirectLocation.pathname);
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <PageContainer title="Sign In" description="Sign in to ATE-PROT">
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 60%)',
          top: '-200px',
          right: '-200px',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(48,209,88,0.04) 0%, transparent 60%)',
          bottom: '-150px',
          left: '-150px',
          pointerEvents: 'none',
        },
      }}>
        <Box sx={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
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
              Sign In
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.5)', mt: 0.75, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
              ATE-PROT · Secure Exams
            </Typography>
          </Box>

          {/* Form Card */}
          <Box sx={{
            backgroundColor: '#1C1C1E',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            p: 3,
            boxShadow: '0 32px 64px rgba(0,0,0,0.8)',
          }}>
            <AuthLogin
              formik={formik}
              subtitle={
                <Stack direction="row" spacing={0.75} justifyContent="center" mt={3}>
                  <Typography sx={{ color: 'rgba(235,235,245,0.4)', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                    New here?
                  </Typography>
                  <Typography
                    component={Link}
                    to="/auth/register"
                    sx={{ textDecoration: 'none', color: '#0A84FF', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em', '&:hover': { color: '#409CFF' } }}
                  >
                    Create account
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

export default Login;
