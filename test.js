const {Send4844Tx, EncodeBlobs, DecodeBlobs, DecodeBlob, BLOB_SIZE} = require("./send-4844-tx");
const {ethers, Contract} = require("ethers");
const fs = require('fs');
const os = require('os');

const stringToHex = (s) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));

async function readFile(contract, name) {
    const result = await contract.read(name);
    return result[0];
}

const saveFile = (data) => {
    console.log(data);
    const exp = new Date();
    const path = `${os.tmpdir()}/${exp.getTime()}`;
    fs.writeFileSync(path, data);
    return path;
}

const filePath = '/Users/Downloads/4.mp3';
const name = filePath.substring(filePath.lastIndexOf("/") + 1);
const hexName = stringToHex(name);

const contractAddress = '0x038dBAD58bdD56A2607D5CDf9a360D21E8F38F82'
const contractABI = [
    'function read(bytes memory name) public view returns (bytes memory, bool)',
    'function writeChunk(bytes memory name, uint256[] memory chunkIds, uint256[] memory sizes) public payable'
]

async function uploadFile() {
    const provider = new ethers.providers.JsonRpcProvider('https://rpc.dencun-devnet-8.ethpandaops.io/');
    const contract = new Contract(contractAddress, contractABI, provider);

    const content = fs.readFileSync(filePath);
    const blobs = EncodeBlobs(content);

    const send4844Tx = new Send4844Tx('https://rpc.dencun-devnet-8.ethpandaops.io/', 'private key');
    const blobLength = blobs.length;
    for (let i = 0; i < blobLength; i += 2) {
        let blobArr = [];
        let indexArr = [];
        let lenArr = [];
        if (i + 1 < blobLength) {
            blobArr = [blobs[i], blobs[i + 1]];
            indexArr = [i, i + 1];
            lenArr = [BLOB_SIZE, BLOB_SIZE];
        } else {
            blobArr = [blobs[i]];
            indexArr = [i];
            lenArr = [BLOB_SIZE];
        }

        const tx = await contract.populateTransaction.writeChunk(hexName, indexArr, lenArr, {
            value: 10000000000000000
        });
        const hash = await send4844Tx.sendTx(blobArr, tx);
        console.log(hash);
        const txReceipt = await send4844Tx.getTxReceipt(hash);
        console.log(txReceipt);
    }
}

async function read() {
    console.log(hexName);
    const providerRead = new ethers.providers.JsonRpcProvider('http://65.109.63.154:9545');
    const contractRead = new Contract(contractAddress, contractABI, providerRead);
    const blobs = await readFile(contractRead, hexName);
    console.log(blobs.length);
    const data = DecodeBlobs(blobs);
    const path = saveFile(data);
    console.log(path);
}

uploadFile();
// read();
