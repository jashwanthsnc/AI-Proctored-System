// Theme Provider
import { CssBaseline, ThemeProvider } from '@mui/material';
import { basedarkTheme } from './theme/DefaultColors';
// Router Provider
import { RouterProvider } from 'react-router-dom';
import Router from './routes/Router';

// Redux Provider
import { Provider } from 'react-redux';
import store from './store';
// Tostify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Cheating Log Provider
import { CheatingLogProvider } from './context/CheatingLogContext';

function App() {
  const theme = basedarkTheme;
  return (
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <CheatingLogProvider>
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            limit={3}
          />
          <CssBaseline />
          <RouterProvider router={Router} />
        </CheatingLogProvider>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
