module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      // react-native-reanimated MUST be last
      "react-native-reanimated/plugin",
    ],
  };
};
