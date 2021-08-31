const config = require('./config')
const {
    bg, get_bg
} = require('./utils.js')
const captureWebsite = require('capture-website')
const hb = require('handlebars')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const files = fs.readdirSync(path.resolve(config.img_dir))
const template = hb.compile(fs.readFileSync('./template.html', {
    encoding: 'utf-8'
}))
const backgrounds = fs.readdirSync(path.resolve(config.bg_dir))
let bg_paths = backgrounds.map(e=>{
    return path.resolve(__dirname,config.bg_dir,e)
})
bg_paths = bg_paths.filter(e=>e.match(/\.png$/))
let serial = 0

async function main() {
    for (const file of files) {
        let ext = file.slice(-4)
        let model = file.slice(0, 4)
        let base_name = file.slice(0, -4)
        let file_path = path.join(__dirname, config.img_dir, file)

        let color = false
        console.log('processing: ' + path.join(__dirname, config.out_dir, base_name + ext))
        let img = "data:image/png;base64," + Buffer.from(fs.readFileSync(file_path)).toString('base64')
        let bg_img = get_bg(bg_paths,config.bg_img_chance)
        let bg_img64 = bg_img ? "data:image/png;base64," + Buffer.from(fs.readFileSync(bg_img)).toString('base64') : false
        if (base_name.indexOf('c') > -1 || base_name.indexOf('C') > -1) color = 'c'
        if (base_name.indexOf('w') > -1 || base_name.indexOf('W') > -1) color = 'w'
        if (base_name.indexOf('g') > -1 || base_name.indexOf('G') > -1) color = 'g'
        if (base_name.indexOf('b') > -1 || base_name.indexOf('B') > -1) color = 'b'

        let hues = [0]
        if (color === 'c') hues = [0, 40, 80, 120, 160, 200, 240, 280, 320]
        for (const hue of hues) {
            let data = {
                hue: hue, //hue shift
                crop: 128, //crop & transform origin from spreadsheet
                img: img, // actual image
                bg: bg(),
                bg_img: bg_img64
            }
            let output_file_name = base_name + (color === 'c' ? (hue).toString().padStart(3, '0') : '000') + '_'+(serial).toString().padStart(4,'0')+'.webp';
            serial++;
            // let currentCar

            let out_path = path.join(__dirname, config.out_dir, output_file_name)
            if (config.overwrite || !fs.existsSync(out_path)) {
                let buffer = await captureWebsite.buffer(template(data), config.capture);
                sharp(buffer).webp({
                    quality: config.sharp.quality,
                    lossless: config.sharp.lossless,
                    pageHeight: config.sharp.pageHeight,
                    loop: config.sharp.loop,
                    delay: config.sharp.delay
                }).toFile(out_path).then(async info => {
                    console.log('saved: ' + out_path)
                })
            } else {
                console.log(out_path + ' exsists, skipping overwrite')
            }
        }

    }
    if(config.generate_gifs){

    }
}
main()
