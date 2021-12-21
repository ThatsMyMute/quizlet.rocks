module.exports = {
  transpileDependencies: ["vuetify"],
  productionSourceMap: false,
  configureWebpack: {
    devServer: {
      watchOptions: {
        ignored: /node_modules/
      }
    }
  },
  chainWebpack: config => {
    config.plugin("html").tap(args => {
      args[0].title =
        "Quizlet.Rocks - The only working Quizlet auto answer cheat";
      return args;
    });
  }
};
