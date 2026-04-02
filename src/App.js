import {RouterProvider} from "react-router-dom";
import { ConfigProvider, theme } from 'antd';
import AppRouter from "./router";
import { ThemeProvider, useThemeMode } from "./config/themeContext";

const AppContent = () => {
  const { isDark } = useThemeMode();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: isDark
          ? {
              colorBgBase: '#2a2d31',
              colorTextBase: '#e9eaec',
            }
          : {},
      }}
    >
      <RouterProvider router={AppRouter}/>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App;
