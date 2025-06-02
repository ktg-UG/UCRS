import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            main: "#7FFF00",
        },
        secondary: {
            main: "#FFFF00",
        },
    },
    typography: {
        fontFamily: 'var(--font-geist-sans), sans-serif',
    },
});

export default theme;
