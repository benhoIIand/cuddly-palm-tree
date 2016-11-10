var exec = require('exec-ssh');
var wol = require('wol');
var args = require('yargs').argv;

wol.wake('', error => {
    if (error) {
        throw Error(error);
    }

    var command = ['node', args.script].join(' ');

    exec(command, args.user).pipe(process.stdout);
    exec('shutdown -s', args.user).pipe(process.stdout);
});
