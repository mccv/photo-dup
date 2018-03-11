const checksum = require('checksum')
const fs = require('fs')
const walk = require('walk')

const argv = require('yargs') //eslint-disbale-line
      .default({ root: process.env['HOME'], deleteFiles: false})
      .argv

const locations = {}

const shouldCheck = (name) => {
  return name.toLowerCase().match(/.jpg|.png/)
}

const options = {
  followLinks: true,
  listeners: {
    file: (root, fileStats, next) => {
      const fullPath = `${root}/${fileStats.name}`
      if (shouldCheck(fileStats.name)) {
        checksum.file(fullPath, (err, sum) => {
          if (err) {
            console.log(`got ${err} checking file ${fullPath}`)
          } else if (!locations[sum]) {
            locations[sum] = [fullPath]
          } else {
            locations[sum].push(fullPath)
          }
          next()
        })
      } else {
        next()
      }
    },
    errors: (root, nodeStatsArray, next) => {
      console.log(`error reading ${root}`)
      next()
    },
    end: () => {
      console.log('all done')
      for (const key in locations) {
        if (locations.hasOwnProperty(key)) {
          const files = locations[key]
          if (files.length > 1) {
            console.log(`${files}`)
            if (argv._) {
              argv._.forEach( prefix => {
                files.forEach( file => {
                  if (file.startsWith(prefix)) {
                    if (argv.deleteFiles) {
                      console.log(`deleting file ${file}`)
                      fs.unlink(file)
                    } else {
                      console.log(`would delete ${file}`)
                    }
                  }
                })
              })
            }
          }
        }
      }
    },
  },
}

walk.walk(argv.root, options)


