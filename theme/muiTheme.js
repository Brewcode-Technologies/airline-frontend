import { createTheme } from '@mui/material/styles';
import { colors } from './colors';
import { typography } from './typography';

const muiTheme = createTheme({
  palette: {
    primary: { main: colors.primary },
    secondary: { main: colors.secondary },
    background: { default: colors.background },
  },
  typography,
});

export default muiTheme;
