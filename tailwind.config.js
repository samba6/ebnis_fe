const { colors } = require("tailwindcss/defaultTheme");

module.exports = {
  important: true,
  theme: {
    extend: {},
    colors: {
      ...colors,
      online: colors.blue[400],
      offline: colors.red[400],
      "part-offline": colors.red[200],
    },
  },
  variants: {},
  plugins: [],
};
