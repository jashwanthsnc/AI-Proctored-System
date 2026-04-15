import React, { useState } from 'react';
import { Box, Typography, FormControlLabel, Button, Stack, Checkbox, IconButton, InputAdornment } from '@mui/material';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: '12px',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
    '&.Mui-focused fieldset': { borderColor: '#0A84FF', borderWidth: '2px' },
    '& input': { color: '#FFFFFF', fontSize: '0.9375rem', letterSpacing: '-0.01em', padding: '13px 14px', fontFamily: 'Inter, sans-serif' },
    '& input::placeholder': { color: 'rgba(235,235,245,0.25)', opacity: 1 },
  },
};

const LabelText = ({ children, htmlFor }) => (
  <Typography
    component="label"
    htmlFor={htmlFor}
    sx={{ display: 'block', mb: '6px', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(235,235,245,0.5)', letterSpacing: '-0.005em', fontFamily: 'Inter, sans-serif' }}
  >
    {children}
  </Typography>
);

const AuthLogin = ({ formik, subtitle }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit } = formik;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <Stack spacing={0}>
        <Box>
          <LabelText htmlFor="username">Email</LabelText>
          <CustomTextField
            id="username"
            name="email"
            variant="outlined"
            placeholder="you@example.com"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && !!errors.email}
            helperText={touched.email && errors.email}
            fullWidth
            sx={inputSx}
          />
        </Box>
        <Box mt={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '6px' }}>
            <LabelText htmlFor="password">Password</LabelText>
            <Typography
              sx={{ fontSize: '0.8125rem', color: '#0A84FF', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', '&:hover': { color: '#409CFF' } }}
            >
              Forgot?
            </Typography>
          </Box>
          <CustomTextField
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            placeholder="••••••••"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && !!errors.password}
            helperText={touched.password && errors.password}
            fullWidth
            sx={inputSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: 'rgba(235,235,245,0.35)', mr: -0.5 }}>
                    {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box mt={1.5}>
          <FormControlLabel
            control={
              <Checkbox
                defaultChecked
                size="small"
                sx={{ color: 'rgba(235,235,245,0.2)', '&.Mui-checked': { color: '#0A84FF' }, p: 0.75 }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif' }}>
                Keep me signed in
              </Typography>
            }
          />
        </Box>
      </Stack>
      <Box mt={2}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={handleSubmit}
          sx={{
            borderRadius: '12px',
            py: 1.5,
            fontWeight: 600,
            fontSize: '0.9375rem',
            letterSpacing: '-0.01em',
            background: '#0A84FF',
            boxShadow: '0 4px 16px rgba(10,132,255,0.4)',
            '&:hover': {
              background: '#409CFF',
              boxShadow: '0 6px 20px rgba(10,132,255,0.5)',
            },
          }}
        >
          Sign In
        </Button>
      </Box>
      {subtitle}
    </>
  );
};

export default AuthLogin;
