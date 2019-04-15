import vdf from './src/index';

(async () => {
    const vdfInstance = await vdf();
    const res = vdfInstance.generate(3, Buffer.from('aa', 'hex'), 2048, false);
    console.log(Buffer.from(res).toString('hex'));
    console.log(vdfInstance.verify(3, Buffer.from('aa', 'hex'), res, 2048, false));
})();
