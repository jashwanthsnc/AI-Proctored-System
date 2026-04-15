import { createTheme } from "@mui/material/styles";
import typography from "./Typography";
import { shadows } from "./Shadows";

//
// 🌞 LIGHT THEME (minimal, kept for compatibility)
//
const baselightTheme = createTheme({
  direction: "ltr",
  palette: {
    mode: "light",
    primary: {
      main: "#0071E3",
      light: "rgba(0,113,227,0.1)",
      dark: "#0051A2",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#555555",
      light: "#F5F5F5",
      dark: "#333333",
      contrastText: "#ffffff",
    },
    success: {
      main: "#34C759",
      light: "rgba(52,199,89,0.1)",
      dark: "#248A3D",
      contrastText: "#ffffff",
    },
    info: {
      main: "#32ADE6",
      light: "rgba(50,173,230,0.1)",
      dark: "#0071A4",
      contrastText: "#ffffff",
    },
    error: {
      main: "#FF3B30",
      light: "rgba(255,59,48,0.1)",
      dark: "#D70015",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#FF9500",
      light: "rgba(255,149,0,0.1)",
      dark: "#C93400",
      contrastText: "#ffffff",
    },
    text: {
      primary: "#1D1D1F",
      secondary: "#6E6E73",
    },
    background: {
      default: "#F5F5F7",
      paper: "#FFFFFF",
    },
    divider: "rgba(0,0,0,0.08)",
  },
  typography,
  shadows,
});

//
// 🌚 APPLE-INSPIRED DARK THEME
//
const basedarkTheme = createTheme({
  direction: "ltr",
  palette: {
    mode: "dark",
    primary: {
      main: "#0A84FF",
      light: "rgba(10,132,255,0.15)",
      dark: "#0066CC",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#636366",
      light: "rgba(99,99,102,0.2)",
      dark: "#48484A",
      contrastText: "#ffffff",
    },
    success: {
      main: "#30D158",
      light: "rgba(48,209,88,0.15)",
      dark: "#248A3D",
      contrastText: "#000000",
    },
    info: {
      main: "#64D2FF",
      light: "rgba(100,210,255,0.15)",
      dark: "#0071A4",
      contrastText: "#000000",
    },
    error: {
      main: "#FF453A",
      light: "rgba(255,69,58,0.15)",
      dark: "#D70015",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#FF9F0A",
      light: "rgba(255,159,10,0.15)",
      dark: "#C93400",
      contrastText: "#000000",
    },
    grey: {
      100: "#1C1C1E",
      200: "#2C2C2E",
      300: "#3A3A3C",
      400: "#48484A",
      500: "#636366",
      600: "#8E8E93",
      700: "#AEAEB2",
      800: "#C7C7CC",
      900: "#D1D1D6",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(235,235,245,0.6)",
      disabled: "rgba(235,235,245,0.18)",
    },
    background: {
      default: "#000000",
      paper: "#1C1C1E",
    },
    divider: "rgba(84,84,88,0.65)",
    action: {
      hover: "rgba(255,255,255,0.04)",
      selected: "rgba(10,132,255,0.12)",
      disabledBackground: "rgba(255,255,255,0.06)",
      hoverOpacity: 0.04,
    },
  },
  typography,
  shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#000000",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.15) transparent",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0,0,0,0.72)",
          backdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "0.5px solid rgba(84,84,88,0.65)",
          boxShadow: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#111111",
          borderRight: "0.5px solid rgba(84,84,88,0.65)",
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1C1C1E",
          border: "0.5px solid rgba(255,255,255,0.1)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.06)",
          borderRadius: "16px",
          backgroundImage: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1C1C1E",
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "980px",
          fontWeight: 600,
          fontSize: "0.9375rem",
          padding: "9px 20px",
          letterSpacing: "-0.01em",
          transition: "all 0.2s ease",
          "&:active": {
            transform: "scale(0.97)",
          },
        },
        sizeSmall: {
          fontSize: "0.8125rem",
          padding: "6px 14px",
          borderRadius: "980px",
        },
        sizeLarge: {
          fontSize: "1rem",
          padding: "12px 24px",
          borderRadius: "980px",
        },
        containedPrimary: {
          background: "#0A84FF",
          color: "#ffffff",
          boxShadow: "none",
          "&:hover": {
            background: "#409CFF",
            boxShadow: "none",
            transform: "none",
          },
          "&:active": {
            background: "#0066CC",
          },
        },
        outlinedPrimary: {
          borderColor: "#0A84FF",
          color: "#0A84FF",
          borderWidth: "1.5px",
          "&:hover": {
            borderColor: "#409CFF",
            backgroundColor: "rgba(10,132,255,0.08)",
            borderWidth: "1.5px",
          },
        },
        textPrimary: {
          color: "#0A84FF",
          "&:hover": {
            backgroundColor: "rgba(10,132,255,0.08)",
          },
        },
        containedSecondary: {
          backgroundColor: "rgba(255,255,255,0.12)",
          color: "#FFFFFF",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.18)",
            boxShadow: "none",
          },
        },
        containedError: {
          backgroundColor: "#FF453A",
          color: "#ffffff",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "#FF6961",
            boxShadow: "none",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "rgba(255,255,255,0.06)",
            "& fieldset": {
              borderColor: "rgba(255,255,255,0.12)",
              transition: "border-color 0.2s ease",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255,255,255,0.24)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#0A84FF",
              borderWidth: "2px",
            },
            "& input": {
              color: "#FFFFFF",
              fontSize: "0.9375rem",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              padding: "12px 14px",
            },
            "& input::placeholder": {
              color: "rgba(235,235,245,0.3)",
              opacity: 1,
            },
          },
          "& .MuiInputLabel-root": {
            color: "rgba(235,235,245,0.6)",
            fontSize: "0.9375rem",
            "&.Mui-focused": {
              color: "#0A84FF",
            },
          },
          "& .MuiFormHelperText-root": {
            fontSize: "0.75rem",
            marginLeft: "2px",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          backgroundColor: "rgba(255,255,255,0.06)",
        },
        icon: {
          color: "rgba(235,235,245,0.6)",
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          borderRadius: "0",
          border: "none",
          boxShadow: "none",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "separate",
          borderSpacing: "0 2px",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "0.5px solid rgba(84,84,88,0.45)",
          fontSize: "0.875rem",
          padding: "14px 16px",
          letterSpacing: "-0.005em",
        },
        head: {
          backgroundColor: "transparent",
          color: "rgba(235,235,245,0.5)",
          fontWeight: 500,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          borderBottom: "0.5px solid rgba(84,84,88,0.65)",
          paddingBottom: "10px",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.03)",
          },
          "&:last-child td": {
            borderBottom: "none",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "-0.01em",
          height: "26px",
        },
        colorPrimary: {
          backgroundColor: "rgba(10,132,255,0.15)",
          color: "#0A84FF",
          border: "none",
        },
        colorSuccess: {
          backgroundColor: "rgba(48,209,88,0.15)",
          color: "#30D158",
          border: "none",
        },
        colorError: {
          backgroundColor: "rgba(255,69,58,0.15)",
          color: "#FF453A",
          border: "none",
        },
        colorWarning: {
          backgroundColor: "rgba(255,159,10,0.15)",
          color: "#FF9F0A",
          border: "none",
        },
        colorInfo: {
          backgroundColor: "rgba(100,210,255,0.15)",
          color: "#64D2FF",
          border: "none",
        },
        colorDefault: {
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "rgba(235,235,245,0.6)",
          border: "none",
        },
        outlined: {
          backgroundColor: "transparent",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          transition: "background-color 0.15s ease",
          "&.Mui-selected": {
            backgroundColor: "rgba(10,132,255,0.15)",
            color: "#0A84FF",
            "&:hover": {
              backgroundColor: "rgba(10,132,255,0.2)",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#2C2C2E",
          color: "rgba(235,235,245,0.8)",
          border: "0.5px solid rgba(255,255,255,0.12)",
          borderRadius: "8px",
          fontSize: "0.75rem",
          padding: "6px 10px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        },
        arrow: {
          color: "#2C2C2E",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(84,84,88,0.65)",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0A84FF",
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: "0.875rem",
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: "0.625rem",
          minWidth: "16px",
          height: "16px",
          padding: "0 4px",
        },
        colorPrimary: {
          backgroundColor: "#FF453A",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#2C2C2E",
          border: "0.5px solid rgba(255,255,255,0.12)",
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.08)",
          padding: "4px",
        },
        list: {
          padding: "4px 0",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
          fontWeight: 400,
          borderRadius: "10px",
          margin: "1px 4px",
          padding: "8px 12px",
          letterSpacing: "-0.01em",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.08)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(10,132,255,0.12)",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "rgba(10,132,255,0.16)",
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          fontSize: "0.875rem",
          letterSpacing: "-0.005em",
          border: "0.5px solid",
        },
        standardError: {
          backgroundColor: "rgba(255,69,58,0.1)",
          borderColor: "rgba(255,69,58,0.3)",
          color: "#FF453A",
          "& .MuiAlert-icon": { color: "#FF453A" },
        },
        standardSuccess: {
          backgroundColor: "rgba(48,209,88,0.1)",
          borderColor: "rgba(48,209,88,0.3)",
          color: "#30D158",
          "& .MuiAlert-icon": { color: "#30D158" },
        },
        standardInfo: {
          backgroundColor: "rgba(100,210,255,0.1)",
          borderColor: "rgba(100,210,255,0.3)",
          color: "#64D2FF",
          "& .MuiAlert-icon": { color: "#64D2FF" },
        },
        standardWarning: {
          backgroundColor: "rgba(255,159,10,0.1)",
          borderColor: "rgba(255,159,10,0.3)",
          color: "#FF9F0A",
          "& .MuiAlert-icon": { color: "#FF9F0A" },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1C1C1E",
          backgroundImage: "none",
          border: "0.5px solid rgba(255,255,255,0.12)",
          borderRadius: "20px",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.0625rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          padding: "20px 20px 12px",
          borderBottom: "0.5px solid rgba(84,84,88,0.65)",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "20px",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 20px 20px",
          borderTop: "0.5px solid rgba(84,84,88,0.65)",
          gap: "8px",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: "100px",
          backgroundColor: "rgba(255,255,255,0.08)",
          height: "4px",
        },
        barColorPrimary: {
          background: "#0A84FF",
          borderRadius: "100px",
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: "#0A84FF",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          transition: "background-color 0.15s ease, opacity 0.15s ease",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.08)",
          },
          "&:active": {
            opacity: 0.7,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          "& .MuiSwitch-switchBase": {
            padding: 0,
            margin: 2,
            transitionDuration: "200ms",
            "&.Mui-checked": {
              transform: "translateX(16px)",
              color: "#fff",
              "& + .MuiSwitch-track": {
                backgroundColor: "#30D158",
                opacity: 1,
                border: 0,
              },
            },
          },
          "& .MuiSwitch-thumb": {
            boxSizing: "border-box",
            width: 22,
            height: 22,
          },
          "& .MuiSwitch-track": {
            borderRadius: 26 / 2,
            backgroundColor: "#39393D",
            opacity: 1,
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: "0.9375rem",
          letterSpacing: "-0.01em",
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "rgba(235,235,245,0.3)",
          "&.Mui-checked": {
            color: "#0A84FF",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
          letterSpacing: "-0.01em",
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          color: "rgba(235,235,245,0.4)",
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          lineHeight: "24px",
          paddingTop: "16px",
          paddingBottom: "4px",
        },
      },
    },
  },
});

export { baselightTheme, basedarkTheme };
