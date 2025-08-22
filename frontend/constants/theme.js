export const COLORS = {
    primary: '#6B4E3D',    // Brown Clay
    accent: '#9BB97C',     // Soft Green
    background: '#F2E9E0', // Warm Beige
    surface: '#FFFFFF',    // White
    textPrimary: '#2D1F14',// Dark Brown
    textSecondary: '#6B6B6B',// Medium Brown/Grey
    divider: '#E5DED7',    // Divider / Border
    highlight: '#FFD966',  // Pastel Yellow
    disabled: '#CCCCCC',   // Disabled / Muted Grey
};

export const SIZES = {
    // font sizes
    h1: 24,
    h2: 20,
    body: 16,
    caption: 12,

    // spacing
    padding: 20,
    margin: 16,
    radius: 20, // Card radius
    buttonRadius: 12,
};

export const FONTS = {
    h1: { fontFamily: 'Poppins-SemiBold', fontSize: SIZES.h1 },
    h2: { fontFamily: 'Poppins-SemiBold', fontSize: SIZES.h2 },
    body: { fontFamily: 'Inter-Regular', fontSize: SIZES.body },
    bodyBold: { fontFamily: 'Inter-Medium', fontSize: SIZES.body },
    caption: { fontFamily: 'Inter-Regular', fontSize: SIZES.caption },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
