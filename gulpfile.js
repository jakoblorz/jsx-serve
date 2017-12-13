const fs = require("fs");
const path = require("path");
const typescript = require("gulp-typescript");
const tsproj = typescript.createProject("tsconfig.json");
const sourcemaps = require("gulp-sourcemaps")
const gulp = require("gulp");


function compileTypescript(fileSpec, folder) {
    return tsproj.src()
        .pipe(sourcemaps.init())
            .pipe(tsproj())
        .pipe(sourcemaps.write(".", { sourceRoot: function(file){ return file.cwd + '/src'; }}))
        .pipe(gulp.dest(folder));
}

gulp.task("default", function () {
    return compileTypescript("/src/**/*.ts", "dist");
});