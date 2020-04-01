$(document).ready(function () {
    AOS.init();
    $('#hamburger,#close').click(function () {
        $('#hamburger,#close').toggle();
        $('.custom-navigation, #links').toggleClass('visible');
    });
    setInterval(changeImage, autoCycleTime);
});
//You don't need to add density descriptors, the script does that automatically (provided you have -1x, -2x, -3x images)
var androidSrcs = {
    'customizeable': 'img/android/customizeable.png',
    'customColors': 'img/android/custom-colors.png',
    'customUI': 'img/android/hide-pages.png',
    'customHome': 'img/android/custom-home.png'
};
var iosSrcs = {
    'customizeable': 'img/ios/evaluations-custom.png',
    'customColors': 'img/ios/evaluations-white-v2.png',
    'customUI': 'img/ios/hide-pages.png',
    'customHome': 'img/ios/custom-home.png'
};
var currentPlt = 'ios';
var currentImageId = 'customizeable'
var platforms = ['ios', 'android'];
var autoCycleTime = 4000;

let imagePosition = 0;
var changeImage = function () {
    let keys;
    if (currentPlt == 'ios') {
        keys = Object.keys(iosSrcs);
    } else {
        keys = Object.keys(androidSrcs);
    }
    this.setImageVisibleJQERY(keys[imagePosition]);
    if (imagePosition == keys.length) {
        imagePosition = 0;
    }
};

function scrl(id) {
    document.getElementById(id).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    })
}
function changePlatform(to) {
    currentPlt = to;
    setImageVisibleJQERY(currentImageId);
    platforms.forEach(p => {
        if (p != to) {
            $(`#platform_${p}`).removeClass('btn-dark');
        } else {
            $(`#platform_${p}`).addClass('btn-dark');
        }
    });
}
function setImageVisibleJQERY(id) {
    let j = 0;
    Object.keys(androidSrcs).forEach(k => {
        if (k == id) {
            $(`#phonetext_${k}`).addClass('emulateTextHover');
            imagePosition = j + 1;
        } else {
            $(`#phonetext_${k}`).removeClass('emulateTextHover');
        }
        j++;
    });
    $("#phone").fadeTo(200, 0.20, function () {
        if (currentPlt == 'ios') {
            $("#phone").attr("src", iosSrcs[id]);
            $("#phone").attr(
                "srcset",
                `${iosSrcs[id].split('.')[0]}-1x.${iosSrcs[id].split('.')[1]} 1x,` +
                `${iosSrcs[id].split('.')[0]}-2x.${iosSrcs[id].split('.')[1]} 2x,` +
                `${iosSrcs[id].split('.')[0]}-3x.${iosSrcs[id].split('.')[1]} 3x`
            );
        } else {
            $("#phone").attr("src", androidSrcs[id]);
            $("#phone").attr(
                "srcset",
                `${androidSrcs[id].split('.')[0]}-1x.${androidSrcs[id].split('.')[1]} 1x,` +
                `${androidSrcs[id].split('.')[0]}-2x.${androidSrcs[id].split('.')[1]} 2x,` +
                `${androidSrcs[id].split('.')[0]}-3x.${androidSrcs[id].split('.')[1]} 3x`
            );
        }
    }).fadeTo(200, 1);
}

