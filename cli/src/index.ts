import * as readline from 'readline';
import * as fs from 'fs';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const filePath = 'index.json';

interface WalletData {
    publicKey: string;
    secretKey: string;
}

const wallets: WalletData[] = [];

function displayMenu() {
    console.log("\n--- Solana CLI ---");
    console.log("1. Create a new wallet");
    console.log("2. List all wallets");
    console.log("3. Airdrop SOL");
    console.log("4. Exit");
    rl.question("Enter your choice: ", handleUserInput);
}

function handleUserInput(input: string){
    switch(input){
        case "1": 
            createWallet();
            break;
        case "2":
            const wallets = getWallets();
            console.log("\nWallet List:");
            wallets.forEach((wallet, index) => {
                console.log(`\nWallet ${index + 1}:`);
                console.log(`Public Key: ${wallet.publicKey}`);
                console.log(`Secret Key: ${wallet.secretKey}`);
            });
            displayMenu();
            break;
        case "3":
            airdropSOL();
            break;
        case "4":
            console.log("Exiting...");
            rl.close();
            break;
        default:
            console.log("Invalid option. Please try again.");
            displayMenu();
            break;
    }
}

function createWallet(): void{
    const wallet = Keypair.generate();
    const walletData = {
        publicKey: wallet.publicKey.toBase58(),
        secretKey: Buffer.from(wallet.secretKey).toString('base64')
    };
    wallets.push(walletData);
    fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2));
    console.log(`Wallet created successfully!`);
    console.log(`Public Key: ${walletData.publicKey}`);
    rl.question('\nPress Enter to continue...', () => {
        displayMenu();
        rl.prompt();
    });
}

function getWallets(): WalletData[] {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        console.error("Error reading wallets file:", error);
        return [];
    }
}

function airdropSOL(){
    rl.question("Enter the public key of the wallet to airdrop SOL and the amount: ", async (input) => {
        const [publicKey, amount] = input.split(/[, ]+/);
        const connection = new Connection(process.env.RPC_URL || 'https://api.devnet.solana.com');
        try {
            const wallet = new PublicKey(publicKey.trim());
            const signature = await connection.requestAirdrop(wallet, LAMPORTS_PER_SOL * Number(amount));
            console.log(`Airdropped ${amount} SOL to ${publicKey} at ${signature}`);
        } catch (error) {
            console.error("Error airdropping SOL:", error);
        }
        displayMenu();
        rl.prompt();
    });
}

displayMenu();