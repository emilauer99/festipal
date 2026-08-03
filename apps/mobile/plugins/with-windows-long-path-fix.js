// Windows long-path fix for native Android builds (dev machines only; no
// effect on the produced app). pnpm-hoisted monorepo paths still push
// CMake/ninja object paths past MAX_PATH on Windows:
//   1. SDK cmake 3.22.1's bundled ninja is not long-path aware -> pin
//      cmake 3.31.6 (ninja 1.12, works with LongPathsEnabled=1).
//   2. Object paths mirror the full source path under the .cxx staging dir ->
//      relocate staging near the drive root (C:/_cxx/<module>).
// Applied via config plugin so `expo prebuild` regenerating android/ cannot
// silently drop the fix (discovered during phase 03-06 on-device UAT).
const { withProjectBuildGradle } = require('expo/config-plugins');
const os = require('node:os');

const MARKER = '// festipal-windows-long-path-fix';

const GRADLE_BLOCK = `
${MARKER}
subprojects { proj ->
  proj.pluginManager.withPlugin('com.android.library') {
    proj.android.defaultConfig.externalNativeBuild.cmake.arguments '-DCMAKE_OBJECT_PATH_MAX=4096'
    proj.android.externalNativeBuild.cmake.buildStagingDirectory = new File("C:/_cxx/\${proj.name}")
    proj.android.externalNativeBuild.cmake.version = '3.31.6'
  }
  proj.pluginManager.withPlugin('com.android.application') {
    proj.android.defaultConfig.externalNativeBuild.cmake.arguments '-DCMAKE_OBJECT_PATH_MAX=4096'
    proj.android.externalNativeBuild.cmake.buildStagingDirectory = new File("C:/_cxx/\${proj.name}")
    proj.android.externalNativeBuild.cmake.version = '3.31.6'
  }
}
`;

module.exports = function withWindowsLongPathFix(config) {
  return withProjectBuildGradle(config, (gradleConfig) => {
    if (os.platform() !== 'win32') return gradleConfig;
    if (gradleConfig.modResults.contents.includes(MARKER)) return gradleConfig;
    gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
      'apply plugin: "expo-root-project"',
      `${GRADLE_BLOCK}\napply plugin: "expo-root-project"`,
    );
    return gradleConfig;
  });
};
