import React, { useState } from 'react';
import { Box, Typography, Button, Avatar, Grid, CircularProgress, Divider, Chip } from '@mui/material';
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff, IconDeviceFloppy, IconShieldCheck, IconAlertCircle, IconPhone, IconBuilding, IconId, IconBook2, IconNotes } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useUpdateUserMutation } from '../../slices/usersApiSlice';
import { setCredentials } from '../../slices/authSlice';

const validationSchema = yup.object({
  name: yup.string().min(2).max(50).required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string().max(20),
  institution: yup.string().max(100),
  department: yup.string().max(100),
  studentId: yup.string().max(50),
  bio: yup.string().max(300),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  confirm_password: yup.string().required('Please confirm your password').oneOf([yup.ref('password')], 'Passwords must match'),
});

const labelSx = { fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', mb: 0.75, display: 'block' };
const getInput = (e) => ({ width: '100%', background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${e ? 'rgba(255,69,58,0.6)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', padding: '11px 14px', color: '#FFFFFF', fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' });
const eyeSx = { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'rgba(235,235,245,0.35)', lineHeight: 0 };

const F = ({ icon: Icon, label, children, error }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
      <Icon size={14} color="rgba(235,235,245,0.4)" />
      <Typography component="label" sx={labelSx}>{label}</Typography>
    </Box>
    {children}
    {error && <Typography sx={{ fontSize: '0.75rem', color: '#FF453A', fontFamily: 'Inter, sans-serif', mt: 0.5 }}>{error}</Typography>}
  </Box>
);

const UserAccount = () => {
  const { userInfo } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateUserMutation();
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const initials = userInfo?.name ? userInfo.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const formik = useFormik({
    initialValues: {
      name: userInfo?.name || '',
      email: userInfo?.email || '',
      phone: userInfo?.phone || '',
      institution: userInfo?.institution || '',
      department: userInfo?.department || '',
      studentId: userInfo?.studentId || '',
      bio: userInfo?.bio || '',
      password: '',
      confirm_password: '',
    },
    validationSchema,
    onSubmit: async ({ name, email, phone, institution, department, studentId, bio, password, confirm_password }) => {
      if (password !== confirm_password) { toast.error('Passwords do not match'); return; }
      try {
        const res = await updateProfile({ _id: userInfo._id, name, email, password, role: userInfo.role, phone, institution, department, studentId, bio }).unwrap();
        dispatch(setCredentials(res));
        formik.setFieldValue('password', '');
        formik.setFieldValue('confirm_password', '');
        toast.success('Profile updated successfully');
      } catch (err) { toast.error(err?.data?.message || err.error); }
    },
  });

  const { values, errors, touched, handleBlur, handleChange, handleSubmit } = formik;

  return (
    <PageContainer title="Account Settings">
      <Box sx={{ pb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
            Account Settings
          </Typography>
          <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(235,235,245,0.45)', mt: 0.75, fontFamily: 'Inter, sans-serif' }}>
            Manage your profile and security settings
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
              <Avatar sx={{ width: 80, height: 80, fontSize: '1.75rem', fontWeight: 700, background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)', boxShadow: '0 8px 24px rgba(10,132,255,0.35)' }}>
                {initials}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>{userInfo?.name}</Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.4)', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>{userInfo?.email}</Typography>
              </Box>
              <Chip
                label={userInfo?.role === 'teacher' ? 'Instructor' : 'Student'}
                size="small"
                sx={{ backgroundColor: userInfo?.role === 'teacher' ? 'rgba(191,90,242,0.15)' : 'rgba(10,132,255,0.15)', color: userInfo?.role === 'teacher' ? '#BF5AF2' : '#0A84FF', fontFamily: 'Inter, sans-serif', fontWeight: 600, height: 26, borderRadius: '8px' }}
              />
              <Divider sx={{ width: '100%', borderColor: 'rgba(84,84,88,0.65)' }} />
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { icon: IconUser, label: 'Full Name', value: userInfo?.name },
                  { icon: IconMail, label: 'Email', value: userInfo?.email },
                  { icon: IconShieldCheck, label: 'Role', value: userInfo?.role === 'teacher' ? 'Instructor' : 'Student' },
                  ...(userInfo?.institution ? [{ icon: IconBuilding, label: 'Institution', value: userInfo.institution }] : []),
                  ...(userInfo?.department ? [{ icon: IconBook2, label: 'Department', value: userInfo.department }] : []),
                  ...(userInfo?.phone ? [{ icon: IconPhone, label: 'Phone', value: userInfo.phone }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textAlign: 'left' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color="rgba(235,235,245,0.4)" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
                      <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.75)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{value}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Edit Form */}
          <Grid item xs={12} md={8}>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Personal Info */}
              <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', p: 2.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2.5, fontFamily: 'Inter, sans-serif' }}>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <F icon={IconUser} label="Full Name" error={touched.name && errors.name}>
                      <input name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} placeholder="Your full name" style={getInput(touched.name && !!errors.name)} />
                    </F>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <F icon={IconMail} label="Email Address" error={touched.email && errors.email}>
                      <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com" style={getInput(touched.email && !!errors.email)} />
                    </F>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <F icon={IconPhone} label="Phone Number" error={touched.phone && errors.phone}>
                      <input name="phone" type="tel" value={values.phone} onChange={handleChange} onBlur={handleBlur} placeholder="+1 (555) 000-0000" style={getInput(touched.phone && !!errors.phone)} />
                    </F>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <F icon={IconBuilding} label="Institution / School" error={touched.institution && errors.institution}>
                      <input name="institution" value={values.institution} onChange={handleChange} onBlur={handleBlur} placeholder="University / Company name" style={getInput(touched.institution && !!errors.institution)} />
                    </F>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <F icon={IconBook2} label="Department / Course" error={touched.department && errors.department}>
                      <input name="department" value={values.department} onChange={handleChange} onBlur={handleBlur} placeholder="e.g., Computer Science" style={getInput(touched.department && !!errors.department)} />
                    </F>
                  </Grid>
                  {userInfo?.role === 'student' && (
                    <Grid item xs={12} sm={6}>
                      <F icon={IconId} label="Student / Roll ID" error={touched.studentId && errors.studentId}>
                        <input name="studentId" value={values.studentId} onChange={handleChange} onBlur={handleBlur} placeholder="e.g., CS2024001" style={getInput(touched.studentId && !!errors.studentId)} />
                      </F>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <F icon={IconNotes} label="Bio" error={touched.bio && errors.bio}>
                      <textarea name="bio" value={values.bio} onChange={handleChange} onBlur={handleBlur} placeholder="A short bio about yourself…" rows={3} style={{ ...getInput(touched.bio && !!errors.bio), resize: 'vertical', lineHeight: '1.5' }} />
                    </F>
                  </Grid>
                </Grid>
              </Box>

              {/* Password */}
              <Box sx={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', p: 2.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2.5, fontFamily: 'Inter, sans-serif' }}>
                  Change Password
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <F icon={IconLock} label="New Password" error={touched.password && errors.password}>
                      <Box sx={{ position: 'relative' }}>
                        <input name="password" type={showPw ? 'text' : 'password'} value={values.password} onChange={handleChange} onBlur={handleBlur} placeholder="Min 6 characters" style={{ ...getInput(touched.password && !!errors.password), paddingRight: '40px' }} />
                        <Box sx={eyeSx} onClick={() => setShowPw(!showPw)}>{showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}</Box>
                      </Box>
                    </F>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <F icon={IconLock} label="Confirm Password" error={touched.confirm_password && errors.confirm_password}>
                      <Box sx={{ position: 'relative' }}>
                        <input name="confirm_password" type={showCf ? 'text' : 'password'} value={values.confirm_password} onChange={handleChange} onBlur={handleBlur} placeholder="Re-enter password" style={{ ...getInput(touched.confirm_password && !!errors.confirm_password), paddingRight: '40px' }} />
                        <Box sx={eyeSx} onClick={() => setShowCf(!showCf)}>{showCf ? <IconEyeOff size={16} /> : <IconEye size={16} />}</Box>
                      </Box>
                    </F>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, backgroundColor: 'rgba(10,132,255,0.06)', border: '0.5px solid rgba(10,132,255,0.15)', borderRadius: '10px', p: 1.5, display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                  <IconAlertCircle size={15} color="#0A84FF" style={{ marginTop: 1, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                    You must enter your password to save any account changes.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={16} />}
                  sx={{ backgroundColor: '#0A84FF', color: '#fff', borderRadius: '980px', px: 3, py: 1, fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', textTransform: 'none', boxShadow: '0 4px 16px rgba(10,132,255,0.35)', '&:hover': { backgroundColor: '#409CFF' }, '&:disabled': { opacity: 0.5, boxShadow: 'none' } }}
                >
                  {isLoading ? 'Saving\u2026' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default UserAccount;
