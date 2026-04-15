import React, { useState } from 'react';
import { Box, Typography, Button, Select, MenuItem, IconButton, InputAdornment } from '@mui/material';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { Stack } from '@mui/system';

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

const AuthRegister = ({ formik, subtitle }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit } = formik;
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  const eyeBtn = (show, toggle) => ({
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={toggle} edge="end" size="small" sx={{ color: 'rgba(235,235,245,0.35)', mr: -0.5 }}>
          {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
        </IconButton>
      </InputAdornment>
    ),
  });

  const textFields = [
    { label: 'Full Name', id: 'name', name: 'name', type: 'text', placeholder: 'John Doe' },
    { label: 'Email', id: 'email', name: 'email', type: 'email', placeholder: 'you@example.com' },
  ];

  const roleFields = values.role === 'teacher'
    ? [
        { label: 'Institution / School', id: 'institution', name: 'institution', type: 'text', placeholder: 'University / Company' },
        { label: 'Department', id: 'department', name: 'department', type: 'text', placeholder: 'e.g., Computer Science' },
        { label: 'Phone (optional)', id: 'phone', name: 'phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
      ]
    : values.role === 'student'
    ? [
        { label: 'Student / Roll ID', id: 'studentId', name: 'studentId', type: 'text', placeholder: 'e.g., CS2024001' },
        { label: 'Institution / School', id: 'institution', name: 'institution', type: 'text', placeholder: 'University name' },
        { label: 'Phone (optional)', id: 'phone', name: 'phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
      ]
    : [];

  return (
    <Box component="form">
      <Stack spacing={2}>
        {textFields.map((field) => (
          <Box key={field.id}>
            <LabelText htmlFor={field.id}>{field.label}</LabelText>
            <CustomTextField
              id={field.id}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              variant="outlined"
              value={values[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!(touched[field.name] && errors[field.name])}
              helperText={touched[field.name] && errors[field.name]}
              fullWidth
              sx={inputSx}
            />
          </Box>
        ))}
        <Box>
          <LabelText htmlFor="password">Password</LabelText>
          <CustomTextField id="password" name="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" variant="outlined" value={values.password} onChange={handleChange} onBlur={handleBlur} error={!!(touched.password && errors.password)} helperText={touched.password && errors.password} fullWidth sx={inputSx} InputProps={eyeBtn(showPw, () => setShowPw(!showPw))} />
        </Box>
        <Box>
          <LabelText htmlFor="confirm_password">Confirm Password</LabelText>
          <CustomTextField id="confirm_password" name="confirm_password" type={showCf ? 'text' : 'password'} placeholder="••••••••" variant="outlined" value={values.confirm_password} onChange={handleChange} onBlur={handleBlur} error={!!(touched.confirm_password && errors.confirm_password)} helperText={touched.confirm_password && errors.confirm_password} fullWidth sx={inputSx} InputProps={eyeBtn(showCf, () => setShowCf(!showCf))} />
        </Box>

        <Box>
          <LabelText htmlFor="role">I am a</LabelText>
          <Select
            id="role"
            name="role"
            fullWidth
            value={values.role}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!(touched.role && errors.role)}
            sx={{
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#FFFFFF',
              fontSize: '0.9375rem',
              letterSpacing: '-0.01em',
              fontFamily: 'Inter, sans-serif',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.22)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0A84FF', borderWidth: '2px' },
              '& .MuiSvgIcon-root': { color: 'rgba(235,235,245,0.4)' },
              '& .MuiSelect-select': { padding: '13px 14px' },
            }}
          >
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="teacher">Teacher / Instructor</MenuItem>
          </Select>
        </Box>

        {roleFields.map((field) => (
          <Box key={field.id}>
            <LabelText htmlFor={field.id}>{field.label}</LabelText>
            <CustomTextField
              id={field.id}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              variant="outlined"
              value={values[field.name] || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!(touched[field.name] && errors[field.name])}
              helperText={touched[field.name] && errors[field.name]}
              fullWidth
              sx={inputSx}
            />
          </Box>
        ))}

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
            mt: 0.5,
            '&:hover': {
              background: '#409CFF',
              boxShadow: '0 6px 20px rgba(10,132,255,0.5)',
            },
          }}
        >
          Create Account
        </Button>
      </Stack>
      {subtitle}
    </Box>
  );
};

export default AuthRegister;
