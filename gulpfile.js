var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    uglify = require('gulp-uglify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer')

function handleErr(err){
  console.log(err.message)
  notify(err.message)
  this.emit("end")
}

gulp.task('styles', function() {
  return gulp.src('src/styles/*.css')
  .pipe(autoprefixer('last 2 version'))
  .on('error', handleErr)
  .pipe(gulp.dest('dev/styles'))
  .pipe(rename({ suffix: '.min' }))
  .pipe(cache(minifycss()))
  .on('error', handleErr)
  .pipe(gulp.dest('dist/styles'))
})

gulp.task('browserify', function() {

	return browserify({
    	entries: 'src/scripts/entry.js',
    	debug: true
  })
  .transform(
    babelify.configure({
		  stage: 0
    })
  )
  .bundle()
  .on('error', handleErr)
  .pipe(source('bundle.js'))
  .pipe(gulp.dest('dev/scripts'))
  .pipe(buffer())
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('dist/scripts'))

})

gulp.task('reload', function (){
  
  livereload.changed()

})

gulp.task('watch', function() {

  livereload.listen()

  gulp.watch('src/styles/*.css', ['styles'])
  gulp.watch('src/scripts/*.js', ['browserify'])

  gulp.watch('dist/styles/*.css').on('change', livereload.changed)
  gulp.watch('dist/scripts/*.js').on('change', livereload.changed)

  gulp.watch('dev/styles/*.css').on('change', livereload.changed)
  gulp.watch('dev/scripts/*.js').on('change', livereload.changed)

})