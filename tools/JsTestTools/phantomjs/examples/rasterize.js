if (phantom.state.length === 0) {
    if (phantom.args.length < 2 || phantom.args.length > 3) {
        console.log('Usage: rasterize.js URL filename [paperwidth*paperheight|paperformat]');
        console.log('  paper (pdf output) examples: "5in*7.5in", "10cm*20cm", "A4", "Letter"');
        phantom.exit();
    } else {
        var address = phantom.args[0];
        phantom.state = 'rasterize';
        phantom.viewportSize = { width: 600, height: 600 };
        if (phantom.args.length === 3 && phantom.args[1].substr(-4) === ".pdf") {
            var size = phantom.args[2].split('*');
            phantom.paperSize = size.length === 2 ? { width: size[0], height: size[1], border: '0px' }
                                                  : { format: phantom.args[2], orientation: 'portrait', border: '1cm' };
        }
        phantom.open(address);
    }
} else {
    var output = phantom.args[1];
    phantom.sleep(200);
    phantom.render(output);
    phantom.exit();
}
