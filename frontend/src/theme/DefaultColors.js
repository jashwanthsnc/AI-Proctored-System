import { createTheme } from "@mui/material/styles";
import typography from "./Typography";
import { shadows } from "./Shadows";

//
// 🌞 LIGHT THEME
//
const baselightTheme = createTheme({
  direction: "ltr",
  palette: {
    mode: "light",
    primary: {
      main: "#5D87FF",
      light: "#ECF2FF",
      dark: "#4570EA",
    },
    secondary: {
      main: "#49BEFF",
      light: "#E8F7FF",
      dark: "#23afdb",
    },
    success: {
      main: "#13DEB9",
      light: "#E6FFFA",
      dark: "#02b3a9",
      contrastText: "#ffffff",
    },
    info: {
      main: "#539BFF",
      light: "#EBF3FE",
      dark: "#1682d4",
      contrastText: "#ffffff",
    },
    error: {
      main: "#FA896B",
      light: "#FDEDE8",
      dark: "#f3704d",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#FFAE1F",
      light: "#FEF5E5",
      dark: "#ae8e59",
      contrastText: "#ffffff",
    },
    purple: {
      A50: "#EBF3FE",
      A100: "#6610f2",
      A200: "#557fb9",
    },
    grey: {
      100: "#F2F6FA",
      200: "#EAEFF4",
      300: "#DFE5EF",
      400: "#7C8FAC",
      500: "#5A6A85",
      600: "#2A3547",
    },
    text: {
      primary: "#2A3547",
      secondary: "#5A6A85",
    },
    background: {
      default: "#f6f9fc",
      paper: "#ffffff",
    },
    divider: "#e5eaef",
    action: {
      disabledBackground: "rgba(73,82,88,0.12)",
      hoverOpacity: 0.02,
      hover: "#f6f9fc",
    },
  },
  typography,
  shadows,
});

//
// 🌚 DARK THEME
//
const basedarkTheme = createTheme({
  direction: "ltr",
  palette: {
    mode: "dark",
    primary: {
      main: "#5D87FF",
      light: "#2A3547",
      dark: "#4570EA",
    },
    secondary: {
      main: "#49BEFF",
      light: "#1E293B",
      dark: "#23afdb",
    },
    success: {
      main: "#13DEB9",
      light: "#093B3A",
      dark: "#02b3a9",
      contrastText: "#ffffff",
    },
    info: {
      main: "#539BFF",
      light: "#1E293B",
      dark: "#1682d4",
      contrastText: "#ffffff",
    },
    error: {
      main: "#FA896B",
      light: "#3B1813",
      dark: "#f3704d",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#FFAE1F",
      light: "#3B2A1A",
      dark: "#ae8e59",
      contrastText: "#ffffff",
    },
    purple: {
      A50: "#312E81",
      A100: "#6610f2",
      A200: "#4F46E5",
    },
    grey: {
      100: "#1E293B",
      200: "#273142",
      300: "#2D3748",
      400: "#94A3B8",
      500: "#A3AED0",
      600: "#CBD5E1",
    },
    text: {
      primary: "#E2E8F0",
      secondary: "#94A3B8",
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    divider: "rgba(255,255,255,0.12)",
    action: {
      disabledBackground: "rgba(255,255,255,0.08)",
      hoverOpacity: 0.1,
      hover: "rgba(255,255,255,0.05)",
    },
  },
  typography,
  shadows,
});

export { baselightTheme, basedarkTheme };
